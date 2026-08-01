import { useEffect, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import type { DocumentProgress } from '@shared/contracts'

import { cn } from '@/lib/utils'

/**
 * Live document-generation progress.
 *
 * The web app showed the same panel, but its steps were faked on a timer while
 * the browser built the workbooks and uploaded them one by one. These events
 * come from the main process as each sheet is actually written.
 */
export const ProcessQueue = ({ jobId }: { jobId: string | null }): JSX.Element | null => {
  const [steps, setSteps] = useState<DocumentProgress[]>([])

  useEffect(() => {
    if (!jobId) {
      setSteps([])
      return
    }
    return window.api.onDocumentProgress((progress) => {
      if (progress.jobId !== jobId) return
      setSteps((previous) => {
        const index = previous.findIndex((step) => step.step === progress.step)
        if (index === -1) return [...previous, progress]
        const next = [...previous]
        next[index] = progress
        return next
      })
    })
  }, [jobId])

  if (!jobId || steps.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 w-80 rounded-lg border bg-white shadow-lg">
      <div className="border-b px-4 py-2 text-sm font-medium">Generating documents</div>
      <ul className="max-h-64 overflow-y-auto p-2 space-y-1">
        {steps.map((step) => (
          <li key={step.step} className="flex items-center gap-2 px-2 py-1 text-sm">
            {step.status === 'completed' ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : step.status === 'failed' ? (
              <X className="h-4 w-4 text-destructive" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            <span className={cn('flex-1', step.status === 'failed' && 'text-destructive')}>
              {step.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
