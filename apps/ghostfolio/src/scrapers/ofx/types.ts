export type OfxExchangeRateResponse = {
  CurrentInterbankRate: number
  CurrentInverseInterbankRate: number
  Average: number
  HistoricalPoints: {
    PointInTime: number
    InterbankRate: number
    InverseInterbankRate: number
  }[]
}
