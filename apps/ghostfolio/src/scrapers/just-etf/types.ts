export type JustEtfResponse = {
  latestDate: string
  series: {
    value: { raw: number }
    date: string
  }[]
}
