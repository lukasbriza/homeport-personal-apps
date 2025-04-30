export enum PROJECT_TYPE {
  APP = 'apps',
  PROJECT = 'packages',
}

export type Option = [string, PROJECT_TYPE]
export type Options = Option[]
