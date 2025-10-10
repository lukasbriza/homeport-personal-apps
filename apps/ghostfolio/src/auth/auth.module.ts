import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { AppConfigTypes } from '../types'

import { JwtAuthGuard } from './jwt/jwt-auth.guard'
import { JwtStrategy } from './jwt/jwt.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AppConfigTypes>) => ({
        // JWT module configuration for token generation (if needed)
        // For Keycloak, we primarily use the strategy for validation
        secret: configService.get<string>('JWT_SECRET') as string,
        signOptions: {
          expiresIn: '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: JwtStrategy,
      useFactory: (configService: ConfigService<AppConfigTypes>) => new JwtStrategy(configService),
      inject: [ConfigService],
    },
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
