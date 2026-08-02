import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Check, Loader2 } from 'lucide-react'

import { ArnInput } from '@shared/contracts'
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
import { Textarea } from '@/components/ui/textarea'
import { SectionHeader } from '@/components/admin/SectionHeader'
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
    created: 'Tax declaration saved',
    updated: 'Tax declaration saved',
    removed: 'Tax declaration removed'
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
      <div className="flex justify-center p-10">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tax declaration"
        description="Wording that is the same on every invoice. It is filled in for you when a new invoice is started, and can still be changed on that invoice if a particular shipment needs different text."
      />

      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="arn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ARN</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AD2403250765509" {...field} />
                    </FormControl>
                    <FormDescription>
                      The application reference number of your Letter of Undertaking. Printed on the
                      packing list.
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
                    <FormDescription>
                      Printed word for word on the invoice, so type it exactly as it should appear.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                  Save
                </Button>
                {form.formState.isSubmitSuccessful && !form.formState.isDirty && (
                  <span className="flex items-center gap-1.5 text-sm text-green-700">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
