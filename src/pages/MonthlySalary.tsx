import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './MonthlySalary.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type MonthlySalaryPlan = {
  id: number
  title: string
  imageUrl: string
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

type ClaimResponse = {
  ok?: boolean
  message?: string
  error?: string
  contract?: string
  requirements?: {
    requiredLevel1Deposited: number
    requiredLevel2Deposited: number
    requiredLevel3Deposited: number
  }
  current?: {
    level1Deposited: number
    level2Deposited: number
    level3Deposited: number
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MonthlySalary() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<MonthlySalaryPlan[]>([])
  const [error, setError] = useState('')
  const [claimLoadingPlanId, setClaimLoadingPlanId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const handleClaim = async (planId: number) => {
    if (!user?.id || claimLoadingPlanId) return

    setClaimLoadingPlanId(planId)
    setError('')
    setSuccessMessage('')

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/monthly-salary-plans/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user.id,
          planId,
        }),
      })

      const data = (await res.json()) as ClaimResponse

      if (!res.ok || !data?.ok) {
        if (data?.requirements && data?.current) {
          setError(
            `Requisitos nao atendidos. Nivel 1: ${data.current.level1Deposited}/${data.requirements.requiredLevel1Deposited}, ` +
              `Nivel 2: ${data.current.level2Deposited}/${data.requirements.requiredLevel2Deposited}, ` +
              `Nivel 3: ${data.current.level3Deposited}/${data.requirements.requiredLevel3Deposited}.`
          )
        } else {
          setError(data?.error ?? 'Nao foi possivel obter o contrato.')
        }
        return
      }

      setSuccessMessage(data?.message ?? `Contrato obtido: ${data?.contract ?? 'Start V1'}`)
    } catch {
      setError('Erro de conexao ao obter contrato.')
    } finally {
      setClaimLoadingPlanId(null)
    }
  }

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
          setError(data?.error ?? 'Erro ao carregar planos de salario mensal.')
          setPlans([])
          return
        }

        setPlans(Array.isArray(data.plans) ? data.plans : [])
      } catch {
        setError('Erro de conexao ao carregar planos de salario mensal.')
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [navigate, user?.id])

  const hasRequirements = (plan: MonthlySalaryPlan) =>
    plan.requiredLevel1Deposited > 0 ||
    plan.requiredLevel2Deposited > 0 ||
    plan.requiredLevel3Deposited > 0

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Header banner ── */}
          <section className="ms-banner">
            <div className="ms-banner__bg" aria-hidden="true">
              <span className="ms-banner__glow ms-banner__glow--1" />
              <span className="ms-banner__glow ms-banner__glow--2" />
            </div>
            <div className="ms-banner__content">
              <button type="button" className="ms-banner__back" onClick={() => navigate('/dashboard')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Voltar
              </button>
              <h2 className="ms-banner__title">Salario Mensal</h2>
              <p className="ms-banner__desc">
                Convide amigos, atinja as metas de cada nivel e garanta um salario mensal fixo como colaborador da plataforma.
              </p>
            </div>
          </section>

          {/* ── Modal de feedback ── */}
          {(error || successMessage) ? (
            <div className="ms-modal-overlay" onClick={() => { setError(''); setSuccessMessage('') }}>
              <div className={`ms-modal ${error ? 'ms-modal--error' : 'ms-modal--success'}`} onClick={(e) => e.stopPropagation()}>
                <div className="ms-modal__icon">
                  {error ? (
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  )}
                </div>
                <h3 className="ms-modal__title">{error ? 'Erro' : 'Sucesso'}</h3>
                <p className="ms-modal__message">{error || successMessage}</p>
                <button
                  type="button"
                  className="ms-modal__btn"
                  onClick={() => { setError(''); setSuccessMessage('') }}
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Plans grid ── */}
          {loading ? (
            <div className="ms-empty-card">Carregando planos...</div>
          ) : plans.length === 0 ? (
            <div className="ms-empty-card">Nenhum plano de salario mensal disponivel no momento.</div>
          ) : (
            <div className="ms-grid">
              {plans.map((plan) => (
                <article key={plan.id} className="ms-card">
                  {/* Image */}
                  <div className="ms-card__img-wrap">
                    {plan.imageUrl ? (
                      <img
                        src={plan.imageUrl}
                        alt={plan.title}
                        className="ms-card__img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="ms-card__img-placeholder">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                    )}
                    <span className="ms-card__tag">{plan.title}</span>
                    <span className="ms-card__salary-badge">
                      {formatBRL(plan.monthlySalary)}<small>/mes</small>
                    </span>
                  </div>

                  {/* Body */}
                  <div className="ms-card__body">
                    <div className="ms-card__price">
                      <small>salario mensal</small>
                      <strong>{formatBRL(plan.monthlySalary)}</strong>
                    </div>

                    {/* Info rows */}
                    <div className="ms-card__info">
                      <div className="ms-card__info-row">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        <span>Renda mensal: <strong>{formatBRL(plan.monthlySalary)}</strong></span>
                      </div>
                      <div className="ms-card__info-row">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span>Renda diaria: <strong>{formatBRL(Number((plan.monthlySalary / 30).toFixed(2)))}</strong></span>
                      </div>
                      <div className="ms-card__info-row ms-card__info-row--highlight">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        <span>Renda anual: <strong>{formatBRL(plan.monthlySalary * 12)}</strong></span>
                      </div>
                    </div>

                    {/* Requirements */}
                    {hasRequirements(plan) && (
                      <div className="ms-requirements">
                        <div className="ms-requirements__title">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                          Requisitos de convidados depositados
                        </div>
                        <div className="ms-requirements__list">
                          {plan.requiredLevel1Deposited > 0 && (
                            <div className="ms-requirements__item">
                              <span className="ms-requirements__label">Nivel 1</span>
                              <strong>{plan.requiredLevel1Deposited}</strong>
                              <span className="ms-requirements__sub">depositados</span>
                            </div>
                          )}
                          {plan.requiredLevel2Deposited > 0 && (
                            <div className="ms-requirements__item">
                              <span className="ms-requirements__label">Nivel 2</span>
                              <strong>{plan.requiredLevel2Deposited}</strong>
                              <span className="ms-requirements__sub">depositados</span>
                            </div>
                          )}
                          {plan.requiredLevel3Deposited > 0 && (
                            <div className="ms-requirements__item">
                              <span className="ms-requirements__label">Nivel 3</span>
                              <strong>{plan.requiredLevel3Deposited}</strong>
                              <span className="ms-requirements__sub">depositados</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <button
                      type="button"
                      className="ms-btn"
                      onClick={() => handleClaim(plan.id)}
                      disabled={claimLoadingPlanId === plan.id}
                    >
                      {claimLoadingPlanId === plan.id ? 'Obtendo...' : 'Obter Contrato'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
