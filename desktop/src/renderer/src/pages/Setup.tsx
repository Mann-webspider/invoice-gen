import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  UserPlus
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

import {
  CreateAdminInput,
  SetPasswordInput,
  type ImportSummary,
  type SessionUser
} from '@shared/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { ipc } from '@/lib/ipc'
import { applyIpcError } from '@/lib/form'
import { cn } from '@/lib/utils'

type Stage = 'data' | 'account' | 'pdf'

/**
 * First run.
 *
 * Three decisions, in the order they matter: bring the old system's data
 * across, decide who signs in, and confirm PDFs can be produced. The account
 * step also handles a database imported from the web app, whose users arrive
 * without passwords because the old table stored them in clear text.
 */
export const Setup = (): JSX.Element => {
  const navigate = useNavigate()
  const { needsSetup, session, refresh } = useAuth()
  const [stage, setStage] = useState<Stage>('data')
  const [imported, setImported] = useState<ImportSummary | null>(null)

  const setupState = useQuery({ queryKey: ['setup'], queryFn: ipc.setup.state })

  /**
   * Only bail out before the wizard has started. Creating the account clears
   * needsSetup, and redirecting on that would skip the PDF stage entirely — the
   * one screen that tells the client LibreOffice is missing and where their
   * data lives.
   */
  if (!needsSetup && stage === 'data') return <Navigate to="/" replace />

  const stages: { id: Stage; label: string; icon: typeof Database }[] = [
    { id: 'data', label: 'Data', icon: Database },
    { id: 'account', label: 'Account', icon: UserPlus },
    { id: 'pdf', label: 'PDF', icon: FileText }
  ]
  const currentIndex = stages.findIndex((entry) => entry.id === stage)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Set up Invoice Generator</h1>
          <p className="mt-1 text-sm text-gray-500">
            A few one-time questions before you start invoicing on this machine.
          </p>
        </div>

        <ol className="flex items-center gap-2">
          {stages.map((entry, index) => (
            <li key={entry.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm',
                  index === currentIndex && 'bg-primary text-primary-foreground',
                  index < currentIndex && 'text-primary',
                  index > currentIndex && 'text-gray-400'
                )}
              >
                {index < currentIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <entry.icon className="h-4 w-4" />
                )}
                {entry.label}
              </span>
              {index < stages.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
            </li>
          ))}
        </ol>

        <Card>
          <CardContent className="p-8">
            {stage === 'data' && (
              <DataStage
                imported={imported}
                onImported={setImported}
                onNext={() => setStage('account')}
              />
            )}

            {stage === 'account' && (
              <AccountStage
                pending={session?.pendingAccounts ?? []}
                onDone={async () => {
                  await refresh()
                  setStage('pdf')
                }}
              />
            )}

            {stage === 'pdf' && (
              <PdfStage
                libreOfficePath={setupState.data?.libreOfficePath ?? null}
                dataFolder={setupState.data?.dataFolder ?? ''}
                onFinish={() => navigate('/', { replace: true })}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const DataStage = ({
  imported,
  onImported,
  onNext
}: {
  imported: ImportSummary | null
  onImported: (summary: ImportSummary) => void
  onNext: () => void
}): JSX.Element => {
  const queryClient = useQueryClient()

  const runImport = useMutation({
    mutationFn: ipc.setup.importLegacy,
    onSuccess: (summary) => {
      if (!summary) return // The client closed the folder picker.
      onImported(summary)
      void queryClient.invalidateQueries()
    },
    onError: (error) => applyIpcError(error)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Bring across your existing data</h2>
        <p className="mt-1 text-sm text-gray-500">
          If you were using the web version, point at its <code>backend/database</code> folder.
          Invoices, exporters, suppliers, letterheads and generated documents are copied onto this
          machine. Nothing in the old folder is changed.
        </p>
      </div>

      {imported ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm space-y-2">
          <p className="font-medium text-green-900 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Import complete
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-green-900">
            <dt>Invoices</dt>
            <dd>{imported.invoices}</dd>
            <dt>Product lines</dt>
            <dd>{imported.products}</dd>
            <dt>Exporters</dt>
            <dd>{imported.exporters}</dd>
            <dt>Suppliers</dt>
            <dd>{imported.suppliers}</dd>
            <dt>Drafts</dt>
            <dd>{imported.drafts}</dd>
            <dt>Letterhead files</dt>
            <dd>{imported.assetsCopied}</dd>
            <dt>Documents</dt>
            <dd>{imported.documentsCopied}</dd>
          </dl>

          {imported.duplicateInvoices.length > 0 && (
            <p className="text-amber-900">
              Kept the newest copy of {imported.duplicateInvoices.join(', ')} — the old system had
              saved it more than once.
            </p>
          )}
          {imported.warnings.map((warning) => (
            <p key={warning} className="text-amber-900">
              {warning}
            </p>
          ))}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={runImport.isPending}
          onClick={() => runImport.mutate()}
        >
          {runImport.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Choose the old database folder
        </Button>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onNext}>
          Start with an empty system
        </Button>
        <Button type="button" onClick={onNext} disabled={runImport.isPending}>
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const AccountStage = ({
  pending,
  onDone
}: {
  pending: SessionUser[]
  onDone: () => Promise<void>
}): JSX.Element => {
  const [mode, setMode] = useState<'claim' | 'create'>(pending.length > 0 ? 'claim' : 'create')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Who signs in?</h2>
        <p className="mt-1 text-sm text-gray-500">
          {pending.length > 0
            ? 'Accounts came across from the old system, but their passwords could not — it stored them as plain text. Pick one and give it a password, or create a new administrator.'
            : 'Create the administrator account for this machine.'}
        </p>
      </div>

      {pending.length > 0 && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'claim' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('claim')}
          >
            Use an imported account
          </Button>
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('create')}
          >
            Create new administrator
          </Button>
        </div>
      )}

      {mode === 'claim' && pending.length > 0 ? (
        <ClaimAccountForm accounts={pending} onDone={onDone} />
      ) : (
        <CreateAdminForm onDone={onDone} />
      )}
    </div>
  )
}

const ClaimAccountForm = ({
  accounts,
  onDone
}: {
  accounts: SessionUser[]
  onDone: () => Promise<void>
}): JSX.Element => {
  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(SetPasswordInput),
    defaultValues: { userId: accounts[0]?.id ?? '', password: '', confirmPassword: '' }
  })

  const onSubmit = async (values: SetPasswordInput): Promise<void> => {
    try {
      await ipc.auth.setPassword(values)
      await onDone()
    } catch (error) {
      applyIpcError(error, form.setError)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} — {account.email} ({account.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <PasswordFields />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Set password and continue
        </Button>
      </form>
    </Form>
  )
}

const CreateAdminForm = ({ onDone }: { onDone: () => Promise<void> }): JSX.Element => {
  const form = useForm<CreateAdminInput>({
    resolver: zodResolver(CreateAdminInput),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  })

  const onSubmit = async (values: CreateAdminInput): Promise<void> => {
    try {
      await ipc.auth.createAdmin(values)
      await onDone()
    } catch (error) {
      applyIpcError(error, form.setError)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>Used only to sign in on this machine.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <PasswordFields />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Create administrator
        </Button>
      </form>
    </Form>
  )
}

/**
 * Shared between both account forms. Reads the form from context rather than
 * taking it as a prop, so it stays type-safe across two different form shapes.
 */
const PasswordFields = (): JSX.Element => (
  <>
    <FormField
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input type="password" autoComplete="new-password" {...field} />
          </FormControl>
          <FormDescription>At least 8 characters.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      name="confirmPassword"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Confirm password</FormLabel>
          <FormControl>
            <Input type="password" autoComplete="new-password" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
)

/* ------------------------------------------------------------------ */

const PdfStage = ({
  libreOfficePath,
  dataFolder,
  onFinish
}: {
  libreOfficePath: string | null
  dataFolder: string
  onFinish: () => void
}): JSX.Element => {
  const queryClient = useQueryClient()
  const recheck = useMutation({
    mutationFn: ipc.setup.recheckLibreOffice,
    onSuccess: (state) => queryClient.setQueryData(['setup'], state),
    onError: (error) => applyIpcError(error)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">PDF conversion</h2>
        <p className="mt-1 text-sm text-gray-500">
          Excel and Word documents are produced by this application. Turning them into PDFs uses
          LibreOffice, which is free and has to be installed separately.
        </p>
      </div>

      {libreOfficePath ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-900 flex items-center gap-2">
            <Check className="h-4 w-4" />
            LibreOffice found
          </p>
          <p className="mt-1 font-mono text-xs text-green-900 break-all">{libreOfficePath}</p>
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm space-y-3">
          <p className="font-medium text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            LibreOffice not found
          </p>
          <p className="text-amber-900">
            You can still create invoices and get Excel and Word files. PDFs will be skipped until
            LibreOffice is installed from libreoffice.org. Install it, then check again — no
            restart needed.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={recheck.isPending}
            onClick={() => recheck.mutate()}
          >
            {recheck.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check again
          </Button>
        </div>
      )}

      <div className="rounded-md bg-gray-50 p-4 text-sm">
        <p className="text-gray-600">Your data is stored in</p>
        <p className="mt-1 font-mono text-xs break-all selectable">{dataFolder}</p>
        <p className="mt-2 text-gray-600">
          Back it up from the Backup screen — this folder is lost with the machine.
        </p>
      </div>

      <Button type="button" className="w-full" onClick={onFinish}>
        Start using Invoice Generator
      </Button>
    </div>
  )
}
