/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer'
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsDate,
  IsNumber,
  ArrayNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator'

import { OrderType } from '../../types'

export class CountryDto {
  @IsString()
  code: string
  @IsString()
  weight: number
}

export class SectorDto {
  @IsString()
  name: string
  @IsString()
  weight: number
}

export class ProfileDataDto {
  @IsOptional()
  @IsString()
  assetClass?: string | undefined
  @IsOptional()
  @IsString()
  assetSubClass?: string | undefined
  @IsOptional()
  @IsString()
  comment?: string | undefined
  @IsOptional()
  countries?: CountryDto[] | undefined
  @IsOptional()
  @IsString()
  currency?: string | undefined
  @IsOptional()
  @IsBoolean()
  isActive?: boolean | undefined
  @IsOptional()
  @IsString()
  name?: string | undefined
  @IsOptional()
  scraperConfiguration?: object | undefined
  @IsOptional()
  sectors?: SectorDto[] | undefined
  @IsOptional()
  symbolMapping?:
    | {
        [dataProvider: string]: string
      }
    | undefined
  @IsOptional()
  @IsString()
  url?: string | undefined
}

export class MarketDataDto {
  @IsOptional()
  @IsString()
  assetClass: string | null
  @IsOptional()
  @IsString()
  assetSubClass: string | null
  @IsOptional()
  @IsString()
  comment: string | null
  @IsOptional()
  @IsString()
  currency: string | null
  @IsOptional()
  @IsNumber()
  countriesCount: number | null
  @IsIn(['MANUAL'])
  dataSource: 'MANUAL'
  @IsString()
  id: string
  @IsBoolean()
  isActive: boolean
  @IsOptional()
  @IsNumber()
  lastMarketPrice: number | null
  @IsOptional()
  @IsString()
  name: string | null
  @IsString()
  symbol: string
  @IsOptional()
  @IsNumber()
  marketDataItemCount: number | null
  @IsOptional()
  @IsNumber()
  sectorsCount: number | null
  @IsOptional()
  @IsNumber()
  activitiesCount: number | null
  @IsDate()
  date: Date
  @IsBoolean()
  isUsedByUsersWithSubscription: boolean
  @IsOptional()
  @IsNumber()
  watchedByCount: number | null
}

export class MarketPriceRecordDto {
  @IsString()
  date: string
  @IsNumber()
  marketPrice: number
}

export class MarketDataUpdateDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MarketPriceRecordDto)
  marketData: MarketPriceRecordDto[]
}

export class MarketDataUpdateRecordDto {
  @IsDate()
  createdAt: Date
  @IsIn(['MANUAL'])
  dataSource: 'MANUAL'
  @IsDate()
  date: string
  @IsString()
  id: string
  @IsNumber()
  marketPrice: number
  @IsIn(['CLOSE'])
  state: 'CLOSE'
  @IsString()
  symbol: string
}

export class CreateAccountDto {
  @IsNumber()
  balance: number
  @IsOptional()
  @IsString()
  comment?: string
  @IsString()
  currency: string
  @IsOptional()
  @IsString()
  id?: string
  @IsBoolean()
  @IsOptional()
  isExcluded?: boolean
  @IsString()
  name: string
  @IsOptional()
  @IsString()
  platformId: string | null
}

export class AccountDto {
  @IsOptional()
  @IsString()
  name: string | null
  @IsNumber()
  balance: number
  @IsOptional()
  @IsString()
  comment: string | null
  @IsDate()
  createdAt: Date
  @IsOptional()
  @IsString()
  currency: string | null
  @IsString()
  id: string
  @IsBoolean()
  isExcluded: boolean
  @IsOptional()
  @IsString()
  platformId: string | null
  @IsDate()
  updatedAt: Date
  @IsString()
  userId: string
}

export class AccountWithPlatformDto extends AccountDto {
  @IsOptional()
  Platform: PlatformDto | null
}

export class PlatformBaseDto {
  @IsString()
  name: string
  @IsOptional()
  @IsString()
  url?: string
}

export class PlatformDto extends PlatformBaseDto {
  @IsString()
  id: string
}

export class AccountWithValueDto extends AccountDto {
  @IsNumber()
  balanceInBaseCurrency: number
  @IsOptional()
  @ValidateNested()
  @Type(() => PlatformDto)
  Platform?: PlatformDto
  @IsNumber()
  transactionCount: number
  @IsNumber()
  value: number
  @IsNumber()
  valueInBaseCurrency: number
}

export class TagBaseDto {
  @IsString()
  name: string
  @IsOptional()
  @IsString()
  userId: string | null
}

export class TagDto extends TagBaseDto {
  @IsString()
  id: string
}

export class ResponseTagDto extends TagBaseDto {
  @IsString()
  id: string
  @IsNumber()
  activityCount: number
}

export class UserSettings {
  @IsString()
  baseCurrency: string
}

export class DataProviderDto {
  @IsOptional()
  @IsString()
  dataSource?: string
  @IsBoolean()
  isPremium: boolean
  @IsOptional()
  @IsString()
  name?: string
  @IsOptional()
  @IsString()
  url?: string
}

export class SymbolProfileDto {
  @IsNumber()
  activitiesCount: number
  @IsString()
  assetClass: string
  @IsString()
  assetSubClass: string
  @IsOptional()
  @IsString()
  comment?: string
  @IsOptional()
  countries: unknown[]
  createdAt: Date
  @IsOptional()
  @IsString()
  currency?: string
  @IsOptional()
  @ValidateNested()
  @Type(() => DataProviderDto)
  dataProviderInfo?: DataProviderDto
  @IsString()
  dataSource: string
  @IsOptional()
  @IsDate()
  dateOfFirstActivity?: Date
  @IsOptional()
  @IsString()
  figi?: string
  @IsOptional()
  @IsString()
  figiComposite?: string
  @IsOptional()
  @IsString()
  figiShareClass?: string
  @IsOptional()
  holdings: unknown[]
  @IsString()
  id: string
  @IsBoolean()
  isActive: boolean
  @IsOptional()
  @IsString()
  isin?: string
  @IsOptional()
  @IsString()
  name?: string
  @IsOptional()
  scraperConfiguration?: object | undefined
  @IsOptional()
  sectors?: unknown[] | undefined
  @IsString()
  symbol: string
  @IsOptional()
  symbolMapping?:
    | {
        [dataProvider: string]: string
      }
    | undefined
  @IsDate()
  updatedAt: Date
  @IsOptional()
  @IsString()
  url?: string
  @IsOptional()
  @IsString()
  userId?: string
}

export class ActivityCreateDto {
  @IsOptional()
  @IsString()
  accountId?: string
  @IsOptional()
  @IsString()
  assetClass?: string
  @IsOptional()
  @IsString()
  assetSubClass?: string
  @IsOptional()
  @IsString()
  comment?: string | null
  @IsString()
  currency: string
  @IsOptional()
  @IsString()
  customCurrency?: string
  @IsOptional()
  @IsString()
  dataSource?: string
  @IsString()
  date: string
  @IsNumber()
  fee: number
  @IsNumber()
  quantity: number
  @IsString()
  symbol: string
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[] | undefined
  @IsString()
  type: OrderType
  @IsNumber()
  unitPrice: number
  @IsBoolean()
  @IsOptional()
  updateAccountBalance?: boolean
}

export class ActivityDto {
  @IsString()
  accountId: string
  @IsString()
  accountUserId: string
  @IsOptional()
  @IsString()
  comment?: string | null
  @IsDate()
  createdAt: Date
  @IsString()
  currency: string
  @IsDate()
  date: string
  @IsOptional()
  @IsNumber()
  fee?: number | null
  @IsString()
  id: string
  @IsBoolean()
  isDraft: false
  @IsNumber()
  quantity: number
  @IsString()
  symbolProfileId: string
  @IsString()
  type: OrderType
  @IsNumber()
  unitPrice: number
  @IsDate()
  updatedAt: Date
  @IsString()
  userId: string
  @ValidateNested()
  @Type(() => AccountDto)
  Account: AccountWithPlatformDto
  @IsOptional()
  @ValidateNested()
  @Type(() => SymbolProfileDto)
  SymbolProfile?: SymbolProfileDto | null
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[] | null
  @IsNumber()
  feeInAssetProfileCurrency: number
  @IsNumber()
  feeInBaseCurrency: number
  @IsNumber()
  unitPriceInAssetProfileCurrency: number
  @IsNumber()
  value: number
  @IsNumber()
  valueInBaseCurrency: number
}
