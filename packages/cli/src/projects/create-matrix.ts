import { createComponents } from './create-components.js'
import { createNestJs } from './create-nestjs.js'
import { createNextProject } from './create-next-project.js'
import { createStorybook } from './create-storybook.js'
import { createTheme } from './create-theme.js'
import { postCreateNextProject } from './post-create-next-project.js'

export const createMatrix = (option: string, projectName: string) => {
  switch (option) {
    case 'NextJS': {
      createNextProject(projectName)
      postCreateNextProject(projectName)
      break
    }
    case 'Storybook': {
      const connectTheme = createStorybook()
      if (connectTheme === true) {
        createTheme({ connectTheme })
      }
      break
    }
    case 'Theme': {
      createTheme({})
      break
    }
    case 'Component library': {
      createComponents()
      break
    }
    case 'NestJs': {
      createNestJs(projectName)
      break
    }
  }
}
