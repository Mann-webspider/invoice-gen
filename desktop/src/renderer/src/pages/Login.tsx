import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { LoginInput } from '@shared/contracts'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { applyIpcError } from '@/lib/form'

export const Login = (): JSX.Element => {
  const navigate = useNavigate()
  const { login, isAuthenticated, needsSetup } = useAuth()

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginInput),
    defaultValues: { email: '', password: '' }
  })

  if (needsSetup) return <Navigate to="/setup" replace />
  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = async (values: LoginInput): Promise<void> => {
    try {
      await login(values)
      navigate('/', { replace: true })
    } catch (error) {
      applyIpcError(error, form.setError)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Generator</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="username"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Sign in
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
