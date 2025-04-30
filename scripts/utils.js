import { existsSync } from 'node:fs'

export const isGitRepository = () => existsSync('.git')
