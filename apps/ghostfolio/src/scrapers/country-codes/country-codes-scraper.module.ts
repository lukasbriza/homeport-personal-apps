import { Module } from '@nestjs/common'

import { ApiUrlConstructorModule } from '../../services/api-url-constructor'

import { CountryCodesScraperService } from './country-codes-scraper.service'

@Module({
  imports: [ApiUrlConstructorModule],
  providers: [CountryCodesScraperService],
  exports: [CountryCodesScraperService],
})
export class CountryCodesScraperModule {}
