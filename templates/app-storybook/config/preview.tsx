import type { Decorator, Preview, ReactRenderer } from '@storybook/react-vite'
import type { FunctionComponent } from 'react'
import type { PartialStoryFn, StoryContext } from 'storybook/internal/types'
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from 'storybook/viewport'

const RootStory: FunctionComponent<{ context: StoryContext; story: PartialStoryFn<ReactRenderer> }> = ({
  context,
  story: Story,
}) => <Story {...context} />

const RootDecorator: Decorator = (story, context) => <RootStory context={context} story={story} />

const preview: Preview = {
  decorators: [RootDecorator],
  parameters: {
    viewport: {
      options: {
        ...INITIAL_VIEWPORTS,
        ...MINIMAL_VIEWPORTS,
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['*', ['Docs', 'Overview', '*']],
      },
    },
  },
}

export default preview
