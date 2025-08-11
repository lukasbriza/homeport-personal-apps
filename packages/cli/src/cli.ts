import { createProject } from './start/create-project.js'
import { crossroad, cliStart, settings, cliEnd } from './start/index.js'

const main = async () => {
  await cliStart()

  const { stop, option: crossroadOption } = crossroad()

  if (stop) {
    cliEnd()
    return
  }

  // Create project flow
  if (crossroadOption === 0) {
    const { stop } = createProject()

    if (stop) {
      cliEnd()
      return
    }

    return
  }

  // Settings flow
  if (crossroadOption === 1) {
    const { stop } = await settings()

    if (stop === false) {
      await main()
      return
    }
  }

  cliEnd()
}

await main()
