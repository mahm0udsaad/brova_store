"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { ModalItem, ModalOptions, ModalStackContextType } from "./types"
import { nanoid } from "nanoid"

// Simple ID generator if nanoid is not available or to avoid dependency
const generateId = () => Math.random().toString(36).substring(2, 9)

const ModalStackContext = createContext<ModalStackContextType | undefined>(undefined)

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<ModalItem[]>([])

  const present = useCallback((content: ReactNode, options?: ModalOptions) => {
    setStack((prev) => [...prev, { id: generateId(), content, options }])
  }, [])

  const dismiss = useCallback(() => {
    setStack((prev) => prev.slice(0, -1))
  }, [])

  const dismissAll = useCallback(() => {
    setStack([])
  }, [])

  return (
    <ModalStackContext.Provider value={{ stack, present, dismiss, dismissAll }}>
      {children}
    </ModalStackContext.Provider>
  )
}

export function useModalStack() {
  const context = useContext(ModalStackContext)
  if (context === undefined) {
    throw new Error("useModalStack must be used within a ModalStackProvider")
  }
  return context
}
