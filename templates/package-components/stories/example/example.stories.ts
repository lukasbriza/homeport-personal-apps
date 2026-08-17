import type { Meta, StoryObj } from '@storybook/react-vite'

import { Example } from '../../src/index.js'

const meta = {
  component: Example,
  title: 'Example',
  parameters: { backgrounds: { default: 'dark' } },
} satisfies Meta<typeof Example>

type Story = StoryObj<typeof Example>

export const Primary: Story = {}

export default meta
