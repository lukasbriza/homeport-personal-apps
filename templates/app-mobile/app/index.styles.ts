import styled from '@emotion/native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Route-level styles. `SafeAreaView` keeps content clear of notch/home indicator;
// colours come from the theme (dark mode handled in _layout via useColorScheme).
export const Screen = styled(SafeAreaView)`
  flex: 1;
  padding: 24px;
  gap: 12px;
  background-color: ${({ theme }) => theme.colors.background};
`

export const Title = styled.Text`
  font-size: ${({ theme }) => theme.typography.titleSize}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text};
`
