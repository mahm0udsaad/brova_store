"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { AISidebar } from "./ai-sidebar"

interface AISidebarContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const AISidebarContext = createContext<AISidebarContextValue | null>(null)

export function useAISidebar() {
  const context = useContext(AISidebarContext)
  if (!context) {
    throw new Error("useAISidebar must be used within AISidebarProvider")
  }
  return context
}

interface AISidebarProviderProps {
  children: ReactNode
}

export function AISidebarProvider({ children }: AISidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <AISidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <AISidebar isOpen={isOpen} onClose={close} />
    </AISidebarContext.Provider>
  )
}
