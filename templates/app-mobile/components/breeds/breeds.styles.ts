import styled from '@emotion/native'

// Component styles as an @emotion/native `styled` module — RN primitives
// (styled.View / styled.Text) reading design tokens from the theme.
export const BreedList = styled.View`
  gap: 4px;
`

export const BreedItem = styled.Text`
  padding: 4px 8px;
  font-size: ${({ theme }) => theme.typography.bodySize}px;
  color: ${({ theme }) => theme.colors.text};
`
