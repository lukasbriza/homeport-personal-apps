/**
 * Errors: a readable message from anything that was thrown.
 */

/** Readable message from anything that was thrown (an `Error` or any other value). */
export const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))
