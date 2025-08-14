export type FeeScrapeResult = {
  year?: string | undefined
  month?: string | undefined
  processingFee: string
  managementFee: string
  baggageFee: string
}

export type ExtendedEICWindow = Window & {
  getTargetTableRoot: () => HTMLElement | undefined
  getPageNumber: () => string | undefined
  prevPage: () => HTMLAnchorElement | undefined
  nextPage: () => HTMLAnchorElement | undefined
  getTableData: () => FeeScrapeResult[]
}
