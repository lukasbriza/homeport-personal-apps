import { IsNumber, IsString } from 'class-validator'

export class JwtDecodedPayload {
  @IsNumber()
  exp: number
  @IsNumber()
  iat: number
  @IsString()
  jti: string
  @IsString()
  iss: string
  @IsString()
  aud: string
  @IsString()
  sub: string
  @IsString()
  typ: string
  @IsString()
  azp: string
  @IsString()
  scope: string
  @IsString()
  client_id: string
}
