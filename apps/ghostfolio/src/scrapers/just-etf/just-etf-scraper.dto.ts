/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer'
import { IsString, IsNumber, Matches, ValidateNested, ArrayNotEmpty, IsOptional } from 'class-validator'

export class JustEtfRecord {
  @Matches(/^(?:\d{2}\.){2}\d{4}$/, {
    message: 'date must be in format DD.MM.RRRR',
  })
  date: string
  @IsNumber()
  value: number
}

export class JustEtfHistoricalData {
  @IsString()
  ticker: string
  @IsString()
  currency: string
  @Matches(/^(?:\d{2}\.){2}\d{4}$/, {
    message: 'date must be in format DD.MM.RRRR',
  })
  latestDate: string
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => JustEtfRecord)
  data: JustEtfRecord[]
}

export class JustEtfCountryDto {
  @IsString()
  country: string
  @IsNumber()
  weight: number
}

export class JustEtfSectorDto {
  @IsString()
  sector: string
  @IsNumber()
  weight: number
}

export class JustEtfCountriesAndSectorsDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => JustEtfCountryDto)
  countries?: JustEtfCountryDto[] | undefined
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => JustEtfSectorDto)
  sectors?: JustEtfSectorDto[] | undefined
}
