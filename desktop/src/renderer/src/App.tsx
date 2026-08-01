import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Outlet, Route, Routes } from 'react-router-dom'

import type { WizardStepId } from '@shared/contracts'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { WizardProvider } from '@/context/WizardContext'
import { queryClient } from '@/lib/query-client'
import { AdminPanel } from '@/pages/admin/AdminPanel'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { NotFound } from '@/pages/NotFound'
import { Placeholder } from '@/pages/Placeholder'
import { Setup } from '@/pages/Setup'
import { AnnexureStep } from '@/pages/wizard/AnnexureStep'
import { InvoiceStep } from '@/pages/wizard/InvoiceStep'
import { PackagingStep } from '@/pages/wizard/PackagingStep'
import { VgmStep } from '@/pages/wizard/VgmStep'

/**
 * Each wizard step is reachable both fresh and with a draft id. The web app
 * declared these as eight separate <Route> blocks with the page duplicated in
 * each; here one table drives both forms of the path.
 */
const WIZARD_ROUTES: { path: string; step: WizardStepId; Component: () => JSX.Element }[] = [
  { path: '/invoice', step: 'invoice', Component: InvoiceStep },
  { path: '/invoice/drafts/:id', step: 'invoice', Component: InvoiceStep },
  { path: '/packaging-list', step: 'packaging-list', Component: PackagingStep },
  { path: '/packaging-list/drafts/:id', step: 'packaging-list', Component: PackagingStep },
  { path: '/annexure', step: 'annexure', Component: AnnexureStep },
  { path: '/annexure/drafts/:id', step: 'annexure', Component: AnnexureStep },
  { path: '/vgm-form', step: 'vgm-form', Component: VgmStep },
  { path: '/vgm-form/drafts/:id', step: 'vgm-form', Component: VgmStep }
]

/**
 * HashRouter, not BrowserRouter: the packaged renderer is loaded over file://,
 * where path-based routing has no server to fall back on.
 *
 * Route paths match the web app so the client's habits carry over.
 */

/** Everything inside the signed-in shell. */
const Shell = ({ requireAdmin = false }: { requireAdmin?: boolean }): JSX.Element => (
  <ProtectedRoute requireAdmin={requireAdmin}>
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  </ProtectedRoute>
)

const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <HashRouter>
            <Toaster />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<Setup />} />

              <Route element={<Shell />}>
                <Route path="/" element={<Dashboard />} />

                {WIZARD_ROUTES.map(({ path, step, Component }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <WizardProvider step={step}>
                        <Component />
                      </WizardProvider>
                    }
                  />
                ))}

                <Route
                  path="/backup"
                  element={
                    <Placeholder
                      title="Backup & Restore"
                      description="Database backups stored on this machine"
                      phase="phase 5"
                    />
                  }
                />
              </Route>

              <Route element={<Shell requireAdmin />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
