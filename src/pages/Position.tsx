import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './Position.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PositionReportResponse = {
  ok?: boolean
  summary?: {
    teamSize?: number
    depositedMembers?: number
    teamRecharge?: number
    teamWithdraw?: number
  }
  levels?: Array<{
    level?: number
    totalMembers?: number
    depositedMembers?: number
    rechargedAmount?: number
  }>
}

type TeamMember = {
  id: number
  name: string
  phone: string
  level: number
  createdAt: string | null
  totalDeposits: number
  hasDeposit: boolean
  vipLevelName: string | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function Position() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [teamRecharge, setTeamRecharge] = useState(0)
  const [todayRecharge, setTodayRecharge] = useState(0)
  const [yesterdayRecharge, setYesterdayRecharge] = useState(0)
  const [monthRecharge, setMonthRecharge] = useState(0)
  const [lastMonthRecharge, setLastMonthRecharge] = useState(0)

  const [lv1Count, setLv1Count] = useState(0)
  const [lv2Count, setLv2Count] = useState(0)
  const [lv3Count, setLv3Count] = useState(0)

  const [activeMembers, setActiveMembers] = useState(0)
  const [inactiveMembers, setInactiveMembers] = useState(0)
  const [newToday, setNewToday] = useState(0)
  const [newYesterday, setNewYesterday] = useState(0)

  const [statusTab, setStatusTab] = useState<'active' | 'inactive'>('active')
  const [levelTab, setLevelTab] = useState<1 | 2 | 3>(1)

  const [members, setMembers] = useState<TeamMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

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
    if (!user?.id) {
      navigate('/')
      return
    }

    const load = async () => {
      try {
        const reportRes = await fetch(`${API_URL}/api/team/report/${user.id}`)

        if (reportRes.ok) {
          const report = (await reportRes.json()) as PositionReportResponse
          const levels = report.levels ?? []

          const l1 = levels.find((l) => Number(l.level ?? 0) === 1)
          const l2 = levels.find((l) => Number(l.level ?? 0) === 2)
          const l3 = levels.find((l) => Number(l.level ?? 0) === 3)

          const totalTeam =
            Number(l1?.totalMembers ?? 0) +
            Number(l2?.totalMembers ?? 0) +
            Number(l3?.totalMembers ?? 0)
          const totalDeposited =
            Number(l1?.depositedMembers ?? 0) +
            Number(l2?.depositedMembers ?? 0) +
            Number(l3?.depositedMembers ?? 0)
          const totalRecharge =
            Number(l1?.rechargedAmount ?? 0) +
            Number(l2?.rechargedAmount ?? 0) +
            Number(l3?.rechargedAmount ?? 0)

          setTeamRecharge(totalRecharge)
          setLv1Count(Number(l1?.totalMembers ?? 0))
          setLv2Count(Number(l2?.totalMembers ?? 0))
          setLv3Count(Number(l3?.totalMembers ?? 0))
          setActiveMembers(totalDeposited)
          setInactiveMembers(Math.max(totalTeam - totalDeposited, 0))

          // Recarga de hoje
          const today = new Date().toISOString().slice(0, 10)
          const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
          const firstOfMonth = today.slice(0, 8) + '01'
          const firstOfLastMonth = (() => {
            const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1)
            return d.toISOString().slice(0, 10)
          })()
          const lastOfLastMonth = (() => {
            const d = new Date(); d.setDate(0)
            return d.toISOString().slice(0, 10)
          })()

          const fetchRecharge = async (start: string, end: string): Promise<number> => {
            try {
              const r = await fetch(`${API_URL}/api/team/report/${user.id}?startDate=${start}&endDate=${end}`)
              if (!r.ok) return 0
              const d = (await r.json()) as PositionReportResponse
              const lvls = d.levels ?? []
              return lvls.reduce((sum, l) => sum + Number(l.rechargedAmount ?? 0), 0)
            } catch { return 0 }
          }

          const fetchNewMembers = async (start: string, end: string): Promise<number> => {
            try {
              const r = await fetch(`${API_URL}/api/team/report/${user.id}?startDate=${start}&endDate=${end}`)
              if (!r.ok) return 0
              const d = (await r.json()) as PositionReportResponse
              const lvls = d.levels ?? []
              return lvls.reduce((sum, l) => sum + Number(l.totalMembers ?? 0), 0)
            } catch { return 0 }
          }

          const [todayR, yesterdayR, monthR, lastMonthR, todayNew, yesterdayNew] = await Promise.all([
            fetchRecharge(today, today),
            fetchRecharge(yesterdayDate, yesterdayDate),
            fetchRecharge(firstOfMonth, today),
            fetchRecharge(firstOfLastMonth, lastOfLastMonth),
            fetchNewMembers(today, today),
            fetchNewMembers(yesterdayDate, yesterdayDate),
          ])

          setTodayRecharge(todayR)
          setYesterdayRecharge(yesterdayR)
          setMonthRecharge(monthR)
          setLastMonthRecharge(lastMonthR)
          setNewToday(todayNew)
          setNewYesterday(yesterdayNew)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate, user?.id])

  useEffect(() => {
    if (!user?.id) return
    setMembersLoading(true)
    fetch(`${API_URL}/api/team/members/${user.id}?level=${levelTab}`)
      .then((r) => r.ok ? r.json() : { members: [] })
      .then((d: { members?: TeamMember[] }) => setMembers(Array.isArray(d.members) ? d.members : []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false))
  }, [user?.id, levelTab])

  const filteredMembers = members.filter((m) =>
    statusTab === 'active' ? m.hasDeposit : !m.hasDeposit
  )

  return (
    <main className="dash-app position-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <div className="pos-mobile-wrap">
            <header className="pos-topbar">
              <button type="button" className="pos-topbar-back" onClick={() => navigate('/dashboard')} aria-label="Voltar">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="pos-topbar-title">Equipe</h1>
              <div />
            </header>

            <section className="pos-card pos-main-summary">
              <div className="pos-main-icon">
                <img src="/moeda.png" alt="Moeda" />
              </div>
              <p className="pos-main-total">R$ {Number(teamRecharge ?? 0).toFixed(0)}</p>
              <p className="pos-main-label">Recarga Total da Equipe</p>

              <div className="pos-main-grid">
                <div className="pos-kv">
                  <label>Recarga de Hoje</label>
                  <strong>R$ {Number(todayRecharge).toFixed(2)}</strong>
                </div>
                <div className="pos-kv" style={{ textAlign: 'right' }}>
                  <label>Recarga de Ontem</label>
                  <strong>R$ {Number(yesterdayRecharge).toFixed(2)}</strong>
                </div>
                <div className="pos-kv">
                  <label>Recarga deste Mês</label>
                  <strong>R$ {Number(monthRecharge).toFixed(2)}</strong>
                </div>
                <div className="pos-kv" style={{ textAlign: 'right' }}>
                  <label>Recarga do Mês Passado</label>
                  <strong>R$ {Number(lastMonthRecharge).toFixed(2)}</strong>
                </div>
              </div>
            </section>

            <section className="pos-card">
              <div className="pos-lv-grid">
                <div className="pos-lv-item">
                  <span className="lv-label">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ marginRight: 6, verticalAlign: 'text-bottom' }}>
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    LV1
                  </span>
                  <span className="lv-val">{lv1Count}</span>
                </div>
                <div className="pos-lv-item">
                  <span className="lv-label">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ marginRight: 6, verticalAlign: 'text-bottom' }}>
                      <path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19l1-5.8-4.2-4.1 5.8-.8L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                    LV2
                  </span>
                  <span className="lv-val">{lv2Count}</span>
                </div>
                <div className="pos-lv-item">
                  <span className="lv-label">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ marginRight: 6, verticalAlign: 'text-bottom' }}>
                      <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    LV3
                  </span>
                  <span className="lv-val">{lv3Count}</span>
                </div>
              </div>
            </section>

            <section className="pos-card">
              <h2 className="pos-card-title">Minha Equipe</h2>
              <div className="pos-team-grid">
                <div className="pos-team-item">
                  <strong>{activeMembers}</strong>
                  <span>Membros ativos</span>
                </div>
                <div className="pos-team-item">
                  <strong>{inactiveMembers}</strong>
                  <span>Membros não adicionados</span>
                </div>
                <div className="pos-team-item">
                  <strong>{newToday}</strong>
                  <span>Novos Membros de Hoje</span>
                </div>
                <div className="pos-team-item">
                  <strong>{newYesterday}</strong>
                  <span>Novos Membros de Ontem</span>
                </div>
              </div>
            </section>

            <section className="pos-card">
              <div className="pos-status-tabs">
                <button
                  type="button"
                  className={`pos-status-tab ${statusTab === 'active' ? 'active' : ''}`}
                  onClick={() => setStatusTab('active')}
                >
                  Membros ativos
                </button>
                <button
                  type="button"
                  className={`pos-status-tab ${statusTab === 'inactive' ? 'active' : ''}`}
                  onClick={() => setStatusTab('inactive')}
                >
                  Membro inativo
                </button>
              </div>

              <div className="pos-level-filters">
                <button type="button" className={`pos-level-btn ${levelTab === 1 ? 'active' : ''}`} onClick={() => setLevelTab(1)}>
                  L1-10% ({lv1Count})
                </button>
                <button type="button" className={`pos-level-btn ${levelTab === 2 ? 'active' : ''}`} onClick={() => setLevelTab(2)}>
                  L2-5% ({lv2Count})
                </button>
                <button type="button" className={`pos-level-btn ${levelTab === 3 ? 'active' : ''}`} onClick={() => setLevelTab(3)}>
                  L3-2% ({lv3Count})
                </button>
              </div>

              <div className="pos-card pos-table-card">
                <div className="pos-table-head">
                  <span>Conta</span>
                  <span>Telefone</span>
                  <span>{statusTab === 'active' ? 'Total Depositado' : 'Cadastrado em'}</span>
                </div>

                <div className="pos-table-body">
                  {membersLoading ? (
                    <div className="pos-empty">Carregando...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="pos-empty">No Data</div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div className="pos-table-row" key={member.id}>
                        <span>{member.name}</span>
                        <span>{member.phone}</span>
                        <span>
                          {statusTab === 'active'
                            ? `R$ ${Number(member.totalDeposits).toFixed(2)}`
                            : member.createdAt
                              ? new Date(member.createdAt).toLocaleDateString('pt-BR')
                              : '-'
                          }
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
