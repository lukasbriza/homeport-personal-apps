import { createStore } from 'zustand'

// Example shared client UI state. Reach for a store only for genuinely
// client-side, cross-component state (open drawers/modals, multi-step wizards).
// Server state -> TanStack Query; URL state -> route params/search; forms -> a form lib.
export type UiState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

// A factory (not a module-level singleton) so each request/render gets its own store —
// a shared singleton would leak state between users during SSR.
export const createUiStore = () =>
  createStore<UiState>((set) => ({
    sidebarOpen: false,
    toggleSidebar: () => {
      set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    },
  }))

export type UiStore = ReturnType<typeof createUiStore>
