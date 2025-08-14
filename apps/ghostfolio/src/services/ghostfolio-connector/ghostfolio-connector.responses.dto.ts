/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsBoolean, IsDate, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'

import { OrderType } from '../../types'

import {
  AccountDto,
  ActivityDto,
  CountryDto,
  MarketDataDto,
  MarketDataUpdateRecordDto,
  ProfileDataDto,
  SectorDto,
  TagBaseDto,
  TagDto,
  UserSettings,
} from './ghostfolio-connector.dto'

export class AccountsResponseDto {
  @ValidateNested({ each: true })
  @Type(() => AccountDto)
  accounts: AccountDto[]
  @IsNumber()
  totalBalanceInBaseCurrency: number
  @IsNumber()
  totalValueInBaseCurrency: number
  @IsNumber()
  transactionCount: number
}

export class MarketDataResponseDto {
  @IsNumber()
  count: number
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MarketDataDto)
  marketData: MarketDataDto[]
}

export class AuthTokenResponseDto {
  @IsString()
  authToken: string
}

export class CreateProfileResponseDto {
  @IsOptional()
  @IsString()
  assetClass: string | null
  @IsOptional()
  @IsString()
  assetSubClass: string | null
  @IsOptional()
  @IsString()
  comment: string | null
  countries: CountryDto[] | null
  @IsDate()
  createdAt: Date
  @IsString()
  currency: string
  @IsOptional()
  @IsString()
  cusip: string | null
  @IsIn(['MANUAL'])
  dataSource: 'MANUAL'
  @IsOptional()
  @IsString()
  figi: string | null
  @IsOptional()
  @IsString()
  figiComposite: string | null
  @IsOptional()
  @IsString()
  figiShareClass: string | null
  @IsOptional()
  holdings: unknown[]
  @IsString()
  id: string
  @IsBoolean()
  isActive: boolean
  @IsOptional()
  @IsString()
  isin: string | null
  @IsOptional()
  @IsString()
  name: string | null
  @IsDate()
  updatedAt: Date
  @IsOptional()
  scraperConfiguration: object | null
  @IsOptional()
  @IsOptional()
  sectors?: SectorDto[] | null
  @IsString()
  symbol: string
  @IsOptional()
  symbolMapping?:
    | {
        [dataProvider: string]: string
      }
    | undefined
  @IsOptional()
  @IsString()
  url: string | null
  @IsOptional()
  @IsString()
  userId: string | null
}

export class ProfileDataResponseDto extends ProfileDataDto {}

export class MarketDataForSymbolResponseDto {
  @ValidateNested({ each: true })
  @Type(() => MarketDataUpdateRecordDto)
  marketData: MarketDataUpdateRecordDto[]
  @ValidateNested()
  @Type(() => ProfileDataDto)
  assetProfile: ProfileDataDto
}

export class AccountResponseDto extends AccountDto {}

export class UserResponseDto {
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags: TagDto[]
  @ValidateNested()
  @Type(() => UserSettings)
  settings: UserSettings
  @IsString()
  id: string
}

export class OrderResponseDto {
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities: ActivityDto[]
  @IsNumber()
  count: number
}

export class CreateOrderResponseDto {
  @IsDate()
  createdAt: Date
  @IsString()
  id: string
  @IsDate()
  updatedAt: Date
  @IsDate()
  date: Date
  @IsOptional()
  @IsString()
  comment?: string | null
  @IsOptional()
  @IsString()
  currency?: string | null
  @IsString()
  userId: string
  @IsOptional()
  @IsString()
  accountId?: string | null
  @IsNumber()
  fee: number
  @IsNumber()
  quantity: number
  @IsString()
  type: OrderType
  @IsNumber()
  unitPrice: number
  @IsOptional()
  @IsString()
  accountUserId?: string | null
  @IsBoolean()
  isDraft: boolean
  @IsString()
  symbolProfileId: string
}

export class CreateTagResponseDto extends TagBaseDto {
  @IsString()
  id: string
}
