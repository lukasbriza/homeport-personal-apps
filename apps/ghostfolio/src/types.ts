import * as puppeteer from 'puppeteer'

export type AppConfigTypes = {
  GHOSTFOLIO_SECURITY_TOKEN: string
  GHOSTFOLIO_URL: string
  EIC_LOGIN: string
  EIC_PASSWORD: string
  GHOSTFOLIO_EIC_ACCOUNT_NAME: string
  GHOSTFOLIO_EIC_TARGET_TAG: string
  GATHER_DATA: boolean
  KEYCLOAK_URL: string
  KEYCLOAK_REALM: string
  JWT_SECRET: string
  KEYCLOAK_AUDIENCE: string
  KEYCLOAK_AUTHORIZED_PARTY: string
}

export type PuppeteerDto = {
  actualPage: puppeteer.Page
  browser: puppeteer.Browser
}

export type ExtendedPupeteerDto<T> = PuppeteerDto & T

export type OrderType = 'BUY' | 'FEE' | 'SELL'
