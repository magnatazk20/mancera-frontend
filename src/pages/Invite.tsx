import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './Invite.css'

type StoredUser = {
  id?: number | string
  name?: string
  phone?: string
  referralCode?: string
  referral_code?: string
  referralLink?: string
  referral_link?: string
}

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function Invite() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')
  const [referralLinkState, setReferralLinkState] = useState('')
  const [copied, setCopied] = useState(false)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [commissionError, setCommissionError] = useState('')
  const [commissionSource, setCommissionSource] = useState('')

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

        const storedRefCode = String(user?.referralCode ?? user?.referral_code ?? '').trim()
        const storedReferralLink = String(user?.referralLink ?? user?.referral_link ?? '').trim()

        if (storedRefCode) {
          setRefCode(storedRefCode)
        }

        if (storedReferralLink) {
          setReferralLinkState(storedReferralLink)
        }

        if (!storedRefCode && !storedReferralLink) {
          setError('Não foi possível carregar seu link de convite.')
        }

        let commissionLoaded = false
        const commissionUrl = `${apiBase}/api/referral/commission-levels`
        try {
          const response = await fetch(commissionUrl)
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
              setCommissionError('')
              setCommissionSource(commissionUrl)
              commissionLoaded = true
            }
          }
        } catch (err) {
          console.error('[invite] erro ao buscar commission levels', err)
        }

        if (!commissionLoaded) {
          setCommissionLevels([])
          setCommissionSource('')
          setCommissionError('Não foi possível carregar comissões do banco de dados (API indisponível).')
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
    return `${origin}/cadastro?ref=${encodeURIComponent(refCode)}`
  }, [refCode, referralLinkState])

  const inviteMessage = useMemo(() => {
    if (!referralLink) return ''
    return `🚀 Cadastre-se com meu link exclusivo e entre agora:\n${referralLink}`
  }, [referralLink])

  const whatsappLink = useMemo(() => {
    if (!inviteMessage) return ''
    return `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`
  }, [inviteMessage])

  const displayedCommissionLevels = commissionLevels

  const getCommissionColor = (level: number) => {
    if (level === 1) return '#16a34a'
    if (level === 2) return '#2563eb'
    if (level === 3) return '#7c3aed'
    return '#111827'
  }

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setError('Não foi possível copiar o link.')
    }
  }

  return (
    <main className="tasks-page invite-page">
      <AppSidebar />
      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Convidar</p>
          <h1>Central de Convites</h1>
          <span className="tasks-subtitle">Compartilhe seu link exclusivo e acompanhe seu código de indicação</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="progress-card">
        <div className="progress-top">
          <span>Como funciona</span>
          <strong>3 passos simples</strong>
        </div>
        <ul className="invite-list">
          <li>Copie seu link exclusivo.</li>
          <li>Envie para amigos pelo WhatsApp, Telegram ou redes sociais.</li>
          <li>Quando a pessoa se cadastrar com seu link, ela entra como sua indicação.</li>
        </ul>
      </section>

      <section className="progress-card">
        {loading ? <p>Carregando link...</p> : null}
        {!loading && error ? <p className="feedback error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="progress-top">
              <span>Código de convite</span>
              <strong>{refCode || '-'}</strong>
            </div>

            <div style={{ marginTop: 12 }}>
              <label htmlFor="invite-link" className="invite-input-label">
                Link de cadastro
              </label>
              <input
                id="invite-link"
                type="text"
                value={referralLink}
                readOnly
                className="invite-input"
              />
            </div>

            <div className="task-footer" style={{ marginTop: 12, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
              <button onClick={copyLink} disabled={!referralLink}>
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #16a34a',
                  color: '#166534',
                  background: '#f0fdf4',
                  fontWeight: 600,
                }}
              >
                Enviar no WhatsApp
              </a>
            </div>

            {copied ? <p className="feedback ok">Link copiado com sucesso. Agora é só compartilhar.</p> : null}
          </>
        ) : null}
      </section>

      <section className="progress-card">
        <div className="progress-top">
          <span>Comissões por nível</span>
          <strong>{commissionSource ? `Ganhos do convite (${commissionSource})` : 'Ganhos do convite'}</strong>
        </div>
        <div
          style={{
            marginTop: 10,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {loading ? (
            <div className="invite-level-row" style={{ background: '#f9fafb' }}>
              <span className="invite-level-label">Carregando</span>
              <strong style={{ color: '#6b7280' }}>...</strong>
            </div>
          ) : displayedCommissionLevels.length === 0 ? (
            <div className="invite-level-row" style={{ background: '#f9fafb' }}>
              <span className="invite-level-label">{commissionError ? 'Erro ao buscar' : 'Sem configuração'}</span>
              <strong style={{ color: '#6b7280' }}>{commissionError ? 'API' : '0%'}</strong>
            </div>
          ) : (
            displayedCommissionLevels.map((item, index) => (
              <div
                key={`${item.level}-${item.id}`}
                className="invite-level-row"
                style={index === 0 ? { background: '#f9fafb' } : undefined}
              >
                <span className="invite-level-label">{`NÍVEL ${item.level}`}</span>
                <strong style={{ color: getCommissionColor(item.level) }}>
                  {`${Number(item.commissionPercent).toFixed(2).replace(/\.00$/, '')}%`}
                </strong>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="progress-card">
        <div className="progress-top">
          <span>Informações importantes</span>
          <strong>Leia antes de compartilhar</strong>
        </div>
        <ul className="invite-list">
          <li>Seu link já inclui seu código automaticamente (`?ref=`).</li>
          <li>Não altere o link para não perder o rastreamento da indicação.</li>
          <li>Se a página mostrar erro, verifique se você está logado e tente novamente.</li>
          <li>Seu código fica salvo no banco na tabela <strong>users.referral_code</strong>.</li>
        </ul>
      </section>
    </main>
  )
}
