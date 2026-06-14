import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './Invite.css'
import { API_URL } from '../utils/apiUrl'

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


export default function Invite() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')
  const [referralLinkState, setReferralLinkState] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [commissionError, setCommissionError] = useState('')

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
          return
        }

        const [referralResponse, commissionResponse] = await Promise.all([
          fetch(`${apiBase}/api/referral/${parsedUserId}`),
          fetch(`${apiBase}/api/referral/commission-levels`),
        ])

        if (!referralResponse.ok) {
          setError('Não foi possível carregar seu link de convite.')
          return
        }

        const referralData = await referralResponse.json()
        if (!referralData?.ok) {
          setError('Não foi possível carregar seu link de convite.')
          return
        }

        setRefCode(String(referralData.referralCode ?? ''))
        setReferralLinkState(String(referralData.referralLink ?? ''))
        setError('')

        if (commissionResponse.ok) {
          const commissionData = await commissionResponse.json()
          const levels = Array.isArray(commissionData)
            ? commissionData
            : Array.isArray(commissionData?.levels)
              ? commissionData.levels
              : []

          const mapped = levels
            .map((item: any) => ({
              id: Number(item?.id ?? 0),
              level: Number(item?.level ?? 0),
              name: String(item?.name ?? `Nível ${Number(item?.level ?? 0)}`),
              commissionPercent: Number(item?.commissionPercent ?? item?.commission_percent ?? 0),
              isActive: Number(item?.isActive ?? item?.is_active ?? 1) === 1,
            }))
            .filter((item: CommissionLevel) => item.level > 0)
            .sort((a: CommissionLevel, b: CommissionLevel) => a.level - b.level)

          setCommissionLevels(mapped)
          setCommissionError(mapped.length ? '' : 'Comissões indisponíveis no momento.')
        } else {
          setCommissionLevels([])
          setCommissionError('Comissões indisponíveis no momento.')
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

  const qrSrc = useMemo(() => {
    const data = referralLink || refCode || 'TRK'
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(data)}`
  }, [refCode, referralLink])

  const copyCode = async () => {
    if (!refCode) return
    try {
      await navigator.clipboard.writeText(refCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 1800)
    } catch {
      // silencioso
    }
  }

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 1800)
    } catch {
      // silencioso
    }
  }

  return (
    <main className="dash-app invite-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <div className="invite-mobile-wrap">
            <header className="invite-topbar">
              <button type="button" className="invite-back" onClick={() => navigate('/dashboard')} aria-label="Voltar">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1>Convidar Amigos</h1>
              <div />
            </header>

            {loading ? (
              <div className="invite-loading">Carregando...</div>
            ) : error ? (
              <div className="invite-error">{error}</div>
            ) : (
              <section className="invite-card">
                <div className="invite-field">
                  <span className="invite-field-value">{refCode || '-'}</span>
                  <button type="button" className="invite-copy-btn" onClick={copyCode} aria-label="Copiar código">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {copiedCode ? <p className="invite-copy-feedback">Código copiado</p> : null}

                <div className="invite-field">
                  <span className="invite-field-value invite-field-link">{referralLink || '-'}</span>
                  <button type="button" className="invite-copy-btn" onClick={copyLink} aria-label="Copiar link">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {copiedLink ? <p className="invite-copy-feedback">Link copiado</p> : null}

                <p className="invite-tip">
                  Por favor, não convide contas fakes. Cada pessoa pode ter apenas uma conta em nossa empresa para ganhar dinheiro.
                </p>

                <div className="invite-qr-wrap">
                  <img src={qrSrc} alt="QR Code de convite" />
                </div>

                <p className="invite-save-tip">Pressione e segure a imagem para salvar</p>

                <section className="invite-commission-card">
                  <h2>Comissões por nível</h2>

                  {commissionLevels.length > 0 ? (
                    <div className="invite-commission-list">
                      {commissionLevels.map((level) => (
                        <article className="invite-commission-item" key={level.id || level.level}>
                          <div className="invite-commission-level">Nível {level.level}</div>
                          <div className="invite-commission-percent">{level.commissionPercent.toFixed(2)}%</div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="invite-commission-fallback">
                      {commissionError || 'Comissões indisponíveis no momento.'}
                    </div>
                  )}
                </section>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
