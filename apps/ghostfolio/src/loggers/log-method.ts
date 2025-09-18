import { Logger } from '@nestjs/common'

const logger = new Logger('LogMethod')

export function LogMethod(): MethodDecorator {
  return function <Args extends unknown[], Return, T extends (...args: Args) => Return>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value

    if (!originalMethod) {
      return descriptor
    }

    const wrappedMethod: T = function (this: ThisParameterType<T>, ...args: Args): Return {
      const className = target.constructor.name

      if (process.env.NODE_ENV === 'development') {
        logger.log(`${className}.${String(propertyKey)}`)
      }
      return originalMethod.apply(this, args)
    } as T

    descriptor.value = wrappedMethod

    return descriptor
  } as MethodDecorator
}
