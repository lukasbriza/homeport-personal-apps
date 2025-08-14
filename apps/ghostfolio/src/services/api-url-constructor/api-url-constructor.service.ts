import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { ServiceLogMethod } from '../../decorators'
import { AppConfigTypes } from '../../types'
import { dateToDashDateString } from '../../utils'

import {
  AUTH_TOKEN_PATH,
  PROFILE_DATA,
  EIC_URL,
  JUST_ETF_API_BASE_URL,
  JUST_ETF_HISTORICAL_DATA_PATH,
  TRANSACTIONS_DOWNLOAD_PATH,
  ADMIN_MARKET_DATA,
  EIC_PUBLIC_URL,
  EIC_HISTORICAL_DATA_PATH,
  ACCOUNT_PATH,
  USER_PATH,
  ORDER_PATH,
  PLATFORM_PATH,
  TAGS_PATH,
  ORDERS_DOWNLOAD_PATH,
  MARKET_DATA,
  COUNTRY_CODES_URL,
  JUST_ETF_BASE_URL,
  OFX_API_URL,
} from './constants'

@Injectable()
export class ApiUrlConstructorService {
  constructor(private readonly configService: ConfigService<AppConfigTypes>) {}

  // EIC methods
  @ServiceLogMethod()
  public getEicBaseUrl() {
    return EIC_URL
  }

  @ServiceLogMethod()
  public getEicPublicBaseUrl() {
    return EIC_PUBLIC_URL
  }

  @ServiceLogMethod()
  public getEicTransactionsDownloadUrl() {
    const baseUrl = this.getEicBaseUrl()
    return `${baseUrl}${TRANSACTIONS_DOWNLOAD_PATH}`
  }

  @ServiceLogMethod()
  public getEicOrdersDownloadUrl() {
    const baseUrl = this.getEicBaseUrl()
    return `${baseUrl}${ORDERS_DOWNLOAD_PATH}`
  }

  @ServiceLogMethod()
  public getEicFondHistoricalDataUrl(fond: string) {
    const baseUrl = this.getEicPublicBaseUrl()
    return `${baseUrl}${EIC_HISTORICAL_DATA_PATH}/${fond}`
  }

  // JUST ETF methods
  @ServiceLogMethod()
  public getJustEtfHistoricalDataUrl(ticker: string, currency: string, from?: Date, to?: Date) {
    const base = `${JUST_ETF_API_BASE_URL}/${ticker}${JUST_ETF_HISTORICAL_DATA_PATH}&currency=${currency}`

    if (from && to) {
      return `${base}&dateFrom=${dateToDashDateString(from)}&dateTo=${dateToDashDateString(to)}`
    }

    return base
  }

  @ServiceLogMethod()
  public getJustEtfProfilePageUrl(isin: string) {
    return `${JUST_ETF_BASE_URL}?isin=${isin}`
  }

  // GHOSTFOLIO methods
  @ServiceLogMethod()
  public getGhostfolioAuthPath() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${AUTH_TOKEN_PATH}`
  }

  @ServiceLogMethod()
  public getGhostfolioManualProfileDataUrl(ticker: string) {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${PROFILE_DATA}/MANUAL/${ticker}`
  }

  @ServiceLogMethod()
  public getGhostfolioAllAdminMarketDataUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${ADMIN_MARKET_DATA}`
  }

  @ServiceLogMethod()
  public getGhostfolioAllNonAdminMarketDataUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${MARKET_DATA}`
  }

  @ServiceLogMethod()
  public getGhostfolioManualMarketDataUrl(ticker: string) {
    const base = this.getGhostfolioAllAdminMarketDataUrl()
    return `${base}/MANUAL/${ticker}`
  }

  @ServiceLogMethod()
  public getGhostfolioNonAdminManualMarketDataUrl(ticker: string) {
    const ghostfolioUrl = this.getGhostfolioAllNonAdminMarketDataUrl()
    return `${ghostfolioUrl}/MANUAL/${ticker}`
  }

  @ServiceLogMethod()
  public getGhostfolioAccountsUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${ACCOUNT_PATH}`
  }

  @ServiceLogMethod()
  public getGhostfolioAccountUrl(accountId: string) {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${ACCOUNT_PATH}/${accountId}`
  }

  @ServiceLogMethod()
  public getGhostfolioUserUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${USER_PATH}`
  }

  @ServiceLogMethod()
  public getGhostfolioOrdersUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${ORDER_PATH}`
  }

  @ServiceLogMethod()
  public getGhostfolioPlatformUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${PLATFORM_PATH}`
  }

  @ServiceLogMethod()
  public getGhostfolioTagsUrl() {
    const ghostfolioUrl = this.configService.get<string>('GHOSTFOLIO_URL')
    return `${ghostfolioUrl}${TAGS_PATH}`
  }

  // IBAN COUNTRY CODES methods
  @ServiceLogMethod()
  public getCountryCodesUrl() {
    return COUNTRY_CODES_URL
  }

  // OFX methods
  @ServiceLogMethod()
  public getOfxExchangeUrl(fromCurrency: string, toCurrency: string, startDateMs: number, endDateMs: number) {
    return `${OFX_API_URL}/${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}/${startDateMs}/${endDateMs}?DecimalPlaces=6&ReportingInterval=daily&format=json`
  }
}
