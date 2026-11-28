/**
 * End-to-end test, no real Donetick needed:
 *   1. start a fake Donetick in this process: token check, the eAPI and main-API routes the tools use (the edit route
 *      stores exactly what it gets, like the real one), the web app's HTML fallback,
 *   2. start the real MCP server (src/main.ts) as a child process, pointed at the fake Donetick,
 *   3. call every tool through a real MCP client and check the answers and what the fake Donetick received.
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

// ---- 1. Fake Donetick ----

type FakeSubtask = {
  id: number
  name: string
  orderId: number
  completedAt: string | null
  completedBy: number
  parentId: number | null
}
type FakeChore = Record<string, unknown> & {
  id: number
  updatedAt?: string
  subTasks?: FakeSubtask[] | undefined
  labelsV2?: { id: number; name: string }[]
}

const UPDATED_AT = '2026-11-20T10:00:00Z'
const labels = [
  { id: 1, name: 'Health' },
  { id: 2, name: 'Gifts' },
  { id: 3, name: 'Renovation' },
  { id: 4, name: 'Work' },
]
const chores: FakeChore[] = [
  {
    id: 1,
    name: 'Pay VAT',
    description: '<p>Monthly <b>VAT</b> return</p>',
    frequencyType: 'monthly',
    assignStrategy: 'keep_last_assigned',
    frequency: 1,
    nextDueDate: '2026-11-24T21:59:59Z',
    priority: 1,
    points: 1,
    assignedTo: 1,
    isActive: true,
    labelsV2: [{ id: 4, name: 'Work' }],
    syncVersion: 74,
    subTasks: [
      { id: 12, name: 'Submit the form', orderId: 1, completedAt: null, completedBy: 0, parentId: 11 },
      {
        id: 11,
        name: 'Collect invoices',
        orderId: 0,
        completedAt: '2026-11-20T10:00:00Z',
        completedBy: 1,
        parentId: null,
      },
    ],
  },
  {
    id: 2,
    name: 'Cook meals',
    frequencyType: 'interval',
    assignStrategy: 'keep_last_assigned',
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
    assignStrategy: 'keep_last_assigned',
    frequency: 1,
    nextDueDate: null,
    priority: 1,
    assignedTo: 1,
    isActive: true,
    labelsV2: [{ id: 3, name: 'Renovation' }],
    thingChore: { thingId: 7 }, // linked to a Donetick "thing": the edit route would drop the link
  },
  {
    id: 4,
    name: 'Old archived chore',
    frequencyType: 'once',
    assignStrategy: 'keep_last_assigned',
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

/** The fields of Donetick's edit route (`ChoreReq`): a saved chore holds exactly these, everything else is cleared. */
const CHORE_REQ_KEYS = [
  'name',
  'frequencyType',
  'frequency',
  'frequencyMetadata',
  'nextDueDate',
  'isRolling',
  'assignedTo',
  'assignees',
  'assignStrategy',
  'isActive',
  'notification',
  'notificationMetadata',
  'priority',
  'completionWindow',
  'points',
  'description',
  'requireApproval',
  'isPrivate',
  'projectId',
]
let nextChoreId = 99
let nextSubtaskId = 100

/**
 * Like Donetick's create and edit routes: required fields checked, label ids turned into labels, new subtasks (id 0)
 * get ids, omitted subtasks stay. Returns the stored chore, or the error text of a 400.
 */
const toStoredChore = (body: Record<string, unknown>, id: number, old?: FakeChore): FakeChore | string => {
  const isMissing = ['name', 'frequencyType', 'assignStrategy'].some((key) => typeof body[key] !== 'string')
  if (isMissing) return 'Invalid request: name, frequencyType and assignStrategy are required'
  // the real edit route dereferences labelsV2 without a nil check
  if (old && !Array.isArray(body.labelsV2)) return 'runtime error: nil pointer dereference'

  const stored: FakeChore = {
    id,
    updatedAt: new Date().toISOString(),
    ...Object.fromEntries(CHORE_REQ_KEYS.filter((key) => key in body).map((key) => [key, body[key]])),
  }
  const labelIds = (body.labelsV2 as { id: number }[] | undefined) ?? []
  stored.labelsV2 = labelIds.map(
    (label) => labels.find((known) => known.id === label.id) ?? { id: label.id, name: '?' },
  )
  stored.subTasks = Array.isArray(body.subTasks)
    ? (body.subTasks as (Omit<FakeSubtask, 'parentId'> & { parentId?: number | null })[]).map((subtask) =>
        subtask.id > 0
          ? { ...subtask, parentId: subtask.parentId ?? null }
          : {
              ...subtask,
              id: (nextSubtaskId += 1) - 1,
              completedAt: null,
              completedBy: 0,
              parentId: subtask.parentId ?? null,
            },
      )
    : old?.subTasks
  return stored
}

/** Donetick's main API (/api/v1): one chore, the whole-chore edit, create, and checking a subtask off. */
const answerMainApi = (method: string, pathname: string, raw: string): [number, unknown] | undefined => {
  const choreRoute = /^\/api\/v1\/chores\/(\d+)$/.exec(pathname)
  if (method === 'GET' && choreRoute) {
    const chore = chores.find((candidate) => candidate.id === Number(choreRoute[1]))
    if (!chore) return [500, { error: 'Failed to retrieve chore' }]
    return [200, { res: { updatedAt: UPDATED_AT, assignees: [], ...chore } }]
  }
  if (method === 'PUT' && pathname === '/api/v1/chores/') {
    const body = JSON.parse(raw) as Record<string, unknown>
    const index = chores.findIndex((candidate) => candidate.id === body.id)
    const old = chores[index]
    if (!old) return [500, { error: 'Error getting chore' }]
    if (body.updatedAt !== (old.updatedAt ?? UPDATED_AT)) {
      return [403, { error: 'You cannot edit this chore: chore has been modified by another user' }]
    }
    const stored = toStoredChore(body, old.id, old)
    if (typeof stored === 'string') return [400, { error: stored }]
    chores[index] = stored
    return [200, { message: 'Chore updated successfully' }]
  }
  if (method === 'POST' && pathname === '/api/v1/chores/') {
    const stored = toStoredChore(JSON.parse(raw) as Record<string, unknown>, nextChoreId)
    if (typeof stored === 'string') return [400, { error: stored }]
    nextChoreId += 1
    chores.push(stored)
    return [200, { res: stored.id }]
  }
  const subtaskRoute = /^\/api\/v1\/chores\/(\d+)\/subtask$/.exec(pathname)
  if (method === 'PUT' && subtaskRoute) {
    const { id, completedAt } = JSON.parse(raw) as { id: number; completedAt: string | null }
    const chore = chores.find((candidate) => candidate.id === Number(subtaskRoute[1]))
    const subtask = chore?.subTasks?.find((candidate) => candidate.id === id)
    if (subtask) subtask.completedAt = completedAt
    return [200, {}] // like Donetick: 200 with an empty object, also for an unknown subtask
  }
  return undefined
}

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

/** The fake Donetick's answer to one API request: status and JSON body. */
const answerEapi = (
  method: string,
  url: string,
  raw: string,
  key: string | string[] | undefined,
): [number, unknown] => {
  if (key === undefined) return [401, { error: 'API token required' }]
  if (key !== TOKEN) return [401, { error: 'Invalid API token' }]

  const { pathname, searchParams } = new URL(url, 'http://fake')
  if (method === 'GET' && pathname === '/eapi/v1/chore') {
    // like Donetick: subtasks only with the flag
    if (searchParams.get('includeSubtasks') === 'true') return [200, chores]
    return [200, chores.map(({ subTasks: _subTasks, ...chore }) => chore)]
  }
  const mainApiAnswer = answerMainApi(method, pathname, raw)
  if (mainApiAnswer) return mainApiAnswer
  if (method === 'GET' && url === '/eapi/v1/circle/members') {
    if (failMembersOnce) {
      failMembersOnce = false
      return [503, { error: 'waking up' }]
    }
    return [200, members]
  }
  if (method === 'POST' && url === '/eapi/v1/chore') return [200, { id: 99, ...JSON.parse(raw) }]
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
    if (!url.startsWith('/eapi/v1/') && !url.startsWith('/api/v1/')) {
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
    'complete_subtask',
    'create_chore',
    'list_chores',
    'list_members',
    'update_chore',
    'update_subtasks',
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
    labels: [{ id: 4, name: 'Work' }],
    assignedTo: 1,
    isActive: true,
    // in Donetick's order (orderId), nested ones with their parent
    subtasks: [
      { id: 11, name: 'Collect invoices', done: true },
      { id: 12, name: 'Submit the form', done: false, parentId: 11 },
    ],
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

  // create_chore: main API (the eAPI's create would drop most fields); the answer is the stored chore
  const created = await callJson('create_chore', {
    name: 'Buy gifts',
    due_date: '2026-12-01',
    priority: 2,
    points: 3,
    assigned_to: 1,
    label_ids: [2],
    subtasks: ['List people', 'Order online'],
  })
  assert.deepEqual(created, {
    id: 99,
    name: 'Buy gifts',
    schedule: 'once',
    dueDate: '2026-12-01T23:59:59Z',
    priority: 2,
    points: 3,
    labels: [{ id: 2, name: 'Gifts' }],
    assignedTo: 1,
    isActive: true,
    subtasks: [
      { id: 100, name: 'List people', done: false },
      { id: 101, name: 'Order online', done: false },
    ],
  })
  const createCall = seen.findLast((call) => call.method === 'POST' && call.url === '/api/v1/chores/')
  assert.deepEqual(createCall?.body, {
    name: 'Buy gifts',
    nextDueDate: '2026-12-01T23:59:59Z',
    priority: 2,
    points: 3,
    assignedTo: 1,
    assignees: [{ userId: 1 }],
    labelsV2: [{ id: 2 }],
    frequencyType: 'once',
    frequency: 1,
    assignStrategy: 'keep_last_assigned',
    isActive: true,
    subTasks: [
      { id: 0, name: 'List people', orderId: 0 },
      { id: 0, name: 'Order online', orderId: 1 },
    ],
  })

  // update_chore: the whole chore goes back with the change applied, so every other field survives the edit route
  const updated = await callJson('update_chore', { chore_id: 1, priority: 3, label_ids: [4, 1] })
  assert.equal(updated.priority, 3)
  assert.deepEqual(updated.labels, [
    { id: 4, name: 'Work' },
    { id: 1, name: 'Health' },
  ])
  assert.equal(updated.description, 'Monthly VAT return', 'unchanged fields survive')
  assert.equal(updated.points, 1, 'unchanged fields survive')
  assert.equal((updated.subtasks as unknown[]).length, 2, 'subtasks survive')
  const updateCall = seen.findLast((call) => call.method === 'PUT' && call.url === '/api/v1/chores/')
  assert.equal((updateCall?.body as { updatedAt?: unknown }).updatedAt, UPDATED_AT, 'updatedAt goes back for the check')
  const archived = await callJson('update_chore', { chore_id: 2, is_active: false })
  assert.equal(archived.isActive, false, 'is_active: false archives')

  const putsBefore = seen.filter((call) => call.method === 'PUT').length
  const noChange = await callTool(good.mcp, 'update_chore', { chore_id: 1 })
  assert.ok(noChange.isError, 'no field to change must be refused')
  const unknownChore = await callTool(good.mcp, 'update_chore', { chore_id: 404, name: 'x' })
  assert.match(unknownChore.text, /chore 404 does not exist/)
  const linked = await callTool(good.mcp, 'update_chore', { chore_id: 3, name: 'x' })
  assert.match(linked.text, /linked to a Donetick thing/, 'a thing link would be dropped, so the edit is refused')
  assert.equal(seen.filter((call) => call.method === 'PUT').length, putsBefore, 'refused updates send nothing')

  // complete_chore: POST, no body without a note, never retried
  const done = await callJson('complete_chore', { chore_id: 2 })
  assert.equal(done.id, 1) // the fake answers with its own object; the point is that the call went through
  const completeCall = seen.findLast((call) => call.url === '/eapi/v1/chore/2/complete')
  assert.equal(completeCall?.method, 'POST')
  assert.equal(completeCall.body, undefined)
  await callJson('complete_chore', { chore_id: 2, note: 'done at last' })
  assert.deepEqual(seen.findLast((call) => call.url === '/eapi/v1/chore/2/complete')?.body, { note: 'done at last' })

  // complete_subtask: checks off and unchecks one subtask; unknown ids are refused before anything is sent
  const checked = await callJson('complete_subtask', { chore_id: 1, subtask_id: 12 })
  assert.deepEqual(checked, { choreId: 1, subtaskId: 12, name: 'Submit the form', done: true })
  const subtaskCall = seen.findLast((call) => call.url === '/api/v1/chores/1/subtask')
  assert.equal(subtaskCall?.method, 'PUT')
  const subtaskBody = subtaskCall.body as { id: number; choreId: number; completedAt: string | null }
  assert.equal(subtaskBody.id, 12)
  assert.equal(subtaskBody.choreId, 1)
  assert.ok(subtaskBody.completedAt && !Number.isNaN(Date.parse(subtaskBody.completedAt)), 'completedAt is a timestamp')
  const afterCheck = await callJson('list_chores', { search: 'vat' })
  assert.match(JSON.stringify(afterCheck), /"id":12,"name":"Submit the form","done":true/)
  await callJson('complete_subtask', { chore_id: 1, subtask_id: 12, done: false })
  const uncheckCall = seen.findLast((call) => call.url === '/api/v1/chores/1/subtask')
  assert.deepEqual(uncheckCall?.body, { id: 12, choreId: 1, completedAt: null }, 'done: false sends completedAt null')
  const subtaskCallsBefore = seen.filter((call) => call.url.endsWith('/subtask')).length
  const unknownSubtask = await callTool(good.mcp, 'complete_subtask', { chore_id: 1, subtask_id: 999 })
  assert.ok(unknownSubtask.isError, 'an unknown subtask must be refused')
  assert.equal(seen.filter((call) => call.url.endsWith('/subtask')).length, subtaskCallsBefore, 'refused: nothing sent')

  // update_subtasks: add (also nested), rename; done state and the other fields of the chore survive
  const edited = await callJson('update_subtasks', {
    chore_id: 1,
    add: [{ name: 'Pay', parent_id: 11 }, { name: 'File the receipt' }],
    rename: [{ subtask_id: 11, name: 'Collect all invoices' }],
  })
  assert.deepEqual(edited.subtasks, [
    { id: 11, name: 'Collect all invoices', done: true },
    { id: 12, name: 'Submit the form', done: false, parentId: 11 },
    { id: 102, name: 'Pay', done: false, parentId: 11 },
    { id: 103, name: 'File the receipt', done: false },
  ])
  // remove: nested subtasks go with their parent
  const pruned = await callJson('update_subtasks', { chore_id: 1, remove: [11] })
  assert.deepEqual(pruned.removed, [11, 12, 102])
  assert.deepEqual(pruned.subtasks, [{ id: 103, name: 'File the receipt', done: false }])
  const afterEdits = await callJson('list_chores', { search: 'vat' })
  assert.match(JSON.stringify(afterEdits), /"description":"Monthly VAT return".*"priority":3/, 'chore fields survive')

  const editsBefore = seen.filter((call) => call.method === 'PUT' && call.url === '/api/v1/chores/').length
  const unknownEdit = await callTool(good.mcp, 'update_subtasks', { chore_id: 1, remove: [999] })
  assert.match(unknownEdit.text, /has no subtask 999/)
  const conflictingEdit = await callTool(good.mcp, 'update_subtasks', {
    chore_id: 1,
    remove: [103],
    rename: [{ subtask_id: 103, name: 'x' }],
  })
  assert.match(conflictingEdit.text, /is being deleted/)
  const emptyEdit = await callTool(good.mcp, 'update_subtasks', { chore_id: 1 })
  assert.ok(emptyEdit.isError, 'nothing to change must be refused')
  const editsAfter = seen.filter((call) => call.method === 'PUT' && call.url === '/api/v1/chores/').length
  assert.equal(editsAfter, editsBefore, 'refused edits send nothing')

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
