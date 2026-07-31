import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { CreateAdminInput, SetPasswordInput, type SessionUser } from '@shared/contracts'
import { Button } from '@/components/ui/button'
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

/**
 * First run.
 *
 * Two paths, because a database imported from the web app arrives with accounts
 * that have no password — the legacy table stored passwords in clear text, so
 * none of them were carried over. The client either claims one of those
 * accounts or creates a fresh administrator.
 */
export const Setup = (): JSX.Element => {
  const navigate = useNavigate()
  const { needsSetup, session, refresh } = useAuth()
  const pending = session?.pendingAccounts ?? []
  const [mode, setMode] = useState<'claim' | 'create'>(pending.length > 0 ? 'claim' : 'create')

  if (!needsSetup) return <Navigate to="/" replace />

  const finish = async (): Promise<void> => {
    await refresh()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Set up Invoice Generator</h2>
          <p className="mt-2 text-sm text-gray-500">
            {pending.length > 0
              ? 'Accounts were imported from the previous system, but their passwords could not be carried over. Choose an account and set a password, or create a new administrator.'
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
          <ClaimAccountForm accounts={pending} onDone={finish} />
        ) : (
          <CreateAdminForm onDone={finish} />
        )}
      </div>
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
 * Shared between both setup forms — identical fields, identical validation.
 * Reads the form from context rather than taking it as a prop, so it stays
 * type-safe across two different form shapes.
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
