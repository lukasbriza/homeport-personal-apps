import { Module } from '@nestjs/common'

import { ApiUrlConstructorModule } from '../../services/api-url-constructor'

import { EicScraperService } from './eic-scraper.service'

@Module({
  imports: [ApiUrlConstructorModule],
  providers: [EicScraperService],
  exports: [EicScraperService],
})
export class EicScraperModule {}
