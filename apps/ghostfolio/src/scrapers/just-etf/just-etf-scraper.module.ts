import { Module } from '@nestjs/common'

import { ApiUrlConstructorModule } from '../../services/api-url-constructor'

import { JustEtfScraperService } from './just-etf-scraper.service'

@Module({
  imports: [ApiUrlConstructorModule],
  providers: [JustEtfScraperService],
  exports: [JustEtfScraperService],
})
export class JustEtfScraperModule {}
