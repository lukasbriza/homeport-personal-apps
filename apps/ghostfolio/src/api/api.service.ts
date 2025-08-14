import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { WithLogger } from '../classes/with-logger'
import { LogMethod, PrivateLogMethod } from '../decorators'
import { EicScraperService, FondDefinitionDto } from '../scrapers/eic'
import { JustEtfScraperService } from '../scrapers/just-etf'
import { GhostfolioConnectorService, MarketPriceRecordDto } from '../services/ghostfolio-connector'
import { GhostfolioPrivateWorkerService } from '../services/ghostfolio-private-worker'
import { AppConfigTypes } from '../types'
import { stringDateToIsoFormat } from '../utils'

import { getTickerMap } from './utils'

@Injectable()
export class ApiService extends WithLogger {
  constructor(
    private readonly eicScraper: EicScraperService,
    private readonly justEtfScraper: JustEtfScraperService,
    private readonly ghostfolioConnector: GhostfolioConnectorService,
    private readonly configService: ConfigService<AppConfigTypes>,
    private readonly ghostfolioPrivateWorker: GhostfolioPrivateWorkerService,
  ) {
    super(ApiService.name)
  }

  // PRIVATE METHODS
  /**
   * Fill missing gaps in ghostfolio historical data based on data from just etf.
   * Data are filled recursively for each symbol in tickerMapArray.
   * @param tickerMapArray Symbol and correspondent fond definition.
   */
  @PrivateLogMethod()
  private async fillMissingGapsInHistoricalData(tickerMapArray: [string, FondDefinitionDto][]) {
    const ticketMapArrayCopy = [...tickerMapArray]
    const actualMember = ticketMapArrayCopy.shift()

    // Process actual processed fond.
    if (actualMember) {
      const [symbol, record] = actualMember
      const { marketData } = await this.ghostfolioConnector.getManualMarketDataForSymbol(symbol)
      const historicalData = await this.justEtfScraper.getHistoricalData(record.isin, record.currency)

      // When no data found on just etf, throw error
      if (historicalData === undefined) {
        const message = `Unable to retrieve just-etf historical data for ${symbol}`
        this.logger.fatal(message)
        throw new Error(message)
      }
      // Combine ghostfolio data and just-etf data.
      const marketDataToUpdate: MarketPriceRecordDto[] = []
      for (const justEtfRecord of historicalData.data) {
        const ghostfolioValue = marketData.find((value) => value.date === stringDateToIsoFormat(justEtfRecord.date))

        if (ghostfolioValue === undefined) {
          marketDataToUpdate.push({
            date: stringDateToIsoFormat(justEtfRecord.date),
            marketPrice: justEtfRecord.value,
          })
        }
      }

      // Populate ghostfolio with merged data in batches.
      const recursiveBatchCall = async (data: MarketPriceRecordDto[], batchSize: number) => {
        const dataCopy = [...data]
        const batchData = dataCopy.splice(0, batchSize)

        if (batchData.length === 0) {
          return
        }

        await this.ghostfolioConnector.setMarketDataForSymbol(symbol, batchData)
        await new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
        await recursiveBatchCall(dataCopy, batchSize)
      }

      this.logger.debug(`Updating ${marketDataToUpdate.length} market data records for symbol ${symbol}...`)
      await recursiveBatchCall(marketDataToUpdate, 500)

      // Continue recursively on next fond.
      await this.fillMissingGapsInHistoricalData(ticketMapArrayCopy)
    }
  }

  // PUBLIC METHODS
  @LogMethod()
  public async updateEicData() {
    const eicTagName = this.configService.get<string>('GHOSTFOLIO_EIC_TARGET_TAG') as string

    // Step 1: Check if EIC platform added in Ghostfolio, if not create new.
    const platform = await this.ghostfolioPrivateWorker.controlGhostfolioPlatform({
      name: 'EIC',
      url: 'https://webapp.eic.eu/',
    })

    // Step 2: Control EIC tag in Ghostfolio.
    await this.ghostfolioPrivateWorker.controlTag(eicTagName)

    // Step 3: Check if EIC account created in Ghostfolio, if not, create new.
    const accountName = this.configService.get<string>('GHOSTFOLIO_EIC_ACCOUNT_NAME') as string
    const eicAccount = await this.ghostfolioPrivateWorker.controlGhostfolioAccount(platform.id, accountName)

    // Step 4: Get transactions and orders records from EIC
    const { fees, transactions, orders } = await this.eicScraper.getAllTransactionsAndOrdersAndFees()

    // Step 5: Get unique tickers.
    const tickerMap = getTickerMap(transactions, orders)

    // Step 6: Retrieve Ghostoflio historical data for tickers in tickerMap
    const profiles = await this.ghostfolioConnector.getAllManualProfileData()

    // Step 7: Create profiles that are not in Ghostfolio.
    const tickerMapArray = [...tickerMap]
    await this.ghostfolioPrivateWorker.createMissingGhostfolioProfiles(profiles, tickerMapArray, 1000)

    // Step 8: Populate historical data for profiles and fill gaps.
    await this.fillMissingGapsInHistoricalData(tickerMapArray)

    // Step 9: Add transactions that are not in Ghostfolio
    const accountedTransactions = transactions.filter((transaction) => transaction.accounted === true)
    await this.ghostfolioPrivateWorker.createMissingGhostfolioOrders(
      accountedTransactions,
      eicAccount.id,
      eicTagName,
      1000,
    )

    // Step 11: Filter only management fees.
    // Other fees are already added via BUY|SELL orders.
    const eicMngFeeSymbol = 'EIC-MNG-FEE'
    const mngFees = {
      fees: fees.fees.filter((fee) => fee.managementFee > 0),
      currency: fees.currency,
    }

    // Step 12: Add fees that are not in Ghostfolio
    await this.ghostfolioPrivateWorker.createMissingMngFeesInGhostfolio(
      mngFees,
      eicMngFeeSymbol,
      eicAccount.id,
      eicTagName,
    )

    this.ghostfolioConnector.clearToken()
  }
}
