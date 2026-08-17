import styled from '@emotion/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// GestureHandlerRootView must wrap the app (required by gesture-handler /
// Reanimated) and fill the screen.
export const Root = styled(GestureHandlerRootView)`
  flex: 1;
`
