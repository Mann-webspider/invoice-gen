import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

import { ArnInput } from '@shared/contracts'
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
import { Textarea } from '@/components/ui/textarea'
import { useMasterList, useMasterMutations } from '@/hooks/useMaster'
import { applyIpcError } from '@/lib/form'

/**
 * ARN and the GST declaration. Effectively a single record — the legacy table
 * held exactly one row — so this is a plain form rather than a list, and saving
 * updates the existing row when there is one.
 */
export const ArnSection = (): JSX.Element => {
  const { data: records = [], isPending } = useMasterList('arn')
  const existing = records[0]

  const mutations = useMasterMutations('arn', {
    created: 'ARN declaration saved',
    updated: 'ARN declaration saved',
    removed: 'ARN declaration removed'
  })

  const form = useForm<ArnInput>({
    resolver: zodResolver(ArnInput),
    defaultValues: { arn: '', gstCircular: '' }
  })

  const { reset } = form
  useEffect(() => {
    if (existing) reset({ arn: existing.arn, gstCircular: existing.gstCircular })
  }, [existing, reset])

  const onSubmit = async (values: ArnInput): Promise<void> => {
    try {
      if (existing) await mutations.update(existing.id, values)
      else await mutations.create(values)
    } catch (error) {
      applyIpcError(error, form.setError)
    }
  }

  if (isPending) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">ARN &amp; Declaration</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="arn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application reference number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AD2403250765509" {...field} />
                  </FormControl>
                  <FormDescription>
                    Printed on the packing list as the LUT application reference.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gstCircular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST circular</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="e.g. EXPORT UNDER GST CIRCULAR NO. 26/2017 Customs DT.01/07/2017"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Save
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
