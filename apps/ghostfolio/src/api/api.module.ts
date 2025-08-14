import { Module } from '@nestjs/common'

import { CountryCodesScraperModule } from '../scrapers/country-codes'
import { EicScraperModule } from '../scrapers/eic'
import { JustEtfScraperModule } from '../scrapers/just-etf'
import { GhostfolioConnectorModule } from '../services/ghostfolio-connector'
import { GhostfolioPrivateWorkerModule } from '../services/ghostfolio-private-worker'

import { ApiController } from './api.controller'
import { ApiService } from './api.service'

@Module({
  imports: [
    EicScraperModule,
    JustEtfScraperModule,
    GhostfolioConnectorModule,
    GhostfolioPrivateWorkerModule,
    CountryCodesScraperModule,
  ],
  providers: [ApiController, ApiService],
  controllers: [ApiController],
})
export class ApiModule {}
