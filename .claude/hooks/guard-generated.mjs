#!/usr/bin/env node
// PreToolUse guard: block Write/Edit into generated or build output.
// Exit 2 blocks the tool call and shows stderr to Claude; exit 0 allows.
import { readFileSync } from 'node:fs'

const read = (fd) => {
  try {
    return readFileSync(fd, 'utf8')
  } catch {
    return ''
  }
}

let payload
try {
  payload = JSON.parse(read(0))
} catch {
  process.exit(0) // no/invalid payload — don't block
}

const filePath = payload?.tool_input?.file_path
if (typeof filePath !== 'string' || filePath.length === 0) process.exit(0)

const p = filePath.replaceAll('\\', '/')

// Blocked: build/generated output. Ordered so the message can name the cause.
const blocked = [
  { re: /(^|\/)node_modules\//, why: 'node_modules (dependency, not source)' },
  { re: /(^|\/)dist\//, why: 'dist/ (build output)' },
  // ghostfolio's own build output — nest-cli/tsconfig.build.json here output to
  // build/, not dist/ (see apps/ghostfolio/package.json's scripts).
  { re: /(^|\/)build\//, why: 'build/ (build output)' },
  { re: /(^|\/)\.turbo\//, why: '.turbo/ (turbo cache)' },
  { re: /(^|\/)coverage\//, why: 'coverage/ (test output)' },
  { re: /\.tsbuildinfo$/, why: 'TypeScript build info' },
  { re: /\.generated\./, why: 'generated file' },
]

const hit = blocked.find(({ re }) => re.test(p))
if (hit) {
  console.error(
    `Blocked edit to ${filePath}\nReason: ${hit.why}.\n` +
      'This is generated/build output — edit the source and regenerate instead.',
  )
  process.exit(2)
}

process.exit(0)
