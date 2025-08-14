import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsDate, IsNumber, ValidateNested } from 'class-validator'

export class ExchangerateDto {
  @IsDate()
  date: Date
  @IsNumber()
  rateFromCurrency: number
  @IsNumber()
  rateInverted: number
}

export class OfxHistoricalDataDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ExchangerateDto)
  data: ExchangerateDto[]
}
