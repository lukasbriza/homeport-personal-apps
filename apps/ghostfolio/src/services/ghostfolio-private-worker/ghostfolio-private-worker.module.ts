import { Module } from '@nestjs/common'

import { CountryCodesScraperModule } from '../../scrapers/country-codes'
import { JustEtfScraperModule } from '../../scrapers/just-etf'
import { OfxScraperModule } from '../../scrapers/ofx'
import { GhostfolioConnectorModule } from '../ghostfolio-connector'

import { GhostfolioPrivateWorkerService } from './ghostfolio-private-worker.service'

@Module({
  imports: [GhostfolioConnectorModule, CountryCodesScraperModule, JustEtfScraperModule, OfxScraperModule],
  providers: [GhostfolioPrivateWorkerService],
  exports: [GhostfolioPrivateWorkerService],
})
export class GhostfolioPrivateWorkerModule {}
