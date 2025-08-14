import { Controller, Get } from '@nestjs/common'

import { EicScraperService } from '../scrapers/eic'

import { ApiService } from './api.service'

@Controller('api')
export class ApiController {
  constructor(
    private readonly apiService: ApiService,
    private readonly eicScraper: EicScraperService,
  ) {}

  @Get('update-eic-data')
  async updateEicData() {
    return this.apiService.updateEicData()
  }

  @Get('test')
  async test() {
    return this.eicScraper.getAllTransactionsAndOrdersAndFees()
  }
}
