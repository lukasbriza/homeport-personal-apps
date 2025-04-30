export const allowChooseName = (option: string) => {
  if (option.includes('Storybook') || option.includes('Theme') || option.includes('Component library')) {
    return false
  }
  return true
}
