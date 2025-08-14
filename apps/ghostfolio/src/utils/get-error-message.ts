export const getErrorMessage = (method: string, error: unknown) =>
  error instanceof Error
    ? `Failed call ${method}(): ${error.message}, cause: ${String(error.cause)}`
    : `Failed ${method}() call.`
