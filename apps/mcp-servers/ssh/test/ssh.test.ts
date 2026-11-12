/**
 * End-to-end test, no Docker or real sshd needed:
 *   1. start a fake SSH server in this process (it runs commands with the local `sh`),
 *   2. start the real MCP server (src/main.ts) as a child process, pointed at the fake SSH server,
 *   3. call every tool through a real MCP client and check the answers.
 * Run with `pnpm test`.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { request } from 'node:http'

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import ssh2 from 'ssh2'

const { Server, utils } = ssh2
const MCP_PORT = 9611
const TEST_DIR = '/tmp/mcp-ssh-test'

// ---- 1. Fake SSH server ----

const getFingerprint = (publicKey: string) => {
  const key = utils.parseKey(publicKey)
  if (key instanceof Error) throw key
  return `SHA256:${createHash('sha256').update(key.getPublicSSH()).digest('base64').replace(/=+$/, '')}`
}

const hostKey = utils.generateKeyPairSync('ed25519') // identifies the fake server
const userKey = utils.generateKeyPairSync('ed25519') // the MCP server logs in with this
const userPublicKey = utils.parseKey(userKey.public)
if (userPublicKey instanceof Error) throw userPublicKey

const sshd = new Server({ hostKeys: [hostKey.private] }, (client) => {
  client
    .on('authentication', (ctx) => {
      if (ctx.method === 'publickey' && ctx.key.algo === userPublicKey.type) {
        ctx.accept()
        return
      }
      ctx.reject(['publickey'])
    })
    .on('ready', () => {
      // Run each requested command with the local `sh` and stream its output back.
      client.on('session', (accept) => {
        accept().on('exec', (acceptExec, _reject, info) => {
          const channel = acceptExec()
          const shell = spawn('sh', ['-c', info.command])
          shell.stdout.pipe(channel, { end: false })
          shell.stderr.pipe(channel.stderr, { end: false })
          shell.on('close', (code) => {
            channel.exit(code ?? 1)
            channel.end()
          })
        })
      })
    })
    .on('error', () => {
      // Clients drop connections on purpose (wrong host key, timeouts).
    })
})
await new Promise<void>((resolve) => {
  sshd.listen(0, '127.0.0.1', resolve)
})
const sshPort = (sshd.address() as { port: number }).port

// ---- 2. Real MCP server, configured with two aliases for the fake SSH server ----

const hosts = {
  // Correct host key fingerprint: connections work.
  local: {
    host: '127.0.0.1',
    port: sshPort,
    username: 'tester',
    privateKey: userKey.private,
    hostKeySha256: getFingerprint(hostKey.public),
  },
  // Wrong fingerprint: the MCP server must refuse to connect.
  'wrong-key': {
    host: '127.0.0.1',
    port: sshPort,
    username: 'tester',
    privateKey: userKey.private,
    hostKeySha256: `SHA256:${'A'.repeat(43)}`,
  },
}
const mcpServer = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
  env: {
    ...process.env,
    SSH_HOSTS: JSON.stringify(hosts),
    MCP_PORT: String(MCP_PORT),
    MCP_ALLOWED_HOSTS: '127.0.0.1,localhost',
  },
  stdio: ['ignore', 'pipe', 'inherit'],
})
await new Promise<void>((resolve, reject) => {
  mcpServer.stdout.on('data', (data: Buffer) => {
    if (data.toString().includes('listening')) resolve()
  })
  mcpServer.once('exit', (code) => {
    reject(new Error(`MCP server exited with code ${String(code)}`))
  })
})

// Pinned to the 2026-07-28 protocol: connect() fails unless `server/discover` offers it.
const mcp = new Client({ name: 'test', version: '0' }, { versionNegotiation: { mode: { pin: '2026-07-28' } } })
await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${MCP_PORT}/mcp`)))

/** Calls a tool and returns its text answer. */
const callTool = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await mcp.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  if (!first) throw new Error(`${name} returned no content`)
  return { text: first.text, isError: Boolean(result.isError) }
}

/** Sends a request with a custom Host header (fetch() ignores it, so this uses node:http). */
const getStatusForHost = (host: string) =>
  new Promise<number>((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port: MCP_PORT,
        path: '/mcp',
        method: 'POST',
        headers: { Host: host, 'content-type': 'application/json' },
      },
      (res) => {
        res.resume()
        resolve(res.statusCode ?? 0)
      },
    )
    req.on('error', reject)
    req.end('{}')
  })

// ---- 3. Checks ----

try {
  // Protocol: 2025-era clients still work (stateless fallback answers `initialize`, no session id)
  const legacy = await fetch(`http://127.0.0.1:${MCP_PORT}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'legacy', version: '0' } },
    }),
  })
  assert.equal(legacy.status, 200)
  assert.equal(legacy.headers.get('mcp-session-id'), null, 'server must stay stateless')
  assert.match(await legacy.text(), /"serverInfo":\{"name":"mcp-ssh-server"/)

  assert.equal(mcp.getNegotiatedProtocolVersion(), '2026-07-28')

  // Tool list and host list
  const { tools } = await mcp.listTools()
  assert.deepEqual(tools.map((tool) => tool.name).toSorted(), [
    'ssh_close',
    'ssh_exec',
    'ssh_list_hosts',
    'ssh_open',
    'ssh_run',
  ])
  const listed = await callTool('ssh_list_hosts')
  assert.match(listed.text, /local: tester@127\.0\.0\.1/)

  // ssh_exec: exit code, stdout and stderr
  const executed = await callTool('ssh_exec', { host: 'local', command: 'echo hi; echo err >&2; exit 3' })
  assert.match(executed.text, /exit: 3/)
  assert.match(executed.text, /--- stdout ---\nhi\n/)
  assert.match(executed.text, /--- stderr ---\nerr\n/)

  // ssh_exec: refused hosts
  const wrongHostKey = await callTool('ssh_exec', { host: 'wrong-key', command: 'true' })
  assert.ok(wrongHostKey.isError, 'wrong host key must be refused')
  const unknownHost = await callTool('ssh_exec', { host: 'nope', command: 'true' })
  assert.ok(unknownHost.isError, 'unknown host alias must be refused')

  // ssh_exec: limits
  const timedOut = await callTool('ssh_exec', { host: 'local', command: 'sleep 5', timeout_s: 1 })
  assert.match(timedOut.text, /timed out/)
  const large = await callTool('ssh_exec', {
    host: 'local',
    command: String.raw`head -c 200000 /dev/zero | tr "\0" a`,
  })
  assert.match(large.text, /truncated/)

  // Sessions: the working directory survives between calls, even after `exit`
  const opened = await callTool('ssh_open', { host: 'local' })
  const sessionId = /session_id: (\S+)/.exec(opened.text)?.[1]
  assert.ok(sessionId, 'ssh_open must return a session_id')
  assert.match(sessionId, /^ssh_[A-Za-z0-9_-]{22}$/)

  await callTool('ssh_run', { session_id: sessionId, command: `mkdir -p ${TEST_DIR} && cd ${TEST_DIR}` })
  const pwd = await callTool('ssh_run', { session_id: sessionId, command: 'pwd' })
  assert.match(pwd.text, /cwd: \/tmp\/mcp-ssh-test/)
  assert.match(pwd.text, /--- stdout ---\n\/tmp\/mcp-ssh-test\n/)
  const exited = await callTool('ssh_run', { session_id: sessionId, command: 'exit 5' })
  assert.match(exited.text, /exit: 5/)
  const pwdAfterExit = await callTool('ssh_run', { session_id: sessionId, command: 'pwd' })
  assert.match(pwdAfterExit.text, /cwd: \/tmp\/mcp-ssh-test/)

  // Sessions: a closed session cannot be used
  const closed = await callTool('ssh_close', { session_id: sessionId })
  assert.match(closed.text, /closed/)
  const gone = await callTool('ssh_run', { session_id: sessionId, command: 'pwd' })
  assert.ok(gone.isError && gone.text.includes('expired or does not exist'))

  // HTTP: unknown Host header is refused
  assert.equal(await getStatusForHost('evil.example'), 403, 'unknown Host header must be refused')

  console.log('ok: all checks passed')
} finally {
  await mcp.close()
  mcpServer.kill()
  sshd.close()
  // Open sockets must not keep a failed run alive.
  // eslint-disable-next-line unicorn/no-process-exit -- standalone test script
  setTimeout(() => process.exit(process.exitCode ?? 0), 100).unref()
}
