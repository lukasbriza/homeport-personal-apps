import readlineSync from 'readline-sync'

export const addTheme = (): string => {
  const answer = readlineSync.question('Do you want to add mui theme? (y/n) ').toLowerCase()

  if (answer.length === 1 && (answer.includes('y') || answer.includes('n'))) {
    return answer
  }
  return addTheme()
}
