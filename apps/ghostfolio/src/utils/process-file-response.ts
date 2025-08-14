import { Readable } from 'node:stream'

import iconv from 'iconv-lite'

export const processFileResponse = async (data: Readable) => {
  const chunks: Buffer[] = []

  for await (const chunk of data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const encoded = Buffer.concat(chunks as never)
  const decoded = iconv.decode(encoded, 'windows-1250')

  return decoded
}
