/**
 * End-to-end test, no real Donetick needed:
 *   1. start a fake Donetick eAPI in this process (token check, the routes the tools use, the web app's HTML fallback),
 *   2. start the real MCP server (src/main.ts) as a child process, pointed at the fake eAPI,
 *   3. call every tool through a real MCP client and check the answers and what the fake eAPI received.
 * Run with `pnpm test`.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer, request, type ServerResponse } from 'node:http'

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'

const MCP_PORT = 9612
const WRONG_TOKEN_MCP_PORT = 9613
const TOKEN = 'test-token-0123456789abcdef'
const HOST_HEADER = 'donetick.test'

// ---- 1. Fake Donetick eAPI ----

const chores = [
  {
    id: 1,
    name: 'Pay VAT',
    description: '<p>Monthly <b>VAT</b> return</p>',
    frequencyType: 'monthly',
    frequency: 1,
    nextDueDate: '2026-11-24T21:59:59Z',
    priority: 1,
    points: 1,
    assignedTo: 1,
    isActive: true,
    labelsV2: [{ id: 4, name: 'Work' }],
    syncVersion: 74,
  },
  {
    id: 2,
    name: 'Cook meals',
    frequencyType: 'interval',
    frequency: 20,
    frequencyMetadata: { unit: 'days' },
    nextDueDate: '2026-11-29T17:00:00Z',
    priority: 2,
    points: 1,
    assignedTo: 1,
    isActive: true,
    labelsV2: [{ id: 1, name: 'Health' }],
  },
  {
    id: 3,
    name: 'Check windows',
    frequencyType: 'once',
    frequency: 1,
    nextDueDate: null,
    priority: 1,
    assignedTo: 1,
    isActive: true,
    labelsV2: [{ id: 3, name: 'Renovation' }],
  },
  {
    id: 4,
    name: 'Old archived chore',
    frequencyType: 'once',
    nextDueDate: '2026-10-01T00:00:00Z',
    isActive: false,
    labelsV2: [],
  },
]
const members = [
  { id: 1, userId: 1, circleId: 1, role: 'admin', isActive: true, username: 'tester', displayName: 'Test User' },
]

type Seen = { method: string; url: string; host: string | undefined; body: unknown }
const seen: Seen[] = []
let failMembersOnce = true // first GET of the members answers 503, to check the retry of GET
// Like the KEDA interceptor while Donetick sleeps: the next `asleepFor` requests get 503 and an HTML page, unforwarded.
let asleepFor = 0
const STARTING_PAGE = '<!doctype html><html><head><meta http-equiv="refresh" content="3"></head>Starting…</html>'

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

/** The fake eAPI's answer to one request: status and JSON body. */
const answerEapi = (
  method: string,
  url: string,
  raw: string,
  key: string | string[] | undefined,
): [number, unknown] => {
  if (key === undefined) return [401, { error: 'API token required' }]
  if (key !== TOKEN) return [401, { error: 'Invalid API token' }]

  if (method === 'GET' && url === '/eapi/v1/chore') return [200, chores]
  if (method === 'GET' && url === '/eapi/v1/circle/members') {
    if (failMembersOnce) {
      failMembersOnce = false
      return [503, { error: 'waking up' }]
    }
    return [200, members]
  }
  if (method === 'POST' && url === '/eapi/v1/chore') return [200, { id: 99, ...JSON.parse(raw) }]
  if (method === 'PUT' && /^\/eapi\/v1\/chore\/\d+$/.test(url)) return [200, JSON.parse(raw)]
  if (method === 'POST' && /^\/eapi\/v1\/chore\/\d+\/complete$/.test(url)) return [200, { id: 1, ok: true }]
  return [404, { error: 'not found' }]
}

const fakeDonetick = createServer((req, res) => {
  const chunks: Buffer[] = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    const url = req.url ?? ''
    const method = req.method ?? ''
    seen.push({ method, url, host: req.headers.host, body: raw ? JSON.parse(raw) : undefined })

    if (asleepFor > 0) {
      asleepFor -= 1
      res.writeHead(503, { 'content-type': 'text/html' })
      res.end(STARTING_PAGE)
      return
    }
    if (url === '/eapi/v1/bad-gateway') {
      // like a failing proxy in front of Donetick: an HTML error page
      res.writeHead(502, { 'content-type': 'text/html' })
      res.end('<html><body>Bad Gateway</body></html>')
      return
    }
    if (!url.startsWith('/eapi/v1/')) {
      // like the real web app: every other path is its index.html with status 200
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end('<!doctype html><html></html>')
      return
    }
    const [status, body] = answerEapi(method, url, raw, req.headers.secretkey)
    sendJson(res, status, body)
  })
})
await new Promise<void>((resolve) => {
  fakeDonetick.listen(0, '127.0.0.1', resolve)
})
const fakePort = (fakeDonetick.address() as { port: number }).port

// ---- 2. Real MCP servers: one with the right token, one with a wrong one ----

const startMcpServer = async (port: number, token: string) => {
  const logs: string[] = []
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    env: {
      ...process.env,
      DONETICK_BASE_URL: `http://127.0.0.1:${fakePort}`,
      DONETICK_TOKEN: token,
      DONETICK_HOST_HEADER: HOST_HEADER,
      MCP_PORT: String(port),
      MCP_ALLOWED_HOSTS: '127.0.0.1,localhost',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stderr.on('data', (data: Buffer) => logs.push(data.toString()))
  await new Promise<void>((resolve, reject) => {
    child.stdout.on('data', (data: Buffer) => {
      logs.push(data.toString())
      if (data.toString().includes('listening')) resolve()
    })
    child.once('exit', (code) => {
      reject(new Error(`MCP server exited with code ${String(code)}: ${logs.join('')}`))
    })
  })
  // Pinned to the 2026-07-28 protocol: connect() fails unless `server/discover` offers it.
  const mcp = new Client({ name: 'test', version: '0' }, { versionNegotiation: { mode: { pin: '2026-07-28' } } })
  await mcp.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)))
  return { child, mcp, logs }
}

const good = await startMcpServer(MCP_PORT, TOKEN)
const bad = await startMcpServer(WRONG_TOKEN_MCP_PORT, 'wrong-token-0123456789')

/** Calls a tool and returns its text answer. */
const callTool = async (mcp: Client, name: string, args: Record<string, unknown> = {}) => {
  const result = await mcp.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  if (!first) throw new Error(`${name} returned no content`)
  return { text: first.text, isError: Boolean(result.isError) }
}
const callJson = async (name: string, args: Record<string, unknown> = {}) => {
  const { text, isError } = await callTool(good.mcp, name, args)
  assert.ok(!isError, `${name} failed: ${text}`)
  return JSON.parse(text) as Record<string, unknown> & { chores?: { id: number }[] }
}

const getChoreIds = (list: Awaited<ReturnType<typeof callJson>>) => list.chores?.map((chore) => chore.id)

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
  assert.match(await legacy.text(), /"serverInfo":\{"name":"mcp-donetick-server"/)
  assert.equal(good.mcp.getNegotiatedProtocolVersion(), '2026-07-28')

  // Tool list: no delete tool
  const { tools } = await good.mcp.listTools()
  assert.deepEqual(tools.map((tool) => tool.name).toSorted(), [
    'complete_chore',
    'create_chore',
    'list_chores',
    'list_members',
    'update_chore',
  ])

  // list_chores: active only, earliest due date first, no due date last, HTML stripped, noise fields dropped
  const active = await callJson('list_chores')
  assert.equal(active.total, 3)
  assert.deepEqual(
    active.chores?.map((chore) => chore.id),
    [1, 2, 3],
  )
  const [vat] = active.chores ?? []
  assert.deepEqual(vat, {
    id: 1,
    name: 'Pay VAT',
    description: 'Monthly VAT return',
    schedule: 'monthly',
    dueDate: '2026-11-24T21:59:59Z',
    priority: 1,
    points: 1,
    labels: ['Work'],
    assignedTo: 1,
    isActive: true,
  })
  assert.match(JSON.stringify(active), /every 20 days/)
  assert.doesNotMatch(JSON.stringify(active), /syncVersion/)

  // list_chores: filters
  const allStatuses = await callJson('list_chores', { status: 'all' })
  assert.equal(allStatuses.total, 4)
  const byLabel = await callJson('list_chores', { label: 'renovation' })
  assert.deepEqual(getChoreIds(byLabel), [3])
  const bySearch = await callJson('list_chores', { search: 'vat' })
  assert.deepEqual(getChoreIds(bySearch), [1])
  const byDueDate = await callJson('list_chores', { due_before: '2026-11-24' })
  assert.deepEqual(getChoreIds(byDueDate), [1])
  const limited = await callJson('list_chores', { limit: 1 })
  assert.equal(limited.chores?.length, 1)
  const badDate = await callTool(good.mcp, 'list_chores', { due_before: 'tomorrow-ish' })
  assert.ok(badDate.isError, 'an invalid date must be refused')

  // The fake eAPI got the token (it answered 200) and the Host header override
  assert.ok(seen.length > 0 && seen.every((call) => call.host === HOST_HEADER), 'Host header must be the override')

  // list_members: the first GET answers 503, the client retries once
  const membersBefore = seen.filter((call) => call.url === '/eapi/v1/circle/members').length
  const listed = await callTool(good.mcp, 'list_members')
  assert.ok(!listed.isError, listed.text)
  assert.deepEqual(JSON.parse(listed.text), [
    { userId: 1, username: 'tester', displayName: 'Test User', role: 'admin', isActive: true },
  ])
  assert.equal(
    seen.filter((call) => call.url === '/eapi/v1/circle/members').length - membersBefore,
    2,
    'GET retried once',
  )

  // create_chore: body in eAPI field names; the answer is a summary
  const created = await callJson('create_chore', {
    name: 'Buy gifts',
    due_date: '2026-12-01',
    priority: 2,
    assigned_to: 1,
    label_ids: [2],
  })
  assert.equal(created.id, 99)
  assert.equal(created.name, 'Buy gifts')
  const createCall = seen.findLast((call) => call.method === 'POST' && call.url === '/eapi/v1/chore')
  assert.deepEqual(createCall?.body, {
    name: 'Buy gifts',
    dueDate: '2026-12-01',
    nextDueDate: '2026-12-01',
    priority: 2,
    assignedTo: 1,
    assignees: [{ userId: 1 }],
    labelsV2: [{ id: 2 }],
    frequencyType: 'once',
    frequency: 1,
    assignStrategy: 'keep_last_assigned',
    isActive: true,
  })

  // update_chore: sends the whole chore with the change applied, other fields stay
  const updated = await callJson('update_chore', { chore_id: 1, priority: 3 })
  assert.equal(updated.priority, 3)
  const updateCall = seen.findLast((call) => call.method === 'PUT')
  assert.equal(updateCall?.url, '/eapi/v1/chore/1')
  const updateBody = updateCall.body as { priority: number; name: string; syncVersion: number }
  assert.equal(updateBody.priority, 3)
  assert.equal(updateBody.name, 'Pay VAT')
  assert.equal(updateBody.syncVersion, 74)
  const putsBefore = seen.filter((call) => call.method === 'PUT').length
  const noChange = await callTool(good.mcp, 'update_chore', { chore_id: 1 })
  assert.ok(noChange.isError, 'no field to change must be refused')
  const unknownChore = await callTool(good.mcp, 'update_chore', { chore_id: 404, name: 'x' })
  assert.ok(unknownChore.isError, 'unknown chore must be refused')
  assert.equal(seen.filter((call) => call.method === 'PUT').length, putsBefore, 'refused updates send nothing')

  // complete_chore: POST, no body without a note, never retried
  const done = await callJson('complete_chore', { chore_id: 2 })
  assert.equal(done.id, 1) // the fake answers with its own object; the point is that the call went through
  const completeCall = seen.findLast((call) => call.url === '/eapi/v1/chore/2/complete')
  assert.equal(completeCall?.method, 'POST')
  assert.equal(completeCall.body, undefined)
  await callJson('complete_chore', { chore_id: 2, note: 'done at last' })
  assert.deepEqual(seen.findLast((call) => call.url === '/eapi/v1/chore/2/complete')?.body, { note: 'done at last' })

  // Input validation: ids are numbers, so nothing can inject a path
  const injected = await callTool(good.mcp, 'complete_chore', { chore_id: '2/../../x' })
  assert.ok(injected.isError)

  // A wrong token: Donetick's message comes through, the token itself never does
  const rejected = await callTool(bad.mcp, 'list_chores')
  assert.ok(rejected.isError)
  assert.match(rejected.text, /Donetick answered 401: Invalid API token/)
  assert.ok(!rejected.text.includes('wrong-token'))

  // Neither the real nor the wrong token is ever logged
  const allLogs = [...good.logs, ...bad.logs].join('')
  assert.ok(!allLogs.includes(TOKEN) && !allLogs.includes('wrong-token'), 'tokens must not appear in logs')

  // Client checks, through the client directly (no tool calls these paths) and with short retry pauses
  const { createDonetickClient } = await import('../src/donetick-client.js')
  const client = createDonetickClient(
    { baseUrl: `http://127.0.0.1:${fakePort}`, token: TOKEN },
    { delayMs: 10, maxWakeUpAttempts: 4 },
  )
  const countCalls = (method: string, url: string) =>
    seen.filter((call) => call.method === method && call.url === url).length

  // A path the eAPI does not have: the web app's HTML is reported as such
  await assert.rejects(client.call('GET', '/eapi/v1/nope-not-here'), /Donetick answered 404: not found/)
  await assert.rejects(client.call('GET', '/other'), /HTML page/)

  // An HTML error page from a proxy names its status, not a missing route
  await assert.rejects(client.call('GET', '/eapi/v1/bad-gateway'), /Donetick answered 502 with an HTML page/)

  // Donetick asleep: the "starting" page is retried for every method, POST too, until Donetick answers
  asleepFor = 2
  const postsBefore = countCalls('POST', '/eapi/v1/chore')
  const woken = (await client.call('POST', '/eapi/v1/chore', { name: 'After a nap' })) as { id: number }
  assert.equal(woken.id, 99)
  assert.equal(countCalls('POST', '/eapi/v1/chore') - postsBefore, 3, '2 bounced by the interceptor, then 1 real')

  // Still asleep after the last attempt: a clear error instead of the HTML message
  asleepFor = 100
  const asleepPutsBefore = countCalls('PUT', '/eapi/v1/chore/1')
  await assert.rejects(client.call('PUT', '/eapi/v1/chore/1', { name: 'x' }), /Donetick is still starting up/)
  assert.equal(countCalls('PUT', '/eapi/v1/chore/1') - asleepPutsBefore, 4, 'at most maxWakeUpAttempts requests')
  asleepFor = 0

  // HTTP: unknown Host header is refused
  assert.equal(await getStatusForHost('evil.example'), 403, 'unknown Host header must be refused')

  console.log('ok: all checks passed')
} finally {
  await good.mcp.close()
  await bad.mcp.close()
  good.child.kill()
  bad.child.kill()
  fakeDonetick.close()
  // Open sockets must not keep a failed run alive.
  // eslint-disable-next-line unicorn/no-process-exit -- standalone test script
  setTimeout(() => process.exit(process.exitCode ?? 0), 100).unref()
}
