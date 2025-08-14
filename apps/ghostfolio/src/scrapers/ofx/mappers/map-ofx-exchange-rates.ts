import { OfxHistoricalDataDto } from '../ofx-scraper.dto'
import { OfxExchangeRateResponse } from '../types'

export const mapOfxExchangerates = (data: OfxExchangeRateResponse): OfxHistoricalDataDto => ({
  data: data.HistoricalPoints.map((value) => ({
    date: new Date(value.PointInTime),
    rateFromCurrency: value.InterbankRate,
    rateInverted: value.InverseInterbankRate,
  })),
})
