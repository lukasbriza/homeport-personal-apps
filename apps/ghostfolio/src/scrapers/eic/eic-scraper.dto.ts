/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer'
import {
  IsString,
  IsIn,
  IsNumberString,
  Matches,
  IsBoolean,
  ArrayNotEmpty,
  ValidateNested,
  IsDate,
  IsNumber,
  IsOptional,
} from 'class-validator'

export class EicLoginDto {
  @IsString()
  login: string
  @IsString()
  password: string
}

/**
 * fond - represent shorthand of fond,
 * type - type of transactions (buy|sell),
 * currency - currency of transaction,
 * amount - represent amount of shares processed,
 * price - price per share,
 * volume - amount * price,
 * fee - fee for processing transaction,
 * date - date of transaction,
 */
export class EicTransactionDto {
  @IsString()
  fond: string
  @IsIn(['BUY', 'SELL'])
  type: 'BUY' | 'SELL'
  @IsString()
  currency: string
  @IsNumberString({}, { message: 'amount must be number' })
  amount: string
  @IsNumberString({}, { message: 'price must be number' })
  price: string
  @IsNumberString({}, { message: 'volume must be number' })
  volume: string
  @IsNumberString({}, { message: 'fee must be number' })
  fee: string
  @Matches(/^(?:\d{2}\.){2}\d{4}$/, {
    message: 'date must be in format DD.MM.RRRR',
  })
  date: string
  @IsBoolean()
  accounted: boolean
}

export class EicOrdersDto {
  @IsString()
  currency: string
  @IsNumberString({}, { message: 'amount must be number' })
  amount: string
  @IsString()
  fond: string
  @IsString()
  isin: string
  @IsDate()
  date: Date
}

export class FondDefinitionDto {
  @IsString()
  fond: string
  @IsString()
  isin: string
  @IsString()
  currency: string
}

export class FeeDto {
  @IsNumber()
  managementFee: number
  @IsNumber()
  baggageFee: number
  @IsNumber()
  processingFee: number
  @IsOptional()
  @IsDate()
  date?: Date | undefined
}

export class FeesDto {
  @IsString()
  currency: string
  @ValidateNested({ each: true })
  @Type(() => FeeDto)
  fees: FeeDto[]
}

export class EicTransactionsAndOrdersDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EicTransactionDto)
  transactions: EicTransactionDto[]
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EicOrdersDto)
  orders: EicOrdersDto[]
  fees: FeesDto
}
