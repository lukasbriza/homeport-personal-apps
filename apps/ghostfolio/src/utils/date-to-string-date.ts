/**
 * Accept date in Date format and returns string date format as DD.MM.YYYY
 */
export const dateToStringdate = (date: Date) => {
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  const stringDate = `${day}.${month}.${year}`

  return stringDate
}
