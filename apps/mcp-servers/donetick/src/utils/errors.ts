/**
 * Errors: a readable message from anything thrown, and the error type of failed Donetick calls.
 */

/** Readable message from anything that was thrown (an `Error` or any other value). */
export const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** A failed Donetick call. The message is safe to show to the AI client: it never contains the token. */
export class DonetickError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'DonetickError'
    this.status = status
  }
}
