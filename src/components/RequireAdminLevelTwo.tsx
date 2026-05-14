import { Navigate, useLocation } from 'react-router-dom'

type RequireAdminLevelTwoProps = {
  children: React.ReactNode
}

type StoredUser = {
  is_admin?: number | string
  isAdmin?: number | string | boolean
}

export default function RequireAdminLevelTwo({ children }: RequireAdminLevelTwoProps) {
  const location = useLocation()

  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
  const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')

  if (!token || !rawUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  try {
    const user = JSON.parse(rawUser) as StoredUser

    const normalizeToNumber = (value: unknown) => {
      if (typeof value === 'boolean') return value ? 1 : 0
      const asNumber = Number(value)
      return Number.isFinite(asNumber) ? asNumber : 0
    }

    const fromSnake = normalizeToNumber(user.is_admin)
    const fromCamel = normalizeToNumber(user.isAdmin)
    const adminLevel = Math.max(fromSnake, fromCamel)

    // /athorng pode ser acessado por nível 2 e também pelo dono (nível 1)
    if (adminLevel === 1 || adminLevel === 2) {
      return children
    }

    return <Navigate to="/dashboard" replace />
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
}
