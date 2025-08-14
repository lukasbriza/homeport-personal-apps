/**
 * Accept date in format YYYY-MM-DD.
 */
export const stringDashDateToDateFormat = (stringDate: string) => {
  const [year, month, day] = stringDate.split('-')
  return `${day}.${month}.${year}`
}
