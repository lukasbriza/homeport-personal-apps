'use client'

import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import { useStore } from 'zustand'

import { createUiStore, type UiState, type UiStore } from './ui-store'

const UiStoreContext = createContext<UiStore | null>(null)

export const UiStoreProvider = ({ children }: PropsWithChildren) => {
  // Create the store once per provider instance (i.e. once per request on the server).
  const [store] = useState(createUiStore)

  return <UiStoreContext.Provider value={store}>{children}</UiStoreContext.Provider>
}

// Selector hook — components subscribe to a slice, never to the whole store.
export const useUiStore = <T,>(selector: (state: UiState) => T): T => {
  const store = useContext(UiStoreContext)
  if (!store) {
    throw new Error('useUiStore must be used within a UiStoreProvider')
  }
  return useStore(store, selector)
}
