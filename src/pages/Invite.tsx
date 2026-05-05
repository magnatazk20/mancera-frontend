import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './Invite.css'

type StoredUser = {
  id?: number | string
  name?: string
  phone?: string
}

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

type VipCommissionLevelStats = {
  level: number
  buyersCount: number
  totalCommission: number
  commissionPercent: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Invite() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')
  const [referralLinkState, setReferralLinkState] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [vipStatsByLevel, setVipStatsByLevel] = useState<VipCommissionLevelStats[]>([])
  const [vipStatsTotal, setVipStatsTotal] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
    const loadReferral = async () => {
      try {
        const apiBase = String(API_URL ?? '').trim().replace(/\/+$/, '') || 'http://localhost:3333'
        const parsedUserId = Number(user?.id ?? 0)

        if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
          setError('Usuário não autenticado.')
        } else {
          try {
            const referralResponse = await fetch(`${apiBase}/api/referral/${parsedUserId}`)
            if (referralResponse.ok) {
              const referralData = await referralResponse.json()
              if (referralData?.ok) {
                setRefCode(String(referralData.referralCode ?? ''))
                setReferralLinkState(String(referralData.referralLink ?? ''))
                setError('')
              }
            } else {
              setError('Não foi possível carregar seu link de convite.')
            }
          } catch {
            setError('Erro de conexão ao carregar convite.')
          }
        }

        try {
          const response = await fetch(`${apiBase}/api/referral/commission-levels`)
          if (response.ok) {
            const commissionData = await response.json()
            if (commissionData?.ok && Array.isArray(commissionData.levels)) {
              const mappedLevels = commissionData.levels
                .map((item: any) => ({
                  id: Number(item?.id ?? 0),
                  level: Number(item?.level ?? 0),
                  name: String(item?.name ?? ''),
                  commissionPercent: Number(item?.commissionPercent ?? item?.commission_percent ?? 0),
                  isActive:
                    item?.isActive !== undefined
                      ? Number(item.isActive) === 1 || item.isActive === true
                      : item?.is_active !== undefined
                        ? Number(item.is_active) === 1 || item.is_active === true
                        : true,
                }))
                .filter((item: CommissionLevel) => item.level > 0 && item.isActive)
                .sort((a: CommissionLevel, b: CommissionLevel) => a.level - b.level)
              setCommissionLevels(mappedLevels)
            }
          }
        } catch {
          // silencioso
        }

        // Estatísticas de comissões VIP recebidas (compras de uplines)
        if (Number.isFinite(parsedUserId) && parsedUserId > 0) {
          try {
            const vipStatsRes = await fetch(`${apiBase}/api/referral/vip-commissions/${parsedUserId}`)
            if (vipStatsRes.ok) {
              const vipStatsData = await vipStatsRes.json()
              if (vipStatsData?.ok && Array.isArray(vipStatsData.levels)) {
                setVipStatsByLevel(
                  vipStatsData.levels.map((item: any) => ({
                    level: Number(item?.level ?? 0),
                    buyersCount: Number(item?.buyersCount ?? 0),
                    totalCommission: Number(item?.totalCommission ?? 0),
                    commissionPercent: Number(item?.commissionPercent ?? 0),
                  }))
                )
                setVipStatsTotal(Number(vipStatsData.grandTotal ?? 0))
              }
            }
          } catch {
            // silencioso
          }
        }
      } catch {
        setError('Erro de conexão ao carregar convite.')
      } finally {
        setLoading(false)
      }
    }

    loadReferral()
  }, [user])

  const referralLink = useMemo(() => {
    if (referralLinkState) return referralLinkState
    const origin = window.location.origin
    if (!refCode) return ''
    return `${origin}/register?ref=${encodeURIComponent(refCode)}`
  }, [refCode, referralLinkState])

  const copyCode = async () => {
    if (!refCode) return
    try {
      await navigator.clipboard.writeText(refCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch { /* */ }
  }

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch { /* */ }
  }

  const displayName = user?.phone ?? user?.name ?? 'Usuário'

  return (
    <main className="dash-app invite-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <a href="/support" className="support-float-btn" title="Suporte"><img src="/icon-support.png" alt="Suporte" width="26" height="26" /></a>
          {loading ? (
            <div className="invite-loading">Carregando...</div>
          ) : error ? (
            <div className="invite-error">{error}</div>
          ) : (
            <>
              {/* ── Banner Promote ─────────────────────── */}
              <section className="invite-promote">
                <div className="invite-promote-banner">
                  <img
                    src="https://vlm7.com/static/images/yq_br-Bra.png"
                    alt="Banner Brasil"
                    style={{ borderRadius: 5, display: 'block', width: '100%', maxWidth: '100%' }}
                  />
                </div>
                <h4 className="invite-promote-name">Seu melhor amigo {displayName}</h4>
                <h4 className="invite-promote-desc">Convido você a participar da TRK — Sua rotina de tarefas que vira dinheiro</h4>

                <div className="invite-promote-code-row">
                  <span>Código de indicação：</span>
                  <strong>{refCode || '-'}</strong>
                </div>
                <button type="button" className="invite-promote-copy-btn" onClick={copyCode}>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667-2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1-2.667 2.667h-8.666a2.667 2.667 0 0 1-2.667-2.667z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M4.012 16.737a2 2 0 0 1-1.012-1.737v-10c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {copiedCode ? 'Copiado!' : 'Copiar código de recomendação'}
                </button>

                <div className="invite-promote-link-row">
                  <span>{referralLink || '-'}</span>
                </div>
                <button type="button" className="invite-promote-copy-btn" onClick={copyLink}>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667-2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1-2.667 2.667h-8.666a2.667 2.667 0 0 1-2.667-2.667z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M4.012 16.737a2 2 0 0 1-1.012-1.737v-10c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {copiedLink ? 'Copiado!' : 'Copiar link de convite'}
                </button>
              </section>

              {/* ── Filtro de datas ───────────────────── */}
              <section className="invite-search-bar">
                <div className="invite-search-inputs">
                  <input
                    type="date"
                    className="invite-date-input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className="invite-date-sep">-</span>
                  <input
                    type="date"
                    className="invite-date-input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <button type="button" className="invite-search-btn">
                  Pesquisar
                </button>
              </section>

              {/* ── Stats: Receita + Ganho ─────────────── */}
              <section className="invite-stats-row">
                <div className="invite-stat-card">
                  <p className="invite-stat-label">Comissão VIP total(R$)</p>
                  <p className="invite-stat-value">{formatBRL(vipStatsTotal)}</p>
                </div>
                <div className="invite-stat-card">
                  <p className="invite-stat-label">Indicados que compraram VIP</p>
                  <p className="invite-stat-value">
                    {vipStatsByLevel.reduce((sum, lv) => sum + Number(lv.buyersCount ?? 0), 0)}
                  </p>
                </div>
              </section>

              {/* ── Botão Posição ──────────────────────── */}
              <button type="button" className="invite-position-btn" onClick={() => navigate('/position')}>
                Posição
              </button>

              {/* ── Stats: Equipe ──────────────────────── */}
              <section className="invite-team-card">
                <div className="invite-stats-row">
                  <div className="invite-stat-card">
                    <p className="invite-stat-label">Pessoas na Equipe(Individual)</p>
                    <p className="invite-stat-value">0</p>
                  </div>
                  <div className="invite-stat-card">
                    <p className="invite-stat-label">Novos Membros Hoje(Individual)</p>
                    <p className="invite-stat-value">0</p>
                  </div>
                </div>

                {/* ── Níveis de comissão ─────────────────── */}
                {commissionLevels.length > 0 ? (
                  commissionLevels.map((lvl) => {
                    const stats = vipStatsByLevel.find((s) => s.level === lvl.level)
                    const buyersCount = Number(stats?.buyersCount ?? 0)
                    const totalCommission = Number(stats?.totalCommission ?? 0)
                    return (
                      <div key={lvl.id} className="invite-level-card">
                        <div className="invite-level-header">
                          <span>Nível {lvl.level}</span>
                          <span>Lista de Membros &gt;</span>
                        </div>
                        <div className="invite-level-grid">
                          <div className="invite-level-cell">
                            <span className="invite-level-cell-value">{buyersCount}</span>
                            <span className="invite-level-cell-label">Compraram VIP (Indicados)</span>
                          </div>
                          <div className="invite-level-cell">
                            <span className="invite-level-cell-value">{formatBRL(totalCommission)}</span>
                            <span className="invite-level-cell-label">Comissão VIP recebida (R$)</span>
                          </div>
                          <div className="invite-level-cell">
                            <span className="invite-level-cell-value">{Number(lvl.commissionPercent).toFixed(0)}%</span>
                            <span className="invite-level-cell-label">Comissão por indicação</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="invite-level-card">
                    <div className="invite-level-header">
                      <span>Nível 1</span>
                      <span>Lista de Membros &gt;</span>
                    </div>
                    <div className="invite-level-grid">
                      <div className="invite-level-cell">
                        <span className="invite-level-cell-value">0/0</span>
                        <span className="invite-level-cell-label">Número de pessoas(Individual)</span>
                      </div>
                      <div className="invite-level-cell">
                        <span className="invite-level-cell-value">0</span>
                        <span className="invite-level-cell-label">Rendimento total(R$)</span>
                      </div>
                      <div className="invite-level-cell">
                        <span className="invite-level-cell-value">0</span>
                        <span className="invite-level-cell-label">Recompensa por indicação(0%)(R$)</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Banner inferior ──────────────────────── */}
              <div className="invite-bottom-banner">
                <img src="/trk-invite-banner.png" alt="TRK Banner" className="invite-bottom-banner-img" />
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
