import styled from '@emotion/styled'

// Styles live next to their component as an Emotion `styled` module.
// When consuming the monorepo theme, swap this import for the theme-bound
// `styled` from `@lukasbriza/styles` and read design tokens off the theme.
export const BreedList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  list-style: none;
`

export const BreedItem = styled.li`
  padding: 4px 8px;
`
