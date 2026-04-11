import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './MonthlySalary.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type MonthlySalaryPlan = {
  id: number
  title: string
  monthlySalary: number
  requiredLevel1Deposited: number
  requiredLevel2Deposited: number
  requiredLevel3Deposited: number
  isActive: boolean
  sortOrder: number
}

type MonthlySalaryResponse = {
  ok?: boolean
  plans?: MonthlySalaryPlan[]
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MonthlySalary() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<MonthlySalaryPlan[]>([])
  const [error, setError] = useState('')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadPlans = async () => {
      if (!user?.id) {
        navigate('/')
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/monthly-salary-plans`)
        const data = (await res.json()) as MonthlySalaryResponse

        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Erro ao carregar planos de salário mensal.')
          setPlans([])
          return
        }

        setPlans(Array.isArray(data.plans) ? data.plans : [])
      } catch {
        setError('Erro de conexão ao carregar planos de salário mensal.')
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [navigate, user?.id])

  return (
    <main className="monthly-salary-page">
      <AppSidebar />
      <header className="monthly-salary-header">
        <div>
          <p className="monthly-salary-kicker">Benefícios</p>
          <h1>Salário Mensal</h1>
          <span className="monthly-salary-subtitle">
            Planos configurados com metas de convidados depositados por nível
          </span>
        </div>
        <div className="monthly-salary-header-actions">
          <button className="btn ghost" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="monthly-salary-content">
        {loading ? (
          <div className="monthly-salary-empty">Carregando planos...</div>
        ) : error ? (
          <div className="monthly-salary-empty">{error}</div>
        ) : plans.length === 0 ? (
          <div className="monthly-salary-empty">Nenhum plano de salário mensal disponível.</div>
        ) : (
          <div className="monthly-salary-grid">
            {plans.map((plan) => (
              <article key={plan.id} className="monthly-salary-card">
                <header className="monthly-salary-card-header">
                  <h3>{plan.title}</h3>
                  <span>{formatBRL(plan.monthlySalary)}/mês</span>
                </header>

                <div className="monthly-salary-card-body">
                  <p>
                    <strong>Título:</strong> {plan.title}
                  </p>
                  <p>
                    <strong>Salário mensal:</strong> {formatBRL(plan.monthlySalary)}
                  </p>
                  <p>
                    <strong>Convidados depositados nível 1 que precisa:</strong>{' '}
                    {plan.requiredLevel1Deposited}
                  </p>
                  <p>
                    <strong>Convidados depositados nível 2 que precisa:</strong>{' '}
                    {plan.requiredLevel2Deposited}
                  </p>
                  <p>
                    <strong>Convidados depositados nível 3 que precisa:</strong>{' '}
                    {plan.requiredLevel3Deposited}
                  </p>
                </div>

                <div className="monthly-salary-card-actions">
                  <button
                    type="button"
                    className="monthly-salary-get-btn"
                    onClick={() => {
                      // Botão solicitado para aparecer na tela.
                    }}
                  >
                    Obter
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
