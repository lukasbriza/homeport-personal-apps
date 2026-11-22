/**
 * Low-level helpers of the SSH client (ssh-client.ts): the host key fingerprint and the capped output buffer.
 */
import { createHash } from 'node:crypto'

/** Host key fingerprint in the format `ssh-keygen -lf` prints: "SHA256:" + base64 without padding. */
export const getFingerprint = (hostKey: Buffer) =>
  `SHA256:${createHash('sha256').update(hostKey).digest('base64').replace(/=+$/, '')}`

/** Collects one output stream (stdout or stderr) up to `maxBytes`; anything beyond is dropped. */
export const createOutputCollector = (maxBytes: number) => {
  const chunks: Buffer[] = []
  let size = 0
  let isTruncated = false

  const add = (data: Buffer) => {
    const room = maxBytes - size
    if (data.length > room) isTruncated = true
    if (room <= 0) return
    const kept = data.subarray(0, room)
    chunks.push(kept)
    size += kept.length
  }

  return {
    add,
    getText: () => Buffer.concat(chunks).toString('utf8'),
    isTruncated: () => isTruncated,
  }
}
