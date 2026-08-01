import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { WIZARD_STEPS, WizardData, type WizardStepId } from '@shared/contracts'
import { ipc } from '@/lib/ipc'
import { applyIpcError } from '@/lib/form'

/**
 * The wizard's single source of truth.
 *
 * One react-hook-form instance spans all four steps, and the only place its
 * values are persisted is the draft row. The web app instead kept a root RHF
 * instance in App.tsx that was prop-drilled into every page, a FormContext
 * beside it, the drafts API, and 142 localStorage writes — which is how the
 * same container ended up stored twice with different weights.
 */

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface WizardContextValue {
  form: UseFormReturn<WizardData>
  draftId: string | null
  /** False until an existing draft has been loaded into the form. */
  ready: boolean
  saveState: SaveState
  lastSavedAt: Date | null
  /** Force a save now, e.g. before navigating away. */
  saveNow: () => Promise<string | null>
  goToStep: (step: WizardStepId) => void
  currentStep: WizardStepId
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined)

const AUTOSAVE_DELAY_MS = 1200

export const WizardProvider = ({
  step,
  children
}: {
  step: WizardStepId
  children: ReactNode
}): JSX.Element => {
  const { id: draftIdFromUrl } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const form = useForm<WizardData>({
    // No resolver here: a draft is allowed to be incomplete. Each step validates
    // against its own schema before advancing.
    mode: 'onBlur',
    defaultValues: WizardData.parse({})
  })

  const [draftId, setDraftId] = useState<string | null>(draftIdFromUrl ?? null)
  const [ready, setReady] = useState(!draftIdFromUrl)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const draftIdRef = useRef<string | null>(draftIdFromUrl ?? null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Serialised form at the time of the last successful save. */
  const savedSnapshotRef = useRef<string>('')

  const { reset, getValues } = form

  // Load an existing draft once.
  useEffect(() => {
    if (!draftIdFromUrl) return
    let cancelled = false

    void (async () => {
      try {
        const draft = await ipc.draft.get(draftIdFromUrl)
        if (cancelled) return
        reset(draft.data)
        savedSnapshotRef.current = JSON.stringify(draft.data)
        draftIdRef.current = draft.id
        setDraftId(draft.id)
      } catch (error) {
        applyIpcError(error)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [draftIdFromUrl, reset])

  const persist = useCallback(async (): Promise<string | null> => {
    const values = getValues()
    const serialized = JSON.stringify(values)

    // Nothing changed since the last save — skip the write entirely.
    if (serialized === savedSnapshotRef.current) return draftIdRef.current

    setSaveState('saving')
    try {
      const record = await ipc.draft.save({
        id: draftIdRef.current ?? undefined,
        data: values,
        lastPage: step,
        invoiceNumber: values.invoice.invoice_number
      })
      savedSnapshotRef.current = serialized
      draftIdRef.current = record.id
      setDraftId(record.id)
      setSaveState('saved')
      setLastSavedAt(new Date())
      return record.id
    } catch (error) {
      setSaveState('error')
      applyIpcError(error)
      return null
    }
  }, [getValues, step])

  // Debounced autosave. Watching the whole form is fine here: the comparison
  // above means a no-op change costs one JSON.stringify, not a database write.
  useEffect(() => {
    if (!ready) return

    const subscription = form.watch(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void persist()
      }, AUTOSAVE_DELAY_MS)
    })

    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [form, persist, ready])

  // A pending debounce must not be lost when the window closes.
  useEffect(() => {
    const flush = (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        void persist()
      }
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [persist])

  const goToStep = useCallback(
    (target: WizardStepId) => {
      const definition = WIZARD_STEPS.find((entry) => entry.id === target)
      if (!definition) return
      const id = draftIdRef.current
      navigate(id ? `${definition.path}/drafts/${id}` : definition.path)
    },
    [navigate]
  )

  const value = useMemo<WizardContextValue>(
    () => ({
      form,
      draftId,
      ready,
      saveState,
      lastSavedAt,
      saveNow: persist,
      goToStep,
      currentStep: step
    }),
    [form, draftId, ready, saveState, lastSavedAt, persist, goToStep, step]
  )

  return (
    <WizardContext.Provider value={value}>
      <FormProvider {...form}>{children}</FormProvider>
    </WizardContext.Provider>
  )
}

export const useWizard = (): WizardContextValue => {
  const context = useContext(WizardContext)
  if (!context) throw new Error('useWizard must be used within a WizardProvider')
  return context
}
