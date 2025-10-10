import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { ApiModule } from './api/api.module'
import { AuthModule } from './auth'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
      expandVariables: true,
      isGlobal: true,
      cache: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    AuthModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
