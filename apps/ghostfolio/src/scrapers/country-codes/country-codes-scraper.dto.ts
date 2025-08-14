import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsString, ValidateNested, MinLength, MaxLength } from 'class-validator'

export class CountryCodeDto {
  @IsString()
  country: string
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  alpha2: string
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  alpha3: string
}

export class CountryCodeDataSetDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CountryCodeDto)
  data: CountryCodeDto[]
}
