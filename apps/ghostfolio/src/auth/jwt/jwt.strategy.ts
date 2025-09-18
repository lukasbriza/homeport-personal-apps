import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { passportJwtSecret } from 'jwks-rsa'
import { Strategy, ExtractJwt } from 'passport-jwt'

import { AppConfigTypes } from '../../types'

import { JwtDecodedPayload } from './jwt.dto'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService<AppConfigTypes>) {
    const keycloakUrl = configService.get<string>('KEYCLOAK_URL')
    const keycloakRealm = configService.get<string>('KEYCLOAK_REALM')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`,
      }),
      algorithms: ['RS256'],
    })
  }

  validate(payload: JwtDecodedPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject')
    }

    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000)
      if (payload.exp < currentTime) {
        throw new UnauthorizedException('Token has expired')
      }
    }

    if (payload.iat) {
      const currentTime = Math.floor(Date.now() / 1000)
      // 5 minutes tolerance
      const maxClockSkew = 300
      if (payload.iat > currentTime + maxClockSkew) {
        throw new UnauthorizedException('Token issued in the future')
      }
    }

    const audience = this.configService.get<string>('KEYCLOAK_AUDIENCE')
    if (payload.aud !== audience) {
      throw new UnauthorizedException('Invalid token: invalid audience')
    }

    const clientId = this.configService.get<string>('KEYCLOAK_AUTHORIZED_PARTY')
    if (payload.azp !== clientId) {
      throw new UnauthorizedException('Invalid token: invalid authorized party')
    }

    return payload
  }
}
