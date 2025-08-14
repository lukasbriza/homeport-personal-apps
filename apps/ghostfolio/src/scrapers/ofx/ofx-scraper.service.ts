import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios, { AxiosResponse } from 'axios'
import { validate } from 'class-validator'

import { WithLogger } from '../../classes/with-logger'
import { ServiceLogMethod } from '../../decorators'
import { ApiUrlConstructorService } from '../../services/api-url-constructor'
import { axiosCallWrapper, axiosRetryCall, getValidationMessageFromErrorArray } from '../../utils'

import { mapOfxExchangerates } from './mappers'
import { OfxExchangeRateResponse } from './types'

@Injectable()
export class OfxScraperService extends WithLogger {
  constructor(private readonly apiUrlConstructor: ApiUrlConstructorService) {
    super(OfxScraperService.name)
  }

  @ServiceLogMethod()
  public async getRatesForDateRange(fromCurrency: string, targetCurrency: string, startDate: Date, endDate: Date) {
    if (fromCurrency.length !== 3) {
      throw new HttpException('From currency must be from three letters.', HttpStatus.BAD_REQUEST)
    }

    if (targetCurrency.length !== 3) {
      throw new HttpException('Target currency must be from three letters.', HttpStatus.BAD_REQUEST)
    }

    const startBufferDate = new Date(startDate)
    startBufferDate.setDate(startBufferDate.getDate() - 1)

    const todayToCompare = new Date()
    todayToCompare.setHours(0, 0, 0, 0)
    const endToCompare = new Date(endDate)
    endToCompare.setHours(0, 0, 0, 0)

    const endBufferDate = new Date(endDate)
    endBufferDate.setDate(endBufferDate.getDate() + 1)

    const unixStart = startBufferDate.getTime()
    const unixEnd = endToCompare.getTime() === todayToCompare.getTime() ? endDate.getTime() : endBufferDate.getTime()

    const url = this.apiUrlConstructor?.getOfxExchangeUrl(fromCurrency, targetCurrency, unixStart, unixEnd)

    return axiosCallWrapper(async () => {
      const response = await axiosRetryCall<AxiosResponse<OfxExchangeRateResponse>>(
        () => axios.get<OfxExchangeRateResponse>(url),
        300_000,
        this.logger,
        3,
      )
      const mappedData = mapOfxExchangerates(response.data)

      const validationErrors = await validate(mappedData)
      const validationMessage = getValidationMessageFromErrorArray(validationErrors)

      if (validationMessage) {
        throw new Error(validationMessage)
      }

      return mappedData
    }, 'getRatesForDateRange')
  }
}
