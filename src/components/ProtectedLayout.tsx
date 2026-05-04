import { Outlet } from 'react-router-dom'
import RequireAuth from './RequireAuth'

export default function ProtectedLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  )
}
