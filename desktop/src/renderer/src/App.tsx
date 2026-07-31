import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { queryClient } from '@/lib/query-client'
import { AdminPanel } from '@/pages/admin/AdminPanel'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { NotFound } from '@/pages/NotFound'
import { Placeholder } from '@/pages/Placeholder'
import { Setup } from '@/pages/Setup'

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

                <Route
                  path="/invoice"
                  element={
                    <Placeholder
                      title="Invoice Generator"
                      description="Step 1 of 4 — exporter, buyer, shipping and products"
                      phase="phase 3"
                    />
                  }
                />
                <Route path="/invoice/drafts/:id" element={<Navigate to="/invoice" replace />} />

                <Route
                  path="/packaging-list"
                  element={
                    <Placeholder
                      title="Packaging List"
                      description="Step 2 of 4 — containers, marks and pallets"
                      phase="phase 3"
                    />
                  }
                />
                <Route
                  path="/packaging-list/drafts/:id"
                  element={<Navigate to="/packaging-list" replace />}
                />

                <Route
                  path="/annexure"
                  element={
                    <Placeholder
                      title="Annexure"
                      description="Step 3 of 4 — customs declaration"
                      phase="phase 3"
                    />
                  }
                />
                <Route path="/annexure/drafts/:id" element={<Navigate to="/annexure" replace />} />

                <Route
                  path="/vgm-form"
                  element={
                    <Placeholder
                      title="VGM Form"
                      description="Step 4 of 4 — verified gross mass, then generate documents"
                      phase="phase 3"
                    />
                  }
                />
                <Route path="/vgm-form/drafts/:id" element={<Navigate to="/vgm-form" replace />} />

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
