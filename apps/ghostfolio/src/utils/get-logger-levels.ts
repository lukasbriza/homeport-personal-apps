import { LogLevel } from '@nestjs/common'

/**
 * @returns LogLevel array based on enviroment.
 */
export const getLoggerLevels = (): LogLevel[] =>
  process.env.NODE_ENV === 'development'
    ? ['log', 'error', 'warn', 'debug', 'verbose', 'fatal']
    : ['warn', 'error', 'fatal']
