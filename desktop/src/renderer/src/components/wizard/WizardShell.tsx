import { useState, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Cloud, CloudOff, Loader2 } from 'lucide-react'
import type { ZodTypeAny } from 'zod'

import { WIZARD_STEPS, type WizardStepId } from '@shared/contracts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWizard } from '@/context/WizardContext'
import { applyIpcError } from '@/lib/form'

/**
 * Chrome shared by all four steps: the stepper, the save indicator, and the
 * back/next controls. Advancing runs that step's zod schema and refuses to move
 * on if it fails, so the four documents cannot be generated from a half-filled
 * form.
 */
export const WizardShell = ({
  title,
  description,
  schema,
  onFinish,
  finishLabel,
  children
}: {
  title: string
  description: string
  schema: ZodTypeAny
  /** Last step only: replaces Next. */
  onFinish?: () => Promise<void>
  finishLabel?: string
  children: ReactNode
}): JSX.Element => {
  const { form, currentStep, goToStep, saveState, lastSavedAt, saveNow, ready } = useWizard()
  const [busy, setBusy] = useState(false)
  const [problems, setProblems] = useState<string[]>([])

  const index = WIZARD_STEPS.findIndex((step) => step.id === currentStep)
  const previous = index > 0 ? WIZARD_STEPS[index - 1] : null
  const next = index < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[index + 1] : null

  /**
   * Runs this step's schema. Messages are also collected into `problems`
   * because several of them belong to rows inside a table — a missing container
   * number on row 2 — where there is no FormMessage slot to render into, and a
   * step that refuses to advance without saying why is worse than one that
   * lets you through.
   */
  const validate = (): boolean => {
    setProblems([])
    const result = schema.safeParse(form.getValues())
    if (result.success) return true

    const messages: string[] = []
    for (const issue of result.error.issues) {
      form.setError(issue.path.join('.') as never, { message: issue.message })
      const row = issue.path.find((segment) => typeof segment === 'number')
      messages.push(row === undefined ? issue.message : `Row ${Number(row) + 1}: ${issue.message}`)
    }
    setProblems([...new Set(messages)])
    return false
  }

  const handleNext = async (): Promise<void> => {
    if (!validate()) return
    setBusy(true)
    try {
      await saveNow()
      if (next) goToStep(next.id as WizardStepId)
    } finally {
      setBusy(false)
    }
  }

  const handleFinish = async (): Promise<void> => {
    if (!validate() || !onFinish) return
    setBusy(true)
    try {
      await onFinish()
    } catch (error) {
      applyIpcError(error)
    } finally {
      setBusy(false)
    }
  }

  const handleBack = async (): Promise<void> => {
    await saveNow()
    if (previous) goToStep(previous.id as WizardStepId)
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 pb-24">
      <PageHeader title={title} description={description} action={<SaveIndicator />} />

      <ol className="flex items-center gap-2">
        {WIZARD_STEPS.map((step, position) => {
          const done = position < index
          const active = position === index
          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                type="button"
                // Earlier steps are reachable; later ones are not, so the
                // stepper cannot be used to skip validation.
                disabled={position > index}
                onClick={() => void (position < index && handleJump(step.id as WizardStepId))}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active && 'bg-primary text-primary-foreground',
                  done && 'text-primary hover:bg-gray-100',
                  !active && !done && 'text-gray-400'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border text-xs',
                    active && 'border-primary-foreground',
                    done && 'border-primary bg-primary text-primary-foreground'
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : position + 1}
                </span>
                {step.label}
              </button>
              {position < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-gray-300" />
              )}
            </li>
          )
        })}
      </ol>

      {problems.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <p className="font-medium text-destructive">
            Fix the following before continuing:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-destructive">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {children}

      <div className="fixed bottom-0 right-0 left-0 border-t bg-white/95 backdrop-blur px-6 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {lastSavedAt && saveState !== 'saving' && (
              <>Draft saved at {lastSavedAt.toLocaleTimeString()}</>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!previous || busy}
              onClick={() => void handleBack()}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {next ? (
              <Button type="button" disabled={busy} onClick={() => void handleNext()}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => void handleFinish()}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {finishLabel ?? 'Finish'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  async function handleJump(target: WizardStepId): Promise<void> {
    await saveNow()
    goToStep(target)
  }
}

const SaveIndicator = (): JSX.Element | null => {
  const { saveState } = useWizard()

  if (saveState === 'saving') {
    return (
      <span className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving draft…
      </span>
    )
  }
  if (saveState === 'saved') {
    return (
      <span className="flex items-center gap-2 text-xs text-gray-500">
        <Cloud className="h-3 w-3" />
        Draft saved
      </span>
    )
  }
  if (saveState === 'error') {
    return (
      <span className="flex items-center gap-2 text-xs text-destructive">
        <CloudOff className="h-3 w-3" />
        Draft not saved
      </span>
    )
  }
  return null
}
