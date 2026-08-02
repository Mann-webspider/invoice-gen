import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Loader2,
  Save
} from 'lucide-react'
import type { ZodTypeAny } from 'zod'

import { WIZARD_STEPS, type WizardStepId } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWizard } from '@/context/WizardContext'
import { applyIpcError } from '@/lib/form'

/**
 * Chrome shared by all four steps: the progress bar, the save state, the list of
 * what is still missing, and the controls at the bottom.
 */

/** What each step is for, in words rather than document names. */
const STEP_HELP: Record<WizardStepId, string> = {
  invoice: 'Seller, buyer, shipment and goods',
  'packaging-list': 'Containers and weights',
  annexure: 'Customs declaration',
  'vgm-form': 'Container weights for the shipping line'
}

interface Problem {
  path: string
  message: string
}

/**
 * Brings the offending field into view and focuses it.
 *
 * Errors on a table row — a missing container number on row 2 — have no message
 * slot of their own, so the search walks up the path until it finds something
 * rendered: the cell, then the row, then the section.
 */
const focusField = (path: string): void => {
  const segments = path.split('.')
  for (let length = segments.length; length > 0; length--) {
    const selector = `[data-field="${segments.slice(0, length).join('.')}"]`
    const element = document.querySelector<HTMLElement>(selector)
    if (!element) continue
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.querySelector<HTMLElement>('input, textarea, [role="combobox"], button')?.focus()
    return
  }
}

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
  const { form, currentStep, goToStep, saveNow, ready } = useWizard()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])

  const index = WIZARD_STEPS.findIndex((step) => step.id === currentStep)
  const previous = index > 0 ? WIZARD_STEPS[index - 1] : null
  const next = index < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[index + 1] : null
  const invoiceNumber = form.watch('invoice.invoice_number')

  /** Runs this step's schema and collects every message with its path. */
  const validate = (): boolean => {
    setProblems([])
    const result = schema.safeParse(form.getValues())
    if (result.success) return true

    const found: Problem[] = []
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      form.setError(path as never, { message: issue.message })
      const row = issue.path.find((segment) => typeof segment === 'number')
      found.push({
        path,
        message:
          row === undefined ? issue.message : `Row ${Number(row) + 1}: ${issue.message}`
      })
    }

    // Same message twice on two rows is worth showing twice; the same message on
    // the same path is not.
    const seen = new Set<string>()
    setProblems(
      found.filter((problem) => {
        const key = `${problem.path}|${problem.message}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    )
    focusField(found[0].path)
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

  /** Leaving is safe at any point — the draft is on disk before we navigate. */
  const handleSaveAndClose = async (): Promise<void> => {
    setBusy(true)
    try {
      await saveNow()
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-28">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {invoiceNumber && (
            <span className="rounded-full bg-secondary px-3 py-1 font-mono text-xs text-secondary-foreground">
              {invoiceNumber}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </header>

      <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {WIZARD_STEPS.map((step, position) => {
          const done = position < index
          const active = position === index
          return (
            <li key={step.id}>
              <button
                type="button"
                // Earlier steps are reachable; later ones are not, so the
                // stepper cannot be used to skip validation.
                disabled={position > index}
                onClick={() => void (done && handleJump(step.id as WizardStepId))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  active && 'border-primary bg-primary text-primary-foreground',
                  done && 'border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50',
                  !active && !done && 'border-dashed border-gray-200 bg-white opacity-60'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    active && 'border-primary-foreground/40 bg-primary-foreground/10',
                    done && 'border-primary bg-primary text-primary-foreground',
                    !active && !done && 'border-gray-300 text-gray-400'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : position + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{step.label}</span>
                  <span
                    className={cn(
                      'block truncate text-xs',
                      active ? 'text-primary-foreground/70' : 'text-gray-500'
                    )}
                  >
                    {STEP_HELP[step.id as WizardStepId]}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {problems.length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {problems.length === 1
              ? 'One thing still needs filling in'
              : `${problems.length} things still need filling in`}
          </p>
          <ul className="mt-2 space-y-1">
            {problems.map((problem) => (
              <li key={`${problem.path}|${problem.message}`}>
                <button
                  type="button"
                  className="text-left text-sm text-destructive underline-offset-2 hover:underline"
                  onClick={() => focusField(problem.path)}
                >
                  {problem.message}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-destructive/80">
            Click one to jump straight to it.
          </p>
        </div>
      )}

      {children}

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <SaveIndicator />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void handleSaveAndClose()}
            >
              <Save />
              Save and close
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!previous || busy}
              onClick={() => void handleBack()}
            >
              <ChevronLeft />
              Back
            </Button>

            {next ? (
              <Button type="button" disabled={busy} onClick={() => void handleNext()}>
                {busy && <Loader2 className="animate-spin" aria-hidden />}
                Next
                <ChevronRight />
              </Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => void handleFinish()}>
                {busy && <Loader2 className="animate-spin" aria-hidden />}
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

/**
 * The draft is saved continuously; this says so in words, because a client who
 * cannot see that will not believe it and will not dare close the window.
 */
const SaveIndicator = (): JSX.Element => {
  const { saveState, lastSavedAt } = useWizard()

  if (saveState === 'saving') {
    return (
      <span className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    )
  }
  if (saveState === 'error') {
    return (
      <span className="flex items-center gap-2 text-xs font-medium text-destructive">
        <CloudOff className="h-3.5 w-3.5" />
        Not saved — check the message above
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 text-xs text-gray-500">
      <Check className="h-3.5 w-3.5 text-green-600" />
      {lastSavedAt
        ? `Saved automatically at ${lastSavedAt.toLocaleTimeString()}`
        : 'Saved automatically as you type'}
    </span>
  )
}
