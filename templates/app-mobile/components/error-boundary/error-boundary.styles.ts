import styled from '@emotion/native'
import { Pressable } from 'react-native'

export const Screen = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.background};
`

export const Title = styled.Text`
  font-size: ${({ theme }) => theme.typography.titleSize}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text};
`

export const Message = styled.Text`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Retry = styled(Pressable)`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.primary};
`

export const RetryLabel = styled.Text`
  color: ${({ theme }) => theme.colors.background};
  font-weight: ${({ theme }) => theme.typography.weightBold};
`
