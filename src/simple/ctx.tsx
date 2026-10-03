import { createContext, useContext } from 'react'

export interface UI {
  openItem: (id: string) => void
  openPerson: (id: string) => void
  openProfile: () => void
  openRoutes: () => void
  openTour: () => void
  go: (path: string) => void
}
export const UICtx = createContext<UI>(null as unknown as UI)
export const useUI = () => useContext(UICtx)
