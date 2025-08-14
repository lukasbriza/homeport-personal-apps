import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { ApiModule } from './api/api.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
      expandVariables: true,
      isGlobal: true,
      cache: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
