import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../utils/apiUrl'


export default function RoletaTestAutoSpin() {
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      try {
        const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
        if (!rawUser) {
          navigate('/roleta', { replace: true })
          return
        }

        const parsed = JSON.parse(rawUser) as { id?: number }
        const userId = Number(parsed?.id)

        if (!userId || Number.isNaN(userId)) {
          navigate('/roleta', { replace: true })
          return
        }

        await fetch(`${API_URL}/api/roleta/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
      } catch {
        // noop
      } finally {
        navigate('/roleta', { replace: true })
      }
    }

    run()
  }, [navigate])

  return null
}
