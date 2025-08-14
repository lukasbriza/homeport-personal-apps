import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import { validate, validateOrReject } from 'class-validator'
import puppeteer from 'puppeteer'

import { WithLogger } from '../../classes/with-logger'
import { ServiceLogMethod } from '../../decorators'
import { ApiUrlConstructorService } from '../../services/api-url-constructor'
import { axiosCallWrapper, axiosRetryCall, getValidationMessageFromErrorArray } from '../../utils'

import { JustEtfCountriesAndSectorsDto, JustEtfHistoricalData } from './just-etf-scraper.dto'
import { mapJustEtfResponse } from './mappers'
import { JustEtfResponse } from './types'

@Injectable()
export class JustEtfScraperService extends WithLogger {
  constructor(private readonly apiUrlConstructor: ApiUrlConstructorService) {
    super(JustEtfScraperService.name)
  }

  /**
   * Scrape historical data from Just ETF page for provided isin and date range.
   * @param isin Target ETF isin.
   * @param currency Target currency.
   * @param from Start date for historical data.
   * @param to End date for historical data.
   * @returns Historical data for provided isin.
   */
  @ServiceLogMethod()
  public async getHistoricalData(
    isin: string,
    currency: string,
    from?: Date,
    to?: Date,
  ): Promise<JustEtfHistoricalData | undefined> {
    const fetchUrl = this.apiUrlConstructor.getJustEtfHistoricalDataUrl(isin, currency, from, to)

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<JustEtfResponse>>(
        () => axios.get<JustEtfResponse>(fetchUrl),
        300_000,
        this.logger,
        3,
      )
      const mappedData = mapJustEtfResponse(response.data, isin, currency)
      await validateOrReject(mappedData)
      return mappedData ?? []
    }, 'getHistoricalData')
  }

  /**
   * Scrape countries and sectors for provided ETF.
   * @param isin Isin of etf to scrape.
   * @returns Countries and sectors.
   */
  @ServiceLogMethod()
  public async getCountriesAndSectors(isin: string): Promise<JustEtfCountriesAndSectorsDto> {
    const url = this.apiUrlConstructor.getJustEtfProfilePageUrl(isin)
    const browser = await puppeteer.launch({ browser: 'chrome', headless: true })
    const [page] = await browser.pages()

    await page.goto(url)
    await page.waitForNetworkIdle()

    const shownCookieModal = await page.evaluate(() => {
      const modal = document.querySelector('#CybotCookiebotDialog')
      return modal !== null
    })

    if (shownCookieModal) {
      await page.click('button[id="CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"]')
    }

    const data: JustEtfCountriesAndSectorsDto = {
      countries: undefined,
      sectors: undefined,
    }

    const hasCountries = await page.evaluate(() => {
      const [...headers] = document.querySelectorAll('h3')
      const countryHeader = headers.find((header) => header.textContent?.includes('Countries'))
      return countryHeader !== undefined
    })

    const hasSectors = await page.evaluate(() => {
      const [...headers] = document.querySelectorAll('h3')
      const sectorHeader = headers.find((header) => header.textContent?.includes('Sectors'))
      return sectorHeader !== undefined
    })

    if (hasCountries) {
      const countriesData = await page.evaluate(() => {
        const [...headers] = document.querySelectorAll('h3')
        const countryHeader = headers.find((header) => header.textContent?.includes('Countries'))
        const rows = countryHeader?.parentElement?.querySelectorAll('tr')
        const countries: { country: string; weight: number }[] = []

        if (rows) {
          for (const row of rows) {
            const data = row.querySelectorAll('td')
            const country = data[0].textContent
            const weight = data[1].children[0].children[0].textContent

            if (country && weight) {
              const formattedWeight = Number(weight.slice(0, -1)) / 100
              countries.push({ weight: formattedWeight, country })
            }
          }
        }

        return countries
      })

      const countriesWeightValidation = countriesData.reduce((previous, next) => previous + next.weight, 0)

      if (countriesWeightValidation <= 0.99) {
        await browser.close()
        throw new HttpException(
          `Unable to scrape some countries data from just etf for isin ${isin}...`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      data.countries = countriesData
    }

    if (hasSectors) {
      const sectorsData = await page.evaluate(() => {
        const [...headers] = document.querySelectorAll('h3')
        const sectorHeader = headers.find((header) => header.textContent?.includes('Sectors'))

        const anchor = sectorHeader?.parentElement?.getElementsByTagName('a')
        if (anchor !== undefined && anchor.length > 0 && anchor[0].getAttribute('state') !== 'active') {
          anchor[0].click()
        }

        const rows = sectorHeader?.parentElement?.querySelectorAll('tr')
        const sectors: { sector: string; weight: number }[] = []

        if (rows) {
          for (const row of rows) {
            const data = row.querySelectorAll('td')
            const sector = data[0].textContent
            const weight = data[1].children[0].children[0].textContent

            if (sector && weight) {
              const formattedWeight = Number(weight.slice(0, -1)) / 100
              sectors.push({ weight: formattedWeight, sector })
            }
          }
        }

        return sectors
      })

      const onlyOtherSector = sectorsData.length === 1 && sectorsData[0].sector === 'Other'
      const sectorsWeightValidation = sectorsData.reduce((previous, next) => previous + next.weight, 0)

      if (sectorsWeightValidation <= 0.99 && onlyOtherSector === false) {
        await browser.close()
        throw new HttpException(
          `Unable to scrape some sectors data from just etf for isin ${isin}...`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      data.sectors = sectorsData
    }

    const validationErrors = await validate(data)
    const validationMessage = getValidationMessageFromErrorArray(validationErrors)

    if (validationMessage) {
      throw new HttpException(validationMessage, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    await browser.close()

    return data
  }
}
