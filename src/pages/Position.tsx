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
  createdAt?: string
  totalDeposits: number
  hasDeposit: boolean
  vipLevelName?: string | null
  vipPrice?: number | null
  vipStartedAt?: string | null
  vipExpiresAt?: string | null
}

type TeamMembersResponse = {
  ok?: boolean
  level?: number
  total?: number
  members?: TeamMember[]
}

type VipMember = {
  id: number
  name: string
  phone: string
  level: number
  createdAt?: string
  vipLevelName: string
  vipPrice: number
  vipStartedAt?: string | null
  vipExpiresAt?: string | null
  commissionPercent: number
  commissionEarned: number
}

type VipMembersResponse = {
  ok?: boolean
  total?: number
  commissionLevels?: Record<number, number>
  members?: VipMember[]
}

type TaskCommissionMember = {
  memberId: number
  memberName: string
  memberPhone: string
  level: number
  commissionPercent: number
  taskCount: number
  totalBaseAmount: number
  totalCommission: number
  lastCommissionAt?: string | null
}

type TaskCommissionSummary = {
  level: number
  totalPayouts: number
  totalCommission: number
  commissionPercent: number
}

type TaskCommissionsResponse = {
  ok?: boolean
  grandTotal?: number
  summary?: TaskCommissionSummary[]
  members?: TaskCommissionMember[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Position() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [activeView, setActiveView] = useState<'menu' | 'reports' | 'team' | 'description'>('menu')
  const [activeTab, setActiveTab] = useState<'reports' | 'team'>('reports')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [teamLevel, setTeamLevel] = useState<1 | 2 | 3>(1)
  const [_teamSize, setTeamSize] = useState(0)
  const [_depositedMembers, setDepositedMembers] = useState(0)
  const [_teamRecharge, setTeamRecharge] = useState(0)
  const [_teamWithdraw, setTeamWithdraw] = useState(0)
  const [_levels, setLevels] = useState<Array<{ level: number; totalMembers: number; depositedMembers: number; rechargedAmount: number }>>([
    { level: 1, totalMembers: 0, depositedMembers: 0, rechargedAmount: 0 },
    { level: 2, totalMembers: 0, depositedMembers: 0, rechargedAmount: 0 },
    { level: 3, totalMembers: 0, depositedMembers: 0, rechargedAmount: 0 },
  ])
  const [_teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [vipMembers, setVipMembers] = useState<VipMember[]>([])
  const [taskCommissionMembers, setTaskCommissionMembers] = useState<TaskCommissionMember[]>([])
  const [taskCommissionSummary, setTaskCommissionSummary] = useState<TaskCommissionSummary[]>([])
  const [taskCommissionGrandTotal, setTaskCommissionGrandTotal] = useState(0)
  const [showDescModal, setShowDescModal] = useState(false)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const loadReport = async (params?: { startDate?: string; endDate?: string }) => {
    if (!user?.id) return
    setFetching(true)
    try {
      const query = new URLSearchParams()
      if (params?.startDate && params?.endDate) {
        query.set('startDate', params.startDate)
        query.set('endDate', params.endDate)
      }
      const qs = query.toString()
      const res = await fetch(`${API_URL}/api/team/report/${user.id}${qs ? `?${qs}` : ''}`)
      const data = (await res.json()) as PositionReportResponse & { error?: string }

      if (!res.ok || !data?.ok) {
        const msg = data?.error || 'Não foi possível carregar relatório.'
        setToast({ type: 'error', message: msg })
        setTimeout(() => setToast(null), 2200)
        return
      }

      setTeamSize(Number(data.summary?.teamSize ?? 0))
      setDepositedMembers(Number(data.summary?.depositedMembers ?? 0))
      setTeamRecharge(Number(data.summary?.teamRecharge ?? 0))
      setTeamWithdraw(Number(data.summary?.teamWithdraw ?? 0))

      const mapped = [1, 2, 3].map((lv) => {
        const found = data.levels?.find((r) => Number(r.level ?? 0) === lv)
        return {
          level: lv,
          totalMembers: Number(found?.totalMembers ?? 0),
          depositedMembers: Number(found?.depositedMembers ?? 0),
          rechargedAmount: Number(found?.rechargedAmount ?? 0),
        }
      })
      setLevels(mapped)
      // silencioso ao atualizar relatório
    } catch {
      const msg = 'Erro de conexão ao carregar relatório.'
      setToast({ type: 'error', message: msg })
      setTimeout(() => setToast(null), 2200)
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  const loadVipMembers = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`${API_URL}/api/team/vip-members/${user.id}`)
      const data = (await res.json()) as VipMembersResponse & { error?: string }
      if (!res.ok || !data?.ok) return
      setVipMembers(Array.isArray(data.members) ? data.members : [])
    } catch {
      // silencioso
    }
  }

  const loadTaskCommissions = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`${API_URL}/api/team/task-commissions/${user.id}`)
      const data = (await res.json()) as TaskCommissionsResponse & { error?: string }
      if (!res.ok || !data?.ok) return
      setTaskCommissionSummary(Array.isArray(data.summary) ? data.summary : [])
      setTaskCommissionMembers(Array.isArray(data.members) ? data.members : [])
      setTaskCommissionGrandTotal(Number(data.grandTotal ?? 0))
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }
    loadReport()
    loadVipMembers()
    loadTaskCommissions()
  }, [navigate, user?.id])

  const loadTeamMembers = async (params?: { startDate?: string; endDate?: string; level?: 1 | 2 | 3 }) => {
    if (!user?.id) return
    setFetching(true)
    try {
      const query = new URLSearchParams()
      const lv = params?.level ?? teamLevel
      query.set('level', String(lv))
      if (params?.startDate && params?.endDate) {
        query.set('startDate', params.startDate)
        query.set('endDate', params.endDate)
      }
      const res = await fetch(`${API_URL}/api/team/members/${user.id}?${query.toString()}`)
      const data = (await res.json()) as TeamMembersResponse & { error?: string }
      if (!res.ok || !data?.ok) {
        const msg = data?.error || 'Não foi possível carregar membros da equipe.'
        setToast({ type: 'error', message: msg })
        setTimeout(() => setToast(null), 2200)
        return
      }
      setTeamMembers(Array.isArray(data.members) ? data.members : [])
    } catch {
      const msg = 'Erro de conexão ao carregar membros da equipe.'
      setToast({ type: 'error', message: msg })
      setTimeout(() => setToast(null), 2200)
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  const onSearch = () => {
    if ((startDate && !endDate) || (!startDate && endDate)) {
      const msg = 'Selecione data inicial e final.'
      setToast({ type: 'error', message: msg })
      setTimeout(() => setToast(null), 2200)
      return
    }
    if (startDate && endDate && startDate > endDate) {
      const msg = 'Data inicial não pode ser maior que a final.'
      setToast({ type: 'error', message: msg })
      setTimeout(() => setToast(null), 2200)
      return
    }
    if (activeTab === 'reports') {
      loadReport({ startDate, endDate })
    } else {
      loadTeamMembers({ startDate, endDate, level: teamLevel })
    }
  }

  return (
    <main className="dash-app position-page">
      {toast ? (
        <div className={`pos-toast ${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}

      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Nav Bar ─────────────────────────────── */}
          <section className="pos-navbar">
            {activeView !== 'menu' ? (
              <button
                type="button"
                className="pos-navbar-back"
                onClick={() => setActiveView('menu')}
                aria-label="Voltar"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="pos-navbar-back"
                onClick={() => navigate('/invite')}
                aria-label="Voltar"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <h1 className="pos-navbar-title">Posições na empresa</h1>
          </section>

          {/* ── Menu Principal (3 botões) ──────────── */}
          {activeView === 'menu' ? (
            <section className="pos-action-cards">
              <button
                type="button"
                className="pos-action-card"
                onClick={() => {
                  setActiveView('reports')
                  setActiveTab('reports')
                  loadReport()
                  loadVipMembers()
                  loadTaskCommissions()
                }}
              >
                <div className="pos-action-card-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=280&fit=crop&q=80"
                    alt="Equipe de trabalho"
                    className="pos-action-card-img"
                  />
                </div>
                <div className="pos-action-card-btn">Informações sobre a minha Equipe</div>
              </button>

              <button
                type="button"
                className="pos-action-card"
                onClick={() => {
                  setActiveView('team')
                  setActiveTab('team')
                  loadTaskCommissions()
                }}
              >
                <div className="pos-action-card-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=280&fit=crop&q=80"
                    alt="Promoção e crescimento"
                    className="pos-action-card-img"
                  />
                </div>
                <div className="pos-action-card-btn">Informações sobre a minha Equipe de tarefas </div>
              </button>

              <button
                type="button"
                className="pos-action-card"
                onClick={() => setShowDescModal(true)}
              >
                <div className="pos-action-card-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&h=280&fit=crop&q=80"
                    alt="Escritório e vagas"
                    className="pos-action-card-img"
                  />
                </div>
                <div className="pos-action-card-btn">Descrição da vaga na TRK</div>
              </button>
            </section>
          ) : null}

          {/* ── View: Reports / Team ───────────────── */}
          {activeView === 'reports' || activeView === 'team' ? (
            <>
              {/* ── Tabs ────────────────────────────────── */}
              <section className="pos-tabs" role="tablist" aria-label="Relatórios da Equipe">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'reports'}
                  className={`pos-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('reports')
                    loadReport()
                    loadVipMembers()
                    loadTaskCommissions()
                  }}
                >
                  Relatórios de funcionário
                </button>
              </section>

              {/* ── Filtro de datas ─────────────────────── */}
              <section className="pos-filter">
                <div className="pos-filter-row">
                  <label>
                    <span>De</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </label>
                  <label>
                    <span>Até</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </label>
                  <button type="button" onClick={onSearch} disabled={fetching}>
                    {fetching ? 'Pesquisando...' : 'Pesquisar'}
                  </button>
                </div>

                {activeTab === 'team' ? (
                  <div className="pos-level-switch">
                    <button
                      type="button"
                      className={teamLevel === 1 ? 'active' : ''}
                      onClick={() => setTeamLevel(1)}
                    >
                      Nível 1
                    </button>
                    <button
                      type="button"
                      className={teamLevel === 2 ? 'active' : ''}
                      onClick={() => setTeamLevel(2)}
                    >
                      Nível 2
                    </button>
                    <button
                      type="button"
                      className={teamLevel === 3 ? 'active' : ''}
                      onClick={() => setTeamLevel(3)}
                    >
                      Nível 3
                    </button>
                  </div>
                ) : null}
              </section>

              {/* ── Conteúdo ────────────────────────────── */}
              {loading ? (
                <div className="pos-loading">Carregando relatório...</div>
              ) : (
                <>
                  {activeTab === 'reports' ? (
                    <>
                      {/* Membros que compraram VIP */}
                      <section className="pos-levels-card">
                        <h2 className="pos-levels-title">Membros que se tornaram funcionário efetivo</h2>
                        {vipMembers.length === 0 ? (
                          <div className="pos-empty">Nenhum membro da equipe se tornou funcionário efetivo</div>
                        ) : (
                          [1, 2, 3].map((lv) => {
                            const membersAtLevel = vipMembers.filter((m) => m.level === lv)
                            if (membersAtLevel.length === 0) return null
                            return (
                              <div key={lv} className="pos-vip-level-group">
                                <div className="pos-vip-level-header">
                                  <span>Nível {lv}</span>
                                  <span className="pos-vip-level-commission">Comissão: {membersAtLevel[0]?.commissionPercent ?? 0}%</span>
                                </div>
                                <div className="pos-vip-members-list">
                                  {membersAtLevel.map((member) => (
                                    <div key={member.id} className="pos-vip-member-card">
                                      <div className="pos-vip-member-top">
                                        <div className="pos-vip-member-info">
                                          <h4>{member.name}</h4>
                                          <p>{member.phone}</p>
                                        </div>
                                        <div className="pos-vip-member-badge">
                                          <span className="vip-active">{member.vipLevelName}</span>
                                        </div>
                                      </div>
                                      <div className="pos-vip-member-details">
                                        <div className="pos-vip-member-detail-row">
                                          <span>Valor pago</span>
                                          <strong>{formatBRL(member.vipPrice)}</strong>
                                        </div>
                                        <div className="pos-vip-member-detail-row">
                                          <span>Sua comissão</span>
                                          <strong className="pos-commission-value">{formatBRL(member.commissionEarned)}</strong>
                                        </div>
                                        {member.vipStartedAt ? (
                                          <div className="pos-vip-member-detail-row">
                                            <span>Ativado em</span>
                                            <strong>{new Date(member.vipStartedAt).toLocaleDateString('pt-BR')}</strong>
                                          </div>
                                        ) : null}
                                        {member.vipExpiresAt ? (
                                          <div className="pos-vip-member-detail-row">
                                            <span>Expira em</span>
                                            <strong>{new Date(member.vipExpiresAt).toLocaleDateString('pt-BR')}</strong>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </section>

                      {/* Comissões de tarefas dos indicados */}
                      <section className="pos-levels-card">
                        <h2 className="pos-levels-title">Comissões de tarefas dos indicados</h2>

                        {/* Resumo geral */}
                        {taskCommissionGrandTotal > 0 && (
                          <div className="pos-task-comm-total">
                            <span>Total de comissões recebidas</span>
                            <strong className="pos-commission-value">{formatBRL(taskCommissionGrandTotal)}</strong>
                          </div>
                        )}

                        {/* Resumo por nível */}
                        {taskCommissionSummary.length > 0 && (
                          <div className="pos-task-comm-summary">
                            {taskCommissionSummary.map((s) => (
                              <div key={s.level} className="pos-task-comm-summary-item">
                                <span className="pos-task-comm-level">Nível {s.level}</span>
                                <span className="pos-task-comm-percent">{s.commissionPercent}%</span>
                                <span className="pos-task-comm-payouts">{s.totalPayouts} pagamento(s)</span>
                                <strong className="pos-commission-value">{formatBRL(s.totalCommission)}</strong>
                              </div>
                            ))}
                          </div>
                        )}

                        {taskCommissionMembers.length === 0 ? (
                          <div className="pos-empty">Nenhuma comissão de tarefa recebida ainda</div>
                        ) : (
                          [1, 2, 3].map((lv) => {
                            const membersAtLevel = taskCommissionMembers.filter((m) => m.level === lv)
                            if (membersAtLevel.length === 0) return null
                            return (
                              <div key={lv} className="pos-vip-level-group">
                                <div className="pos-vip-level-header">
                                  <span>Nível {lv}</span>
                                  <span className="pos-vip-level-commission">Comissão: {membersAtLevel[0]?.commissionPercent ?? 0}%</span>
                                </div>
                                <div className="pos-vip-members-list">
                                  {membersAtLevel.map((member) => (
                                    <div key={member.memberId} className="pos-vip-member-card">
                                      <div className="pos-vip-member-top">
                                        <div className="pos-vip-member-info">
                                          <h4>{member.memberName}</h4>
                                          <p>{member.memberPhone}</p>
                                        </div>
                                        <div className="pos-vip-member-badge">
                                          <span className="pos-task-badge">{member.taskCount} tarefa(s)</span>
                                        </div>
                                      </div>
                                      <div className="pos-vip-member-details">
                                        <div className="pos-vip-member-detail-row">
                                          <span>Valor base das tarefas</span>
                                          <strong>{formatBRL(member.totalBaseAmount)}</strong>
                                        </div>
                                        <div className="pos-vip-member-detail-row">
                                          <span>Sua comissão ({member.commissionPercent}%)</span>
                                          <strong className="pos-commission-value">{formatBRL(member.totalCommission)}</strong>
                                        </div>
                                        {member.lastCommissionAt ? (
                                          <div className="pos-vip-member-detail-row">
                                            <span>Última comissão</span>
                                            <strong>{new Date(member.lastCommissionAt).toLocaleDateString('pt-BR')}</strong>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </section>
                    </>
                  ) : (
                    <>
                      {/* Comissões de tarefas dos indicados por nível */}
                      {(() => {
                        const filteredMembers = taskCommissionMembers.filter((m) => m.level === teamLevel)
                        const levelSummary = taskCommissionSummary.find((s) => s.level === teamLevel)
                        return (
                          <>
                            <section className="pos-team-summary">
                              <div className="pos-kpi-card">
                                <p className="pos-kpi-label">Indicados com comissão - Nível {teamLevel}</p>
                                <p className="pos-kpi-value">{filteredMembers.length} membro(s)</p>
                              </div>
                              <div className="pos-kpi-card">
                                <p className="pos-kpi-label">Total de comissões</p>
                                <p className="pos-kpi-value pos-commission-value">{formatBRL(levelSummary?.totalCommission ?? 0)}</p>
                              </div>
                            </section>

                            <section className="pos-members-list">
                              {filteredMembers.length === 0 ? (
                                <div className="pos-empty">Nenhuma comissão de tarefa neste nível</div>
                              ) : (
                                filteredMembers.map((member) => (
                                  <div key={member.memberId} className="pos-member-item has-vip">
                                    <div className="pos-member-info">
                                      <h4>{member.memberName}</h4>
                                      <p>{member.memberPhone}</p>
                                      <small>Tarefas realizadas: {member.taskCount}</small>
                                    </div>
                                    <div className="pos-member-right">
                                      <strong className="pos-commission-value">{formatBRL(member.totalCommission)}</strong>
                                      <span className="ok">Comissão: {member.commissionPercent}%</span>
                                      <span className="pos-task-badge">{member.taskCount} tarefa(s)</span>
                                    </div>
                                    <div className="pos-member-vip-details">
                                      <div className="pos-member-vip-row">
                                        <span>Valor base das tarefas</span>
                                        <strong>{formatBRL(member.totalBaseAmount)}</strong>
                                      </div>
                                      <div className="pos-member-vip-row">
                                        <span>Sua comissão ({member.commissionPercent}%)</span>
                                        <strong className="pos-commission-value">{formatBRL(member.totalCommission)}</strong>
                                      </div>
                                      {member.lastCommissionAt ? (
                                        <div className="pos-member-vip-row">
                                          <span>Última comissão</span>
                                          <strong>{new Date(member.lastCommissionAt).toLocaleDateString('pt-BR')}</strong>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ))
                              )}
                            </section>
                          </>
                        )
                      })()}
                    </>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      </section>

      {/* ── Modal: Descrição da vaga ────────────── */}
      {showDescModal ? (
        <div className="pos-desc-overlay" role="dialog" aria-modal="true" aria-labelledby="pos-desc-title">
          <div className="pos-desc-modal">
            <div className="pos-desc-modal-header">
              <h3 id="pos-desc-title">Descrição da vaga na TRK</h3>
              <button
                type="button"
                className="pos-desc-close"
                onClick={() => setShowDescModal(false)}
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="pos-desc-modal-body">
              <div className="pos-desc-section">
                <h4>T1</h4>
                <p>Plano inicial. Compre o plano e realize tarefas diárias para render o seu valor investido. Convide amigos para aumentar seus ganhos com comissões.</p>
              </div>
              <div className="pos-desc-section">
                <h4>T2</h4>
                <p>Plano intermediário com maior quantidade de tarefas diárias e maior valor por tarefa. Trabalhe todos os dias para maximizar seus rendimentos.</p>
              </div>
              <div className="pos-desc-section">
                <h4>T3</h4>
                <p>Plano avançado com tarefas de alto valor. Mais tarefas diárias disponíveis e comissões sobre os indicados de Nível 1 e Nível 2.</p>
              </div>
              <div className="pos-desc-section">
                <h4>T4</h4>
                <p>Plano premium com rendimento elevado por tarefa. Comissões sobre indicados de todos os 3 níveis e salário mensal disponível.</p>
              </div>
              <div className="pos-desc-section">
                <h4>T5</h4>
                <p>Plano máximo da plataforma. Maior quantidade de tarefas diárias, maior valor por tarefa, comissões em todos os níveis e bônus exclusivos.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
