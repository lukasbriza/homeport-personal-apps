import { Type } from 'class-transformer'
import { IsString, ValidateNested, ArrayNotEmpty } from 'class-validator'

import { MarketPriceRecordDto } from '../services/ghostfolio-connector'

export class GhostfolioHistoricalDataRecord {
  @IsString()
  symbol: string
  @IsString()
  isin: string
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MarketPriceRecordDto)
  historicalData: MarketPriceRecordDto[]
}
