/**
 * Wizard framework types (stub).
 */

import type { ReactNode } from 'react'

export type WizardStepComponent<T = any> = React.ComponentType<{
  wizardData: T
}>

export type WizardContextValue<T = any> = {
  currentStepIndex: number
  totalSteps: number
  wizardData: T
  updateWizardData: (data: Partial<T>) => void
  goNext: () => void
  goBack: () => void
  title?: string
  showStepCounter: boolean
}

export type WizardProviderProps<T = any> = {
  steps: WizardStepComponent<T>[]
  initialData?: T
  onComplete: (data: T) => void
  onCancel: () => void
  children: ReactNode
  title?: string
  showStepCounter?: boolean
}
