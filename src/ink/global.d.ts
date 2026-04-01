/**
 * Global type augmentation for Ink's custom React reconciler.
 * Declares JSX intrinsic elements used by Ink's Box/Text components.
 */

import type { ReactNode } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ink-box': {
        children?: ReactNode
        style?: Record<string, any>
        [key: string]: any
      }
      'ink-text': {
        children?: ReactNode
        style?: Record<string, any>
        [key: string]: any
      }
      'ink-root': {
        children?: ReactNode
        [key: string]: any
      }
      'ink-virtual-text': {
        children?: ReactNode
        [key: string]: any
      }
    }
  }
}

export {}
