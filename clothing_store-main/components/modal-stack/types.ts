import { ReactNode } from "react"

export interface ModalItem {
  id: string
  content: ReactNode
  options?: ModalOptions
}

export interface ModalOptions {
  dragToDismiss?: boolean
  preventBackdropClick?: boolean
}

export interface ModalStackContextType {
  stack: ModalItem[]
  present: (content: ReactNode, options?: ModalOptions) => void
  dismiss: () => void
  dismissAll: () => void
}
