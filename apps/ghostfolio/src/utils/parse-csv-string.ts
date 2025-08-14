import { parse } from 'csv-parse/sync'

export const parseCsvString = (csvString: string, delimiter = ';', columns = true): Record<string, string>[] => {
  const records = parse(csvString, {
    delimiter,
    columns,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]
  return records
}
