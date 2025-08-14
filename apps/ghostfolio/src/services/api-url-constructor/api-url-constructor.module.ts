import { Module } from '@nestjs/common'

import { ApiUrlConstructorService } from './api-url-constructor.service'

@Module({
  imports: [],
  providers: [ApiUrlConstructorService],
  exports: [ApiUrlConstructorService],
})
export class ApiUrlConstructorModule {}
