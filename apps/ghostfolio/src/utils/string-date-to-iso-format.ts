/**
 * Accept string date in format DD.MM.YYYY
 */
export const stringDateToIsoFormat = (stringDate: string) => {
  const [day, month, year] = stringDate.split('.').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toISOString()
}
