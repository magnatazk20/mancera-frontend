import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './BankCards.css'

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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

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
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const selectedTypeMeta = useMemo(
    () => PIX_TYPE_OPTIONS.find((opt) => opt.value === pixKeyType) ?? PIX_TYPE_OPTIONS[0],
    [pixKeyType]
  )

  useEffect(() => {
    const loadPixData = async () => {
      if (!user?.id) {
        navigate('/')
        return
      }

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

  return (
    <main className="dash-app bankcards-page">
      <section className="dash-main">
        <AppSidebar />
        <a href="/support" className="support-float-btn" title="Suporte"><img src="/icon-support.png" alt="Suporte" width="26" height="26" /></a>

        <div className="dash-content">
          {/* Header */}
          <div className="bc-header">
            <button type="button" className="bc-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h2 className="bc-title">Chave PIX</h2>
              <p className="bc-subtitle">Cadastre ou atualize sua chave PIX para saques</p>
            </div>
          </div>

          {/* Mensagem */}
          {msg && (
            <div className={`bc-msg ${msg.type}`}>
              {msg.text}
            </div>
          )}

          {loading ? (
            <div className="bc-loading">Carregando dados...</div>
          ) : (
            <div className="bc-form-panel">
              <form className="bc-form" onSubmit={onSave}>
                {/* Tipo de chave */}
                <div className="bc-section">
                  <label className="bc-label">Tipo de chave PIX</label>
                  <select
                    className="bc-select"
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

                {/* Nome do titular */}
                <div className="bc-section">
                  <label className="bc-label">Nome do titular <span className="bc-required">*</span></label>
                  <input
                    className="bc-input"
                    placeholder="Nome completo"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                  />
                </div>

                {/* CPF do titular */}
                <div className="bc-section">
                  <label className="bc-label">CPF do titular <span className="bc-required">*</span></label>
                  <input
                    className="bc-input"
                    placeholder="000.000.000-00"
                    value={holderCpf}
                    onChange={(e) => setHolderCpf(e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                {/* Chave PIX */}
                <div className="bc-section">
                  <label className="bc-label">Chave PIX <span className="bc-required">*</span></label>
                  <input
                    className="bc-input"
                    placeholder={selectedTypeMeta.placeholder}
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                  />
                  <span className="bc-hint">
                    {selectedTypeMeta.label === 'CPF' || selectedTypeMeta.label === 'CNPJ'
                      ? 'Apenas números, sem pontos ou traços.'
                      : `Informe sua chave do tipo ${selectedTypeMeta.label}.`}
                  </span>
                </div>

                {/* Botão salvar */}
                <button type="submit" className="bc-submit-btn" disabled={saving}>
                  {saving
                    ? 'Salvando...'
                    : hasExistingKey
                      ? 'Atualizar chave PIX'
                      : 'Salvar chave PIX'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
