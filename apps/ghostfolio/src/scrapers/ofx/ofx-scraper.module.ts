import { Module } from '@nestjs/common'

import { ApiUrlConstructorModule } from '../../services/api-url-constructor'

import { OfxScraperService } from './ofx-scraper.service'

@Module({
  imports: [ApiUrlConstructorModule],
  providers: [OfxScraperService],
  exports: [OfxScraperService],
})
export class OfxScraperModule {}
