import styled from '@emotion/native'

export const Screen = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.background};
`

export const Message = styled.Text`
  color: ${({ theme }) => theme.colors.text};
`

export const HomeLink = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.weightBold};
`
