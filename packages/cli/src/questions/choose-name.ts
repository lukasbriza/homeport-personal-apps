import readlineSync from 'readline-sync'

export const chooseName = () => {
  const name = readlineSync.question('What will be name of your project? ')
  if (name.length === 0) {
    chooseName()
  }
  return name.toLowerCase()
}
