import { Injectable, Scope } from '@nestjs/common'
import { validate } from 'class-validator'
import puppeteer from 'puppeteer'

import { WithLogger } from '../../classes/with-logger'
import { ServiceLogMethod } from '../../decorators'
import { ApiUrlConstructorService } from '../../services/api-url-constructor'
import { getValidationMessageFromErrorArray } from '../../utils'

import { CountryCodeDataSetDto } from './country-codes-scraper.dto'

@Injectable({ scope: Scope.REQUEST })
export class CountryCodesScraperService extends WithLogger {
  constructor(private readonly apiUrlConstructor: ApiUrlConstructorService) {
    super(CountryCodesScraperService.name)
  }

  private countryCodes: CountryCodeDataSetDto | undefined = undefined

  /**
   * @returns All country names with associated 2-lenght country code and 3-lenght country code.
   */
  @ServiceLogMethod()
  public async getCountryCodes(): Promise<CountryCodeDataSetDto> {
    if (this.countryCodes !== undefined) {
      return this.countryCodes
    }

    const countryCodesUrl = this.apiUrlConstructor.getCountryCodesUrl()
    const browser = await puppeteer.launch({ browser: 'chrome', headless: true })
    const [page] = await browser.pages()

    await page.goto(countryCodesUrl)
    await page.waitForNetworkIdle()
    const data: CountryCodeDataSetDto = await page.evaluate(() => {
      const table = document.querySelectorAll('tbody')
      const rows = table[0].querySelectorAll('tr')
      const rowsArray = [...rows]
      const dataSet: { country: string; alpha2: string; alpha3: string }[] = []

      for (const row of rowsArray) {
        const [country, alpha2, alpha3] = row.querySelectorAll('td')

        if (country.textContent && alpha2.textContent && alpha3.textContent) {
          dataSet.push({ country: country.textContent, alpha2: alpha2.textContent, alpha3: alpha3.textContent })
        }
      }

      return { data: dataSet }
    })

    const validationErrors = await validate(data)
    const validationMessage = getValidationMessageFromErrorArray(validationErrors)

    if (validationMessage) {
      throw new Error(validationMessage)
    }

    await browser.close()

    this.countryCodes = data

    return data
  }
}
