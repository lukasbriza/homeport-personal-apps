import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { WithLogger } from '../../classes/with-logger'
import { PrivateLogMethod, ServiceLogMethod } from '../../decorators'
import { CountryCodesScraperService } from '../../scrapers/country-codes'
import { EicTransactionDto, FeeDto, FeesDto, FondDefinitionDto } from '../../scrapers/eic/eic-scraper.dto'
import { JustEtfScraperService } from '../../scrapers/just-etf'
import { OfxScraperService } from '../../scrapers/ofx'
import { ExchangerateDto, OfxHistoricalDataDto } from '../../scrapers/ofx/ofx-scraper.dto'
import { AppConfigTypes } from '../../types'
import { dateToLocaleStringDate, dateToStringdate, stringDateToIsoFormat } from '../../utils'
import {
  AccountDto,
  ActivityCreateDto,
  CountryDto,
  GhostfolioConnectorService,
  MarketDataDto,
  PlatformBaseDto,
  PlatformDto,
  ResponseTagDto,
  SectorDto,
} from '../ghostfolio-connector'

@Injectable()
export class GhostfolioPrivateWorkerService extends WithLogger {
  constructor(
    private readonly ghostfolioConnector: GhostfolioConnectorService,
    private readonly configService: ConfigService<AppConfigTypes>,
    private readonly countryCodeScraperService: CountryCodesScraperService,
    private readonly justEtfScraperService: JustEtfScraperService,
    private readonly ofxScraperService: OfxScraperService,
  ) {
    super(GhostfolioPrivateWorkerService.name)
  }

  /**
   * Retrieve fees from Ghostfolio based on `feesToControl` and filter fees that are
   * not in Ghostfolio based on date of fee.
   * @param feesToControl Fees to be controlled against Gostfolio.
   * @param feeSymbol Symbol under which search for fees.
   */
  @PrivateLogMethod()
  private async getGhostfolioNonPresentFeeOrders(feesToControl: FeeDto[], feeSymbol: string) {
    const orders = await this.ghostfolioConnector.getOrders()
    const ordersWithSymbol = orders.filter((order) => order.SymbolProfile?.name?.includes(feeSymbol))

    const nonGhostfolioFeeOrders = feesToControl.filter((fee) => {
      if (fee.date) {
        const feeDate = dateToStringdate(fee.date)
        const foundGhostfolioOrder = ordersWithSymbol.find((order) => {
          const orderDate = dateToLocaleStringDate(new Date(order.date))
          return orderDate === feeDate
        })
        return foundGhostfolioOrder === undefined
      }

      return false
    })

    return nonGhostfolioFeeOrders
  }

  /**
   *  Find and return tag by provided name.
   * @param name Tag name
   * @returns Tag if found.
   */
  @PrivateLogMethod()
  private async getTagByName(name: string): Promise<ResponseTagDto | undefined> {
    const tags = await this.ghostfolioConnector.getTags()
    const tag = tags.find((tag) => tag.name === name)
    return tag
  }

  /**
   * Search for tag in ghostfolio. If not ofund create new one.
   * @param tagName Name of tag which should be searched for. Also tag with this name will be created if not found.
   * @returns Found or created tag.
   */
  @ServiceLogMethod()
  public async controlTag(tagName: string): Promise<ResponseTagDto> {
    const tag = await this.getTagByName(tagName)

    if (tag === undefined) {
      this.logger.debug(`No tag found. Creating tag with name ${tagName}.`)
      const user = await this.ghostfolioConnector.getUser()
      return this.ghostfolioConnector.createTag({
        name: tagName,
        userId: user.id,
      })
    }

    this.logger.debug(`Found tag with name ${tag.name}`)
    return tag
  }

  /**
   * Search for platform in ghostfolio. If not found create new one.
   * @param platformToFind Platform to find. Also template for creating new one.
   * @returns Found or created platform.
   */
  @ServiceLogMethod()
  public async controlGhostfolioPlatform(platformToFind: PlatformBaseDto): Promise<PlatformDto> {
    const platforms = await this.ghostfolioConnector.getPlatforms()
    const foundPlatform = platforms.find((platform) => platform.name === platformToFind.name)

    if (foundPlatform === undefined) {
      this.logger.debug(`No platform found. Creating platform with name ${platformToFind.name}.`)
      return this.ghostfolioConnector.createPlatform(platformToFind)
    }

    this.logger.debug(`Found platform with name ${foundPlatform.name}.`)
    return foundPlatform
  }

  /**
   * Search for ghostfolio account with provided name.
   * @param accountName Name of account that will be searched for in ghostfolio.
   * @returns Found ghostfolio account.
   */
  @ServiceLogMethod()
  public async getGhostfolioAccountByName(accountName: string): Promise<AccountDto | undefined> {
    const accounts = await this.ghostfolioConnector.getAccounts()
    const foundAccount = accounts.find((account) => account.name === accountName)

    return foundAccount
  }

  /**
   * Search for account in ghostfolio. If not found create new one.
   * @param platformId Platform which will be assigned to new account
   * @param accountName Name to be searched for in ghostfolio accounts-
   * @returns Found or created account.
   */
  @ServiceLogMethod()
  public async controlGhostfolioAccount(platformId: string, accountName: string) {
    const user = await this.ghostfolioConnector.getUser()
    const account = await this.getGhostfolioAccountByName(accountName)

    if (account === undefined) {
      this.logger.debug(`No account found. Creating account with name ${accountName}.`)
      return this.ghostfolioConnector.createAccount({
        balance: 0,
        currency: user.settings.baseCurrency,
        name: accountName,
        platformId,
      })
    }

    this.logger.debug(`Found account with name ${account.name}.`)
    return account
  }

  /**
   * Create missing profiles in ghostfolio that are provided via 'profiles' parameter.
   * @param profiles Profile that should be in Ghostfolio.
   * @param tickerMapArray Map of unique tickers from ghostfolio.
   * @param recursiveTimeoutMs Timeout between creating new profiles in ms.
   */
  @ServiceLogMethod()
  public async createMissingGhostfolioProfiles(
    profiles: MarketDataDto[],
    tickerMapArray: [string, FondDefinitionDto][],
    recursiveTimeoutMs?: number,
  ) {
    const tickerMapArrayCopy = [...tickerMapArray]
    const actualMember = tickerMapArrayCopy.shift()

    if (actualMember) {
      const [symbol, record] = actualMember
      const gatherData = this.configService.get<boolean>('GATHER_DATA')
      const isInGhostfolio = profiles.find((value) => value.symbol === symbol)

      if (isInGhostfolio === undefined) {
        // Get sectors and countries for ETF profile
        const { data: countryCodes } = await this.countryCodeScraperService.getCountryCodes()
        const etfCountriesAndSectors = await this.justEtfScraperService.getCountriesAndSectors(record.isin)
        const sectors: SectorDto[] | undefined = etfCountriesAndSectors.sectors?.map(({ sector, weight }) => ({
          name: sector,
          weight,
        }))
        const countries: CountryDto[] = []

        if (etfCountriesAndSectors.countries) {
          for (const country of etfCountriesAndSectors.countries) {
            const codeObject = countryCodes.find((countryCode) =>
              countryCode.country.toLowerCase().includes(country.country.toLowerCase()),
            )

            if (codeObject === undefined && country.country !== 'Other') {
              this.logger.error(
                `Unable to find country for isin ${record.isin} and Just ETF country ${country.country}`,
              )
            }

            countries.push({ code: codeObject ? codeObject.alpha2 : country.country, weight: country.weight })
          }
        }

        // Create new record
        this.logger.debug(`Creating profile for symbol ${symbol}...`)
        const profileData = await this.ghostfolioConnector.createProfileDataForSymbol(symbol)

        // Update created record
        await this.ghostfolioConnector.updateProfileDataForSymbol(
          {
            assetClass: profileData?.assetClass ?? 'EQUITY',
            assetSubClass: profileData?.assetSubClass ?? 'ETF',
            comment: profileData?.comment ?? undefined,
            countries: profileData?.countries ?? countries,
            currency: record.currency,
            isActive: typeof gatherData === 'boolean' ? gatherData : false,
            name: `${record.fond} (${record.isin})`,
            scraperConfiguration: profileData?.scraperConfiguration ?? undefined,
            sectors: profileData?.sectors ?? sectors,
            symbolMapping: profileData?.symbolMapping ?? undefined,
            url: undefined,
          },
          symbol,
        )

        if (recursiveTimeoutMs) {
          await new Promise((resolve) => {
            setTimeout(resolve, recursiveTimeoutMs)
          })
        }
      }

      await this.createMissingGhostfolioProfiles(profiles, tickerMapArrayCopy)
    }
  }

  /**
   * Create missing orders in ghostfolio.
   * @param transactions Transactions compared against ghostfolio orders.
   * @param targetAccountId Account id, to which will be new orders assigned.
   * @param targetTagName Name of tag, which will be assigned to new orders.
   * @param recursiveTimeoutMs Timeout between creating new orders in ms.
   */
  @ServiceLogMethod()
  public async createMissingGhostfolioOrders(
    transactions: EicTransactionDto[],
    targetAccountId: string,
    targetTagName: string,
    recursiveTimeoutMs?: number,
  ) {
    const allOrders = await this.ghostfolioConnector.getOrders()
    const targetTag = await this.controlTag(targetTagName)

    const targetOrders = allOrders.filter((order) => {
      const tag = order.tags?.find((tag) => tag.name === targetTag.name)
      return tag !== undefined
    })

    const recursiveOrderAdd = async (transactions: EicTransactionDto[]) => {
      const [actualTransaction, ...restTransactions] = transactions

      const user = await this.ghostfolioConnector.getUser()
      const transactionDateISO = stringDateToIsoFormat(actualTransaction.date)
      // Find order in ghostfolio with same ISO date and amount.
      const createdOrder = targetOrders.find((order) => {
        const dateCondition = order.date === transactionDateISO
        const amountCondition = order.unitPrice === Number(actualTransaction.price)
        return dateCondition && amountCondition
      })

      if (createdOrder === undefined) {
        this.logger.debug(`Creating order for symbol ${actualTransaction.fond} and date ${transactionDateISO}`)

        const order: ActivityCreateDto = {
          accountId: targetAccountId,
          assetClass: 'EQUITY',
          assetSubClass: 'ETF',
          comment: null,
          currency: actualTransaction.currency,
          customCurrency: actualTransaction.currency,
          date: transactionDateISO,
          dataSource: 'MANUAL',
          fee: Number(actualTransaction.fee),
          quantity: Number(actualTransaction.amount),
          symbol: actualTransaction.fond,
          tags: [
            {
              id: targetTag.id,
              name: targetTag.name,
              userId: user.id,
            },
          ],
          type: actualTransaction.type,
          unitPrice: Number(actualTransaction.price),
          updateAccountBalance: false,
        }

        this.logger.debug(`Creating missing order for symbol ${actualTransaction.fond}...`)
        await this.ghostfolioConnector.createOrder(order)

        if (recursiveTimeoutMs) {
          await new Promise((resolve) => {
            setTimeout(resolve, recursiveTimeoutMs)
          })
        }
      }

      if (restTransactions.length > 0) {
        await recursiveOrderAdd(restTransactions)
      }
    }

    await recursiveOrderAdd(transactions)
  }

  /**
   * @returns Ghostfolio  base currency.
   */
  @ServiceLogMethod()
  public async getGhostfolioBaseCurrency(): Promise<string> {
    const user = await this.ghostfolioConnector.getUser()
    return user.settings.baseCurrency
  }

  /**
   * Create management fee records assigned to provided account id and with provided tag (optional).
   * Fees that will be added are calculated based on date of fee and symbol.
   * @param feeRecord Object representing fee and basic information about fee record.
   * @param feeSymbol Symbol that will be assigned to fee record.
   * @param accountId Account to which will be fees assigned.
   * @param tagName Tag added for each new fee record.
   */
  @ServiceLogMethod()
  public async createMissingMngFeesInGhostfolio(
    { fees, currency }: FeesDto,
    feeSymbol: string,
    accountId: string,
    tagName?: string,
  ) {
    const baseCurrency = await this.getGhostfolioBaseCurrency()
    const tag = tagName ? await this.getTagByName(tagName) : undefined
    const feesToControl = fees
      .filter(({ date }) => date !== undefined)
      .sort((a, b) => (a.date?.getTime() as number) - (b.date?.getTime() as number))

    const feesToAdd = await this.getGhostfolioNonPresentFeeOrders(feesToControl, feeSymbol)

    /**
     * Valid if at least one fee to process
     */
    if (feesToAdd.length === 0) {
      this.logger.log('No management fee to add.')
      return
    }

    /**
     * Define create fee function.
     */
    const createFee = async (stringFeeDate: string, fee: number) => {
      this.logger.debug(`Creating fee for symbol ${feeSymbol} with date ${stringFeeDate}.`)
      const order: ActivityCreateDto = {
        accountId,
        currency: baseCurrency,
        customCurrency: baseCurrency,
        dataSource: 'MANUAL',
        date: stringDateToIsoFormat(stringFeeDate),
        fee,
        type: 'FEE',
        symbol: `${feeSymbol} (${stringFeeDate})`,
        tags: tag
          ? [
              {
                id: tag.id,
                userId: tag.userId,
                name: tag.name,
              },
            ]
          : undefined,
        unitPrice: 0,
        quantity: 0,
        updateAccountBalance: false,
      }

      await this.ghostfolioConnector.createOrder(order)
    }

    /**
     * Define recursive call for fee addition into ghostfolio.
     */
    const recursiveCall = async (feeArray: FeeDto[], rates?: OfxHistoricalDataDto) => {
      const copy = [...feeArray]
      const actualFee = copy.pop()

      if (actualFee) {
        const feeDate = actualFee.date

        /**
         * Validate if processed fee date is defined.
         */
        if (feeDate === undefined) {
          throw new HttpException('Fee without date is invalid.', HttpStatus.INTERNAL_SERVER_ERROR)
        }

        const stringFeeDate = dateToStringdate(feeDate)
        this.logger.debug(`Processing fee for date: ${stringFeeDate}`)

        /**
         * Find rate by date.
         */
        const rate = rates?.data.find((rateData) => {
          const rateDate = dateToStringdate(rateData.date)
          return rateDate === stringFeeDate
        })

        if (rate === undefined && rates !== undefined) {
          throw new HttpException(`Rate for date ${stringFeeDate} was not found.`, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        /**
         * Create management fee record.
         */
        await createFee(
          stringFeeDate,
          rates === undefined
            ? actualFee.managementFee
            : (rate as ExchangerateDto).rateFromCurrency * actualFee.managementFee,
        )

        await recursiveCall(copy, rates)
      }
    }

    this.logger.debug(`${feesToAdd.length} management fees will be added`)

    const oldest = feesToAdd[0]
    const newest = feesToAdd.at(-1)

    /**
     * Add fees that are in different currency than ghostfolio.
     */
    if (currency !== baseCurrency) {
      /**
       * When only one record to add.
       */
      if (feesToAdd.length < 2) {
        const oldestDate = feesToAdd[0].date as Date
        oldestDate.setDate(oldestDate.getDate() - 1)

        this.logger.debug('Fetching rate for one fee record.')
        const rates = await this.ofxScraperService.getRatesForDateRange(
          currency,
          baseCurrency,
          oldestDate,
          oldest.date as Date,
        )

        await recursiveCall([oldest], rates)
        return
      }

      /**
       * When multiple records to add.
       */
      if (oldest?.date && newest?.date) {
        this.logger.debug('Fetching rate for multiple fee record.')
        const rates = await this.ofxScraperService.getRatesForDateRange(
          currency,
          baseCurrency,
          oldest.date,
          newest.date,
        )
        await recursiveCall(feesToAdd, rates)
        return
      }

      this.logger.error('No rates were fetched.')
      return
    }

    /**
     * Add fees that are in same currency as ghostfolio base.
     */
    await recursiveCall(feesToAdd)
  }
}
