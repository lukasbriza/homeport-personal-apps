import { Readable } from 'node:stream'

import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosResponse } from 'axios'
import { validate, validateOrReject } from 'class-validator'
import * as puppeteer from 'puppeteer'

import { WithLogger } from '../../classes/with-logger'
import { PrivateLogMethod, ServiceLogMethod } from '../../decorators'
import { ApiUrlConstructorService } from '../../services/api-url-constructor'
import { AppConfigTypes, ExtendedPupeteerDto, PuppeteerDto } from '../../types'
import {
  processFileResponse,
  axiosCallWrapper,
  axiosRetryCall,
  getErrorMessage,
  getValidationMessageFromErrorArray,
  parseCsvString,
} from '../../utils'

import { EicLoginDto, EicTransactionsAndOrdersDto, FeeDto, FeesDto } from './eic-scraper.dto'
import { csvTransactionsToTransactionDto, csvOrderToOrdersDto } from './mappers'
import { ExtendedEICWindow, FeeScrapeResult } from './types'

@Injectable()
export class EicScraperService extends WithLogger {
  constructor(
    private readonly apiUrlConstructor: ApiUrlConstructorService,
    private readonly configService: ConfigService<AppConfigTypes, true>,
  ) {
    super(EicScraperService.name)
  }

  /**
   * Verify if provided page is in logged state or not.
   * @param page Page for log in verification.
   * @returns If is user logged in.
   */
  @PrivateLogMethod()
  private async isLogedIn(page: puppeteer.Page): Promise<boolean> {
    try {
      const header = await page.waitForSelector('div[class="header"]', { timeout: 5000 })
      return header !== null
    } catch (error) {
      this.logger.error(`'Unable to to find dashboard header. ${(error as Error).message}`)
      return false
    }
  }

  /**
   * Proces login verification flow.
   * @param page Tested page.
   * @param method Tested method.
   */
  @PrivateLogMethod()
  private async isLoggedInVerification(page: puppeteer.Page, method: string) {
    const loggedIn = await this.isLogedIn(page)

    if (loggedIn === false) {
      const message = `To perform ${method} method, you must first log in.`
      this.logger.error(message)
      throw new Error(message)
    }
  }

  /**
   * Create new new page and login to EIC, then returns that page.
   * @param loginDto Login credentials.
   * @returns Processed page.
   */
  @PrivateLogMethod()
  private async login(loginDto: EicLoginDto): Promise<PuppeteerDto> {
    const eicUrl = this.apiUrlConstructor.getEicBaseUrl()
    const browser = await puppeteer.launch({ browser: 'chrome', headless: true })
    const [page] = await browser.pages()

    await page.goto(eicUrl)
    await page.type('input[name="j_username"]', loginDto.login)
    await page.type('input[name="j_password"]', loginDto.password)
    await page.click('input[name="login"]')

    const sucessfulyLogin = await this.isLogedIn(page)

    if (sucessfulyLogin === false) {
      await page.close()
      const message = 'Unable to login to EIC.'
      this.logger.error(message)
      throw new Error(message)
    }

    this.logger.debug('Succesfully logged into EIC.')
    return { actualPage: page, browser }
  }

  /**
   * Download and stringify EIC transactions csv file.
   * @param loggedDto Actual page and browser object.
   * @returns Page and browser with transactions content.
   */
  @PrivateLogMethod()
  private async getAllTransactionsFile(loggedDto: PuppeteerDto): Promise<ExtendedPupeteerDto<{ fullContent: string }>> {
    const { actualPage, browser } = loggedDto
    await this.isLoggedInVerification(actualPage, 'getAllTransactionsFile')
    await actualPage.waitForNetworkIdle({ idleTime: 2000 })

    const cookies = await browser.cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
    const url = this.apiUrlConstructor.getEicTransactionsDownloadUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<Readable>>(
        () =>
          axios.get<Readable>(url, {
            headers: {
              Cookie: cookieHeader,
            },
            responseType: 'stream',
          }),
        300_000,
        this.logger,
        3,
      )

      const fileData = await processFileResponse(response.data)

      return {
        actualPage,
        browser,
        fullContent: fileData,
      }
    }, 'getAllTransactionsFile')
  }

  /**
   * Download csv file with all orders.
   * @param loggedDto Actual page and browser object.
   * @returns Page and browser with orders content.
   */
  @PrivateLogMethod()
  private async getOrdersFile(loggedDto: PuppeteerDto): Promise<ExtendedPupeteerDto<{ fullContent: string }>> {
    const { actualPage, browser } = loggedDto
    await this.isLoggedInVerification(actualPage, 'getOrdersFile')
    await actualPage.waitForNetworkIdle({ idleTime: 2000 })

    const cookies = await browser.cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
    const url = this.apiUrlConstructor.getEicOrdersDownloadUrl()

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<Readable>>(
        () =>
          axios.get<Readable>(url, {
            headers: {
              Cookie: cookieHeader,
            },
            responseType: 'stream',
          }),
        30_000,
        this.logger,
        3,
      )

      const fileData = await processFileResponse(response.data)

      return {
        actualPage,
        browser,
        fullContent: fileData,
      }
    }, 'getOrdersFile')
  }

  @PrivateLogMethod()
  private getCurrencyFromFeeScraperResult(result: FeeScrapeResult) {
    let currency

    if (result.baggageFee !== '-' && currency === undefined) {
      const target = result.baggageFee.split(' ')?.[1]
      currency = target
      return currency
    }

    if (result.managementFee !== '-' && currency === undefined) {
      const target = result.managementFee.split(' ')?.[1]
      currency = target
      return currency
    }

    if (result.processingFee !== '-' && currency === undefined) {
      const target = result.processingFee.split(' ')?.[1]
      currency = target
      return currency
    }

    throw new HttpException('Unable to extract currency from scraper result.', HttpStatus.NOT_FOUND)
  }

  @PrivateLogMethod()
  private async getFeesRecords(loggedDto: PuppeteerDto): Promise<FeesDto> {
    const { actualPage } = loggedDto
    await this.isLoggedInVerification(actualPage, 'getFeesRecords')
    await actualPage.waitForNetworkIdle({ idleTime: 2000 })

    const hasFeeTable = await actualPage.evaluate(() => {
      let found = false
      const options = document.querySelectorAll('option')

      for (const optionElement of options) {
        const isSelected = optionElement.selected

        if (isSelected && optionElement.textContent?.includes('Záväzky a poplatky mesačne')) {
          found = true
        }
      }

      return found
    })

    if (hasFeeTable === false) {
      throw new HttpException('No fee table in EIC displayed.', HttpStatus.NOT_FOUND)
    }

    await actualPage.evaluate(() => {
      ;(window as unknown as ExtendedEICWindow).getTargetTableRoot = function () {
        const options = document.querySelectorAll('option')
        const optionComponent = [...options].find((optionElement) => {
          const isSelected = optionElement.selected
          return isSelected && optionElement.textContent?.includes('Záväzky a poplatky mesačne')
        })
        const tableRoot =
          optionComponent?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement ??
          undefined
        return tableRoot
      }
    })

    await actualPage.evaluate(() => {
      ;(window as unknown as ExtendedEICWindow).getPageNumber = function () {
        const tableRoot = (window as unknown as ExtendedEICWindow).getTargetTableRoot()
        const paginationRoot = tableRoot?.getElementsByClassName('pagination')[0]
        const links = [...(paginationRoot?.getElementsByTagName('a') ?? [])]
        const target = links.find((element) => element.textContent !== '<' && element.textContent !== '>')
        return target?.textContent ?? undefined
      }
    })

    await actualPage.evaluate(() => {
      ;(window as unknown as ExtendedEICWindow).prevPage = function () {
        const tableRoot = (window as unknown as ExtendedEICWindow).getTargetTableRoot()
        const paginationRoot = tableRoot?.getElementsByClassName('pagination')[0]
        const links = [...(paginationRoot?.getElementsByTagName('a') ?? [])]
        const target = links.find((element) => element.textContent === '<')
        return target
      }
    })

    await actualPage.evaluate(() => {
      ;(window as unknown as ExtendedEICWindow).nextPage = function () {
        const tableRoot = (window as unknown as ExtendedEICWindow).getTargetTableRoot()
        const paginationRoot = tableRoot?.getElementsByClassName('pagination')[0]
        const links = [...(paginationRoot?.getElementsByTagName('a') ?? [])]
        const target = links.find((element) => element.textContent === '>')
        return target
      }
    })

    await actualPage.evaluate(() => {
      ;(window as unknown as ExtendedEICWindow).getTableData = function () {
        const tableRoot = (window as unknown as ExtendedEICWindow).getTargetTableRoot()
        const table = [...(tableRoot?.getElementsByTagName('table') ?? [])].find((table) =>
          table.className.includes('poplatky'),
        )

        const rowsCollection = table?.getElementsByTagName('tr')
        const [, ...rows] = [...(rowsCollection ?? [])]
        const rowDataArray = [...(rows ?? [])].map((row) => {
          const dataElements = row.querySelectorAll('td')
          return {
            year: dataElements[0].textContent?.split('/')[1],
            month: dataElements[0].textContent?.split('/')[0],
            processingFee: dataElements[3].textContent ?? '-',
            managementFee: dataElements[4].textContent ?? '-',
            baggageFee: dataElements[5].textContent ?? '-',
          }
        })
        return rowDataArray
      }
    })

    actualPage.setDefaultTimeout(300_000)
    let tableData: FeeScrapeResult[] = []

    const recursiveDataScrape = async () => {
      const data = await actualPage.evaluate(() => (window as unknown as ExtendedEICWindow).getTableData())
      tableData = [...tableData, ...data]

      const actualPagination = await actualPage.evaluate(() => (window as unknown as ExtendedEICWindow).getPageNumber())
      await actualPage.evaluate(() => {
        const nextLink = (window as unknown as ExtendedEICWindow).nextPage()
        nextLink?.click()
      })
      await actualPage.waitForNetworkIdle()
      const nextPagination = await actualPage.evaluate(() => (window as unknown as ExtendedEICWindow).getPageNumber())

      if (actualPagination === nextPagination) {
        return
      }

      await recursiveDataScrape()
    }

    await recursiveDataScrape()

    this.logger.debug(`Sraped EIC fee table with ${tableData.length} records.`)

    const currency = tableData.find(
      (data) =>
        data.managementFee.split(' ')?.[1] !== undefined ||
        data.baggageFee.split(' ')?.[1] !== undefined ||
        data.processingFee.split(' ')?.[1] !== undefined,
    )

    if (!currency) {
      throw new HttpException('No currency found in table data.', HttpStatus.NOT_FOUND)
    }

    const resolvedCurrency = this.getCurrencyFromFeeScraperResult(currency)
    this.logger.debug(`Resolved fee currency is ${resolvedCurrency}.`)

    const fees: FeeDto[] = tableData.map((data) => ({
      managementFee: data.managementFee === '-' ? 0 : Number(data.managementFee?.split(' ')[0].slice(1)),
      baggageFee: data.baggageFee === '-' ? 0 : Number(data.baggageFee?.split(' ')[0].slice(1)),
      processingFee: data.processingFee === '-' ? 0 : Number(data.processingFee?.split(' ')[0].slice(1)),
      date: data.year && data.month ? new Date(Number(data.year), Number(data.month) - 1) : undefined,
    }))

    await validateOrReject(fees)

    return {
      fees,
      currency: resolvedCurrency,
    }
  }

  /**
   * PUBLIC METHODS
   */
  /**
   * Get all transactions and orders and fees for EIC account.
   * @returns Transactions and orders.
   */
  @ServiceLogMethod()
  public async getAllTransactionsAndOrdersAndFees(): Promise<EicTransactionsAndOrdersDto> {
    const eicLogin = this.configService.get<string>('EIC_LOGIN', { infer: true })
    const eicPassword = this.configService.get<string>('EIC_PASSWORD', { infer: true })

    if (eicLogin === undefined || eicPassword === undefined) {
      throw new Error('EIC login or password is not provided.')
    }

    const loggedPupeteerDto = await this.login({
      login: eicLogin,
      password: eicPassword,
    })

    const fees = await this.getFeesRecords({
      actualPage: loggedPupeteerDto.actualPage,
      browser: loggedPupeteerDto.browser,
    })

    const {
      actualPage: transactionPage,
      browser: transactionBrowser,
      fullContent: transactionsRawContent,
    } = await this.getAllTransactionsFile(loggedPupeteerDto)

    const { browser: ordersBrowser, fullContent: ordersRawContent } = await this.getOrdersFile({
      actualPage: transactionPage,
      browser: transactionBrowser,
    })

    try {
      const parsedTransactions = parseCsvString(transactionsRawContent)
      this.logger.debug('Transaction file parsed.')

      const parsedOrders = parseCsvString(ordersRawContent)
      this.logger.debug('Order file parsed.')

      const { transactions } = csvTransactionsToTransactionDto(parsedTransactions)
      const { orders } = csvOrderToOrdersDto(parsedOrders)

      const result: EicTransactionsAndOrdersDto = {
        transactions,
        orders,
        fees,
      }

      const validationErrors = await validate(result)
      const validationMessage = getValidationMessageFromErrorArray(validationErrors)

      if (validationMessage) {
        throw new Error(validationMessage)
      }

      await ordersBrowser.close()
      return result
    } catch (error) {
      await ordersBrowser.close()
      const message = getErrorMessage('getAllTransactionsAndOrders', error)
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
