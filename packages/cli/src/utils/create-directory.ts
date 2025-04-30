import { existsSync, mkdirSync } from 'node:fs'

export const createDirectory = (path: string) => {
  try {
    if (!existsSync(path)) {
      mkdirSync(path)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    throw error
  }
}
