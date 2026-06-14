import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './BankCards.css'
import { API_URL } from '../utils/apiUrl'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA'

type PixKeyResponse = {
  ok?: boolean
  hasPixKey?: boolean
  pixKey?: {
    userId: number
    holderName: string
    holderCpf: string
    pixKeyType: PixKeyType
    pixKey: string
  } | null
  error?: string
}


const PIX_TYPE_OPTIONS: Array<{ value: PixKeyType; label: string; placeholder: string; disabled?: boolean }> = [
  { value: 'CPF', label: 'CPF', placeholder: 'Apenas números' },
  { value: 'CNPJ', label: 'CNPJ', placeholder: 'Apenas números' },
  { value: 'EMAIL', label: 'E-mail', placeholder: 'voce@exemplo.com' },
  { value: 'TELEFONE', label: 'Telefone', placeholder: '(DDD) 9XXXX-XXXX', disabled: true },
  { value: 'CHAVE_ALEATORIA', label: 'Chave Aleatória', placeholder: 'Chave gerada pelo banco' },
]

export default function BankCards() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [holderName, setHolderName] = useState('')
  const [holderCpf, setHolderCpf] = useState('')
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF')
  const [pixKey, setPixKey] = useState('')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  }, [])

  const selectedTypeMeta = useMemo(
    () => PIX_TYPE_OPTIONS.find((opt) => opt.value === pixKeyType) ?? PIX_TYPE_OPTIONS[0],
    [pixKeyType]
  )

  useEffect(() => {
    const loadPixData = async () => {
      if (!user?.id) { navigate('/'); return }
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/user/pix-key/${user.id}`)
        const data = (await res.json()) as PixKeyResponse
        if (!res.ok || !data?.ok) {
          setMsg({ text: data?.error ?? 'Erro ao carregar dados PIX.', type: 'error' })
          return
        }
        if (data.hasPixKey && data.pixKey) {
          setHolderName(String(data.pixKey.holderName ?? ''))
          setHolderCpf(String(data.pixKey.holderCpf ?? ''))
          setPixKeyType((data.pixKey.pixKeyType as PixKeyType) ?? 'CPF')
          setPixKey(String(data.pixKey.pixKey ?? ''))
          setHasExistingKey(true)
        } else {
          setHasExistingKey(false)
        }
      } catch {
        setMsg({ text: 'Erro de conexão ao carregar chave PIX.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadPixData()
  }, [navigate, user?.id])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const payload = {
      userId: user.id,
      holderName: holderName.trim(),
      holderCpf: holderCpf.replace(/\D/g, ''),
      pixKeyType,
      pixKey: pixKey.trim(),
    }

    if (!payload.holderName || !payload.holderCpf || !payload.pixKey) {
      setMsg({ text: 'Preencha todos os campos obrigatórios.', type: 'error' })
      return
    }

    setSaving(true)
    setMsg(null)

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/user/pix-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok || !data?.ok) {
        setMsg({ text: data?.error ?? 'Erro ao salvar chave PIX.', type: 'error' })
        return
      }
      setHasExistingKey(true)
      setMsg({ text: data?.message ?? 'Chave PIX salva com sucesso!', type: 'success' })
    } catch {
      setMsg({ text: 'Erro de conexão ao salvar chave PIX.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="dash-app bankcards-page">
        <section className="dash-main">
          <AppSidebar />
          <div className="dash-content bc-content">
            <div className="bc-topbar">
              <button type="button" className="bc-topbar-back" onClick={() => navigate('/profile')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M15 6l-6 6l6 6" />
                </svg>
              </button>
              <span className="bc-topbar-title">Banco</span>
            </div>
            <div className="bc-loading">
              <div className="bc-spinner" />
              Carregando dados...
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="dash-app bankcards-page">
      <section className="dash-main">
        <AppSidebar />
        <div className="dash-content bc-content">

          {/* ── Header ── */}
          <div className="bc-header">
            <button type="button" className="bc-back-btn" onClick={() => navigate('/profile')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="bc-title">{hasExistingKey ? 'Editar Banco' : 'Adicionar Banco'}</h1>
          </div>

          {/* ── Aviso ── */}
          <div className="bc-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Recebimento apenas via PIX</strong>
              <p>As transferências são feitas exclusivamente por chave PIX (CPF, e-mail ou telefone).</p>
            </div>
          </div>

          {/* ── Mensagem de feedback ── */}
          {msg && (
            <div className={`bc-feedback bc-feedback--${msg.type}`}>
              {msg.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
              {msg.text}
            </div>
          )}

          {/* ── Formulário ── */}
          <form className="bc-form" onSubmit={onSave}>

            {/* Tipo de Chave PIX */}
            <div className="bc-group">
              <label className="bc-label">Tipo de chave PIX</label>
              <select
                className="bc-input bc-select"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
              >
                {PIX_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}{opt.disabled ? ' (indisponível)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Nome Completo */}
            <div className="bc-group">
              <label className="bc-label">Nome completo</label>
              <input
                className="bc-input"
                type="text"
                placeholder="Como aparece no banco"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
              />
            </div>

            {/* CPF */}
            <div className="bc-group">
              <label className="bc-label">CPF</label>
              <input
                className="bc-input"
                type="text"
                placeholder="CPF do titular"
                value={holderCpf}
                onChange={(e) => setHolderCpf(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
              />
            </div>

            {/* Chave PIX */}
            <div className="bc-group">
              <label className="bc-label">{selectedTypeMeta.label}</label>
              <input
                className="bc-input"
                type="text"
                placeholder={selectedTypeMeta.placeholder}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>

            {/* Botão */}
            <button type="submit" className="bc-btn" disabled={saving}>
              {saving ? (
                <span className="bc-btn-loading">
                  <span className="bc-spinner bc-spinner--sm" />
                  Salvando...
                </span>
              ) : hasExistingKey ? 'Salvar Alterações' : 'Cadastrar Chave PIX'}
            </button>

          </form>
        </div>
      </section>
    </main>
  )
}