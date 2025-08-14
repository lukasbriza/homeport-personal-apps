import { JustEtfHistoricalData, JustEtfRecord } from '../just-etf-scraper.dto'
import { JustEtfResponse } from '../types'
import { stringDashDateToDateFormat } from '../utils'

export const mapJustEtfResponse = (
  responseData: JustEtfResponse,
  ticker: string,
  currency: string,
): JustEtfHistoricalData => {
  if (typeof responseData?.latestDate !== 'string') {
    throw new TypeError(`No latestDate in historical data for ticker: ${ticker}`)
  }

  if (Array.isArray(responseData?.series) === false) {
    throw new TypeError(`No series data in historical data for ticker: ${ticker}`)
  }

  const data: JustEtfRecord[] = responseData.series.map((serieData) => {
    if (serieData?.date === undefined) {
      throw new TypeError(`No series date in historical data for ticker: ${ticker}`)
    }

    if (serieData?.value?.raw === undefined) {
      throw new TypeError(`No series date in historical data for ticker: ${ticker}`)
    }

    return {
      date: stringDashDateToDateFormat(serieData.date),
      value: serieData.value.raw,
    }
  })

  return {
    ticker,
    currency,
    latestDate: responseData.latestDate,
    data,
  }
}
