import { colorDefinition } from './color-definition'

export const palette = colorDefinition.map(({ key, title, colors }) => ({
  title,
  subtitle: `theme.palette.${key}`,
  colors,
}))

export const usage = `
import { ThemeProvider } from '@lukasbriza/theme';

const App = () => (
  <ThemeProvider>
    {/* App components */}
  </ThemeProvider>
);
`
