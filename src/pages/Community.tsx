import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Community.css'
import './Tasks.css'

type CommunityLinksResponse = {
  ok?: boolean
  links?: {
    whatsappGroupUrl?: string
    vipGroupUrl?: string
    managerContact?: string
  }
}

type PaidTransactionResponse = {
  ok?: boolean
  total?: number
  transactions?: Array<{
    type?: 'deposit' | 'withdraw'
    status?: 'paid' | 'pending'
  }>
}

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function Community() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState('')
  const [managerContact, setManagerContact] = useState('')
  const [vipGroupUrl, setVipGroupUrl] = useState('')
  const [canAccessVipGroup, setCanAccessVipGroup] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    let user: StoredUser | null = null

    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as StoredUser
      } catch {
        user = null
      }
    }

    const loadLinks = async () => {
      setLoading(true)
      try {
        const [communityRes, paidRes] = await Promise.all([
          fetch(`${API_URL}/api/community-links`),
          user?.id ? fetch(`${API_URL}/api/transactions/paid/${user.id}?limit=1`) : Promise.resolve(null),
        ])

        const communityData = (await communityRes.json()) as CommunityLinksResponse
        if (communityRes.ok && communityData?.ok) {
          const links = communityData.links ?? {}
          const vipFromApi =
            String(
              links.vipGroupUrl ??
              (links as { vip_group_url?: string }).vip_group_url ??
              ''
            ).trim()

          setWhatsappGroupUrl(String(links.whatsappGroupUrl ?? ''))
          setManagerContact(String(links.managerContact ?? ''))
          setVipGroupUrl(vipFromApi)
        }

        if (paidRes && paidRes.ok) {
          const paidData = (await paidRes.json()) as PaidTransactionResponse
          const hasPaidDeposit = Array.isArray(paidData?.transactions)
            ? paidData.transactions.some((tx) => tx?.type === 'deposit' && tx?.status === 'paid')
            : Number(paidData?.total ?? 0) > 0
          setCanAccessVipGroup(hasPaidDeposit)
        } else {
          setCanAccessVipGroup(false)
        }
      } catch {
        setFeedback('Erro ao carregar dados da comunidade.')
        setCanAccessVipGroup(false)
      } finally {
        setLoading(false)
      }
    }

    loadLinks()
  }, [])

  const normalizeManagerContactToLink = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''

    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
      return trimmed
    }

    const onlyDigits = trimmed.replace(/\D/g, '')
    if (onlyDigits.length >= 10) {
      return `https://wa.me/${onlyDigits}`
    }

    return `mailto:${trimmed}`
  }

  const openExternal = (url: string, emptyMessage: string) => {
    if (!url) {
      setFeedback(emptyMessage)
      setTimeout(() => setFeedback(''), 1800)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="tasks-page community-page">
      <AppSidebar />
      <a href="/support" className="support-float-btn" title="Suporte">
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
      </a>

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Perfil</p>
          <h1>Comunidade</h1>
          <span className="tasks-subtitle">Acesse o grupo oficial e fale com o gerente</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="community-card">
        {loading ? (
          <div className="community-inline-message">Carregando links...</div>
        ) : (
          <>
            <p className="community-description">
              Entre na comunidade para receber novidades e suporte rápido.
            </p>

            <div className="community-actions">
              <button
                type="button"
                className="community-btn whatsapp"
                onClick={() => openExternal(whatsappGroupUrl, 'Link do grupo ainda não configurado.')}
              >
                Grupo do WhatsApp
              </button>

              {canAccessVipGroup ? (
                <button
                  type="button"
                  className="community-btn whatsapp"
                  onClick={() => openExternal(vipGroupUrl, 'Link do grupo VIP ainda não configurado.')}
                >
                  Grupo VIP
                </button>
              ) : null}

              <button
                type="button"
                className="community-btn manager"
                onClick={() =>
                  openExternal(
                    normalizeManagerContactToLink(managerContact),
                    'Contato do gerente ainda não configurado.'
                  )
                }
              >
                Contato do gerente
              </button>
            </div>

            {feedback ? <div className="community-feedback">{feedback}</div> : null}
          </>
        )}
      </section>
    </main>
  )
}
