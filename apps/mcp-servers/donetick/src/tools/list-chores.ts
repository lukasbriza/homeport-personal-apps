/**
 * list_chores: chores, earliest due date first, filtered by status, label, text and due date.
 *
 * Donetick: GET /eapi/v1/chore (all chores). The eAPI has no filters, so filtering and sorting happen here.
 */
import type { McpServer } from '@modelcontextprotocol/server'

import type { Chore, DonetickClient, ListChoresInput } from '../types.js'
import { runTool } from '../utils/run-tool.js'
import { ListChoresInputSchema } from '../validations.js'

import { fetchChores, summarizeChore, toPlainText } from './shared/chores.js'

/** A date without time (`2026-12-24`) means the whole day; a full timestamp is taken as it is. */
const endOfDay = (value: string) => {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  return isDateOnly ? Date.parse(value) + 24 * 60 * 60 * 1000 - 1 : Date.parse(value)
}

const matchesFilter = (chore: Chore, input: ListChoresInput) => {
  if (input.status === 'active' && chore.isActive === false) return false
  if (input.label) {
    const wanted = input.label.toLowerCase()
    if (!(chore.labelsV2 ?? []).some((label) => label.name.toLowerCase() === wanted)) return false
  }
  if (input.search) {
    const needle = input.search.toLowerCase()
    const haystack = `${chore.name} ${toPlainText(chore.description ?? '')}`.toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  if (input.due_before) {
    if (!chore.nextDueDate) return false
    if (Date.parse(chore.nextDueDate) > endOfDay(input.due_before)) return false
  }
  return true
}

/** Earliest due date first; chores with no due date last. */
const compareByDueDate = (a: Chore, b: Chore) => {
  const aTime = a.nextDueDate ? Date.parse(a.nextDueDate) : Number.POSITIVE_INFINITY
  const bTime = b.nextDueDate ? Date.parse(b.nextDueDate) : Number.POSITIVE_INFINITY
  if (aTime === bTime) return a.id - b.id
  return aTime < bTime ? -1 : 1
}

export const registerListChores = (server: McpServer, client: DonetickClient) => {
  const handleListChores = (input: ListChoresInput) =>
    runTool('list_chores', { status: input.status }, async () => {
      const allChores = await fetchChores(client)
      const matching = allChores.filter((chore) => matchesFilter(chore, input)).toSorted(compareByDueDate)
      return { total: matching.length, chores: matching.slice(0, input.limit).map((chore) => summarizeChore(chore)) }
    })

  server.registerTool(
    'list_chores',
    {
      title: 'List chores',
      description:
        'Lists Donetick chores, earliest due date first, with id, name, schedule, due date, priority, points, ' +
        'labels and assignee. Filter by status, label, text or due date. Donetick may need up to a minute to ' +
        'wake up on the first call.',
      inputSchema: ListChoresInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    handleListChores,
  )
}
