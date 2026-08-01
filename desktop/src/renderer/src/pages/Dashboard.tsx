import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ipc } from '@/lib/ipc'

/**
 * Phase 0 stub. Exercises the full renderer -> preload -> main -> Result
 * round-trip so the transport is proven before any domain code depends on it.
 * Replaced by the real dashboard in phase 5.
 */
export const Dashboard = (): JSX.Element => {
  const { data, isPending, error } = useQuery({
    queryKey: ['app', 'info'],
    queryFn: ipc.app.info
  })

  return (
    <div className="container mx-auto">
      <PageHeader title="Dashboard" description="Invoice system overview" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {isPending && <p className="text-gray-500">Loading…</p>}
          {error && <p className="text-destructive">{error.message}</p>}
          {data && (
            <dl className="grid grid-cols-[10rem_1fr] gap-y-2">
              <dt className="text-gray-500">Version</dt>
              <dd>{data.version}</dd>
              <dt className="text-gray-500">Electron</dt>
              <dd>{data.electron}</dd>
              <dt className="text-gray-500">Platform</dt>
              <dd>{data.platform}</dd>
              <dt className="text-gray-500">Data folder</dt>
              <dd className="selectable break-all font-mono text-xs">{data.userDataPath}</dd>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
