'use client'

// Next requires the `error` route file itself to be a Client Component (it is an error
// boundary), so this thin re-export carries the 'use client' directive.
export { ErrorPage as default } from '@/modules/home/error'
