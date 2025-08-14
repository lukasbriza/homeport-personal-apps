import { ConsoleLogger } from '@nestjs/common'

import { getLoggerLevels } from '../utils'

export class WithLogger {
  protected logger: ConsoleLogger

  constructor(name: string) {
    this.logger = new ConsoleLogger(name, { logLevels: getLoggerLevels() })
  }
}
