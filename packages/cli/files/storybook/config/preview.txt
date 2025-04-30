import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from '@storybook/addon-viewport'
import type { Decorator, Preview, ReactRenderer } from '@storybook/react'
import type { PartialStoryFn, StoryContext } from '@storybook/types'
import type { FunctionComponent } from 'react'

const RootStory: FunctionComponent<{ context: StoryContext; story: PartialStoryFn<ReactRenderer> }> = ({
  context,
  story: Story,
}) => <Story {...context} />

const RootDecorator: Decorator = (story, context) => <RootStory context={context} story={story} />

const preview: Preview = {
  decorators: [RootDecorator],
  parameters: {
    viewport: {
      viewports: {
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
