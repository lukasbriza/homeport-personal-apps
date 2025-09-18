import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { expect, describe, beforeEach, it } from 'vitest'

import { AppConfigTypes } from '../../types'

import { JwtDecodedPayload } from './jwt.dto'
import { JwtStrategy } from './jwt.strategy'

describe('JwtStrategy', () => {
  let strategy: JwtStrategy
  let configService: ConfigService<AppConfigTypes>
  const configServiceMock = {
    get: (key: unknown) => {
      const config = {
        KEYCLOAK_URL: 'http://localhost:8080',
        KEYCLOAK_REALM: 'test-realm',
        KEYCLOAK_AUDIENCE: 'ghostfolio-api',
        KEYCLOAK_AUTHORIZED_PARTY: 'ghostfolio-script',
      }
      return config[key as keyof typeof config]
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtStrategy,
          useFactory: (configService: ConfigService<AppConfigTypes>) => new JwtStrategy(configService),
          inject: [ConfigService],
        },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile()

    strategy = module.get<JwtStrategy>(JwtStrategy)
    configService = module.get<ConfigService<AppConfigTypes>>(ConfigService)
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
    expect(configService).toBeDefined()
  })

  it('should validate a valid payload', () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const payload: JwtDecodedPayload = {
      exp: currentTime + 3600,
      iat: currentTime,
      jti: '4766c301-3754-4bc5-935f-0a552795b22d',
      iss: 'http://localhost:8080/realms/test-realm',
      aud: 'ghostfolio-api',
      sub: '0fcd47f1-5293-4836-b63a-7fee0aef0f66',
      typ: 'Bearer',
      azp: 'ghostfolio-script',
      scope: '',
      client_id: 'ghostfolio-script',
    }

    const result = strategy.validate(payload)

    expect(result).toEqual(payload)
  })

  it('should throw UnauthorizedException for payload without sub', () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const payload: Partial<JwtDecodedPayload> = {
      exp: currentTime + 3600,
      iat: currentTime,
      jti: 'test-jti',
      iss: 'http://localhost:8080/realms/test-realm',
      aud: 'ghostfolio-api',
      typ: 'Bearer',
      azp: 'ghostfolio-script',
      scope: 'openid profile email',
      client_id: 'ghostfolio-script',
    }

    expect(() => strategy.validate(payload as JwtDecodedPayload)).toThrow(UnauthorizedException)
  })

  it('should handle payload without realm_access', () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const payload: JwtDecodedPayload = {
      exp: currentTime + 3600,
      iat: currentTime,
      jti: 'test-jti',
      iss: 'http://localhost:8080/realms/test-realm',
      aud: 'ghostfolio-api',
      sub: 'user123',
      typ: 'Bearer',
      azp: 'ghostfolio-script',
      scope: 'openid profile email',
      client_id: 'ghostfolio-script',
    }

    const result = strategy.validate(payload)

    expect(result).toEqual(payload)
  })

  it('should throw UnauthorizedException for expired token', () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const expiredTime = currentTime - 3600 // 1 hour ago

    const payload: JwtDecodedPayload = {
      exp: expiredTime,
      iat: currentTime - 7200,
      jti: 'test-jti',
      iss: 'http://localhost:8080/realms/test-realm',
      aud: 'ghostfolio-api',
      sub: 'user123',
      typ: 'Bearer',
      azp: 'ghostfolio-script',
      scope: 'openid profile email',
      client_id: 'ghostfolio-script',
    }

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException)
    expect(() => strategy.validate(payload)).toThrow('Token has expired')
  })

  it('should validate token with valid expiration', () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const futureTime = currentTime + 3600 // 1 hour from now

    const payload: JwtDecodedPayload = {
      exp: futureTime,
      iat: currentTime,
      jti: 'test-jti',
      iss: 'http://localhost:8080/realms/test-realm',
      aud: 'ghostfolio-api',
      sub: 'user123',
      typ: 'Bearer',
      azp: 'ghostfolio-script',
      scope: 'openid profile email',
      client_id: 'ghostfolio-script',
    }

    const result = strategy.validate(payload)

    expect(result).toEqual(payload)
  })

  it('should throw UnauthorizedException for token issued in the future', () => {
    const currentTime = Math.floor(Date.now() / 1000)
    const futureTime = currentTime + 600 // 10 minutes in the future

    const payload: JwtDecodedPayload = {
      exp: currentTime + 3600,
      iat: futureTime,
      jti: 'test-jti',
      iss: 'http://localhost:8080/realms/test-realm',
      aud: 'ghostfolio-api',
      sub: 'user123',
      typ: 'Bearer',
      azp: 'ghostfolio-script',
      scope: 'openid profile email',
      client_id: 'ghostfolio-script',
    }

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException)
    expect(() => strategy.validate(payload)).toThrow('Token issued in the future')
  })
})
