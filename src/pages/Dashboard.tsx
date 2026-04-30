import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    if (!token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div className="page dashboard-page">
      <AppSidebar />
      <main className="dashboard-main">
        <h1>Dashboard</h1>
        <p>Frontend e backend conectados com sucesso.</p>
      </main>
    </div>
  )
}
