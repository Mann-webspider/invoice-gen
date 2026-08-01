import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import type { MasterEntity, MasterInputMap, MasterRecordMap } from '@shared/contracts'
import { ipc } from '@/lib/ipc'
import { toastSuccess } from '@/lib/form'

/**
 * One hook for every master list, over the single `master:*` channel set.
 * Each mutation invalidates only its own entity, so editing suppliers does not
 * refetch exporters.
 */

type Api<E extends MasterEntity> = {
  list: (category?: string) => Promise<MasterRecordMap[E][]>
  create: (data: MasterInputMap[E]) => Promise<MasterRecordMap[E]>
  update: (id: string, data: MasterInputMap[E]) => Promise<MasterRecordMap[E]>
  remove: (id: string) => Promise<null>
  reorder: (ids: string[]) => Promise<null>
}

const apiFor = <E extends MasterEntity>(entity: E): Api<E> =>
  ipc[entity] as unknown as Api<E>

export const masterKey = (entity: MasterEntity, category?: string): unknown[] =>
  category ? ['master', entity, category] : ['master', entity]

export const useMasterList = <E extends MasterEntity>(
  entity: E,
  category?: string
): UseQueryResult<MasterRecordMap[E][]> =>
  useQuery({
    queryKey: masterKey(entity, category),
    queryFn: () => apiFor(entity).list(category)
  })

interface MasterMutations<E extends MasterEntity> {
  create: (data: MasterInputMap[E]) => Promise<MasterRecordMap[E]>
  update: (id: string, data: MasterInputMap[E]) => Promise<MasterRecordMap[E]>
  remove: (id: string) => Promise<null>
  reorder: (ids: string[]) => Promise<null>
  isPending: boolean
}

export const useMasterMutations = <E extends MasterEntity>(
  entity: E,
  labels: { created: string; updated: string; removed: string }
): MasterMutations<E> => {
  const queryClient = useQueryClient()
  const api = apiFor(entity)

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['master', entity] })
  }

  const create = useMutation({
    mutationFn: (data: MasterInputMap[E]) => api.create(data),
    onSuccess: () => {
      invalidate()
      toastSuccess(labels.created)
    }
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MasterInputMap[E] }) => api.update(id, data),
    onSuccess: () => {
      invalidate()
      toastSuccess(labels.updated)
    }
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => {
      invalidate()
      toastSuccess(labels.removed)
    }
  })

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.reorder(ids),
    onSuccess: invalidate
  })

  return {
    create: (data) => create.mutateAsync(data),
    update: (id, data) => update.mutateAsync({ id, data }),
    remove: (id) => remove.mutateAsync(id),
    reorder: (ids) => reorder.mutateAsync(ids),
    isPending:
      create.isPending || update.isPending || remove.isPending || reorder.isPending
  }
}
