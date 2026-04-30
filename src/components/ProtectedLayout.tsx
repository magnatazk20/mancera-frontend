import { Outlet, ReactNode } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import Layout from './Layout'

interface ProtectedLayoutProps {
  children?: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <RequireAuth>
      <Layout>
        <Outlet />
        {children}
      </Layout>
    </RequireAuth>
  )
}
