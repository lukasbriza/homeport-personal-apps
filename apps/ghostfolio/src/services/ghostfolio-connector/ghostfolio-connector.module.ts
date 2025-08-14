import { Module } from '@nestjs/common'

import { ApiUrlConstructorModule } from '../api-url-constructor'

import { GhostfolioConnectorService } from './ghostfolio-connector.service'

@Module({
  imports: [ApiUrlConstructorModule],
  providers: [GhostfolioConnectorService],
  exports: [GhostfolioConnectorService],
})
export class GhostfolioConnectorModule {}
