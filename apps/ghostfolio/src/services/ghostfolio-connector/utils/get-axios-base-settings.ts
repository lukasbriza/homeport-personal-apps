import http from 'node:http'

export const getAxiosBaseSettings = () => ({
  timeout: 10_000,
  httpAgent: new http.Agent({ keepAlive: false }),
})
