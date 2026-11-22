/**
 * Shell helpers of the session store (session-store.ts): how a session remembers its working directory.
 *
 * Every command runs in a new SSH channel, i.e. a fresh shell that forgets any earlier `cd`. So the store wraps the
 * command into a script that ends by printing a marker line with the directory, and reads that line back.
 */
import { MISSING_CWD_EXIT_CODE } from '../constants.js'

/** Wraps a value in single quotes for `sh`, escaping single quotes inside it. */
export const quoteForShell = (value: string) => `'${value.replaceAll("'", String.raw`'\''`)}'`

/**
 * The script around a session command:
 *   1. enters the remembered directory (exits with MISSING_CWD_EXIT_CODE if it no longer exists),
 *   2. runs the command,
 *   3. prints a marker line "<marker><exit code>:<directory>" telling where the command ended up.
 * If the command calls `exit`, step 3 is skipped: the exit code still arrives over SSH and the remembered directory
 * stays as it was.
 */
export const wrapCommand = (command: string, cwd: string | null, marker: string) => {
  const enterCwd = cwd ? `cd ${quoteForShell(cwd)} || exit ${MISSING_CWD_EXIT_CODE}\n` : ''
  const script = `(\n${enterCwd}${command}\n__rc=$?; printf '\\n${marker}%s:%s\\n' "$__rc" "$PWD"; exit $__rc\n)`
  return `sh -c ${quoteForShell(script)}`
}

/** Finds the marker line from `wrapCommand`, reads the new directory and removes the line from stdout. */
export const extractMarker = (stdout: string, marker: string) => {
  const markerAt = stdout.lastIndexOf(`\n${marker}`)
  if (markerAt === -1) return { stdout, cwd: undefined }

  const markerLine = stdout.slice(markerAt + 1 + marker.length) // "<exit code>:<directory>"
  const match = /^(\d+):(.*)$/m.exec(markerLine)
  return { stdout: stdout.slice(0, markerAt), cwd: match?.[2] }
}
