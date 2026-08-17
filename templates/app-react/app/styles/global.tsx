import { Global, css } from '@emotion/react'

// App-wide base styles (reset + element defaults). Rendered once in root.tsx and
// extracted with the rest of the Emotion styles during SSR. Component-specific
// styles stay local in each component's `<name>.styles.ts`.
const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: system-ui, sans-serif;
  }
`

export const GlobalStyles = () => <Global styles={globalStyles} />
