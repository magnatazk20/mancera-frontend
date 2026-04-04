import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteCode.css'

type GiftCodeItem = {
  id: number
  code: string
  rewardValue: number
  maxUses: number
  notes: string
  createdAt: string | null
  usedCount: number
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminGiftCode() {
  const [code, setCode] = useState('')
  const [rewardValue, setRewardValue] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [createdCodes, setCreatedCodes] = useState<GiftCodeItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [creating, setCreating] = useState(false)

  const totalCodes = useMemo(() => createdCodes.length, [createdCodes])

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadCodes = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    setLoadingList(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/gift-codes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        giftCodes?: Array<{
          id?: number
          code?: string
          rewardValue?: number
          maxTotalUses?: number
          notes?: string
          createdAt?: string | null
          usedCount?: number
          isActive?: boolean
        }>
      }

      if (!res.ok || !data?.ok) {
        setMessage({ type: 'error', text: data?.error || 'Falha ao carregar códigos.' })
        return
      }

      const mapped = Array.isArray(data.giftCodes)
        ? data.giftCodes.map((item) => ({
            id: Number(item.id ?? 0),
            code: String(item.code ?? ''),
            rewardValue: Number(item.rewardValue ?? 0),
            maxUses: Number(item.maxTotalUses ?? 0),
            notes: String(item.notes ?? ''),
            createdAt: item.createdAt ?? null,
            usedCount: Number(item.usedCount ?? 0),
            isActive: Boolean(item.isActive),
          }))
        : []

      setCreatedCodes(mapped)
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão ao carregar códigos.' })
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadCodes()
  }, [])

  const handleCreate = async () => {
    const normalizedCode = code.trim().toUpperCase()
    const numericReward = Number(rewardValue.replace(',', '.'))
    const numericMaxUses = Number(maxUses)

    if (!normalizedCode) {
      setMessage({ type: 'error', text: 'Informe um código.' })
      return
    }

    if (!Number.isFinite(numericReward) || numericReward <= 0) {
      setMessage({ type: 'error', text: 'Informe um valor de recompensa válido.' })
      return
    }

    if (!Number.isInteger(numericMaxUses) || numericMaxUses <= 0) {
      setMessage({ type: 'error', text: 'Informe um limite de resgates válido.' })
      return
    }

    if (!token) {
      setMessage({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/gift-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: normalizedCode,
          rewardType: 'balance_credit',
          rewardValue: Number(numericReward.toFixed(2)),
          maxTotalUses: numericMaxUses,
          notes: notes.trim(),
        }),
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        giftCode?: {
          id?: number
          code?: string
          rewardValue?: number
          maxTotalUses?: number
          notes?: string
        }
      }

      if (!res.ok || !data?.ok) {
        setMessage({ type: 'error', text: data?.error || 'Erro ao criar código.' })
        return
      }

      setCode('')
      setRewardValue('')
      setMaxUses('1')
      setNotes('')
      setMessage({ type: 'success', text: `Código ${normalizedCode} criado com sucesso.` })

      await loadCodes()
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão ao criar código.' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="roulette-code-page">
      <AdminSidebar />
      <section className="roulette-code-content">
        <header className="roulette-code-header">
          <div>
            <h1 className="roulette-code-title">Gerenciar Códigos de Presente</h1>
            <p className="roulette-code-subtitle">
              Crie códigos para serem resgatados pelos usuários na página de perfil.
            </p>
          </div>
        </header>

        <section className="roulette-code-card">
          <div className="roulette-code-card-head">
            <h2>Novo Código de Presente</h2>
            <p>Total cadastrado no banco: {totalCodes}</p>
          </div>

          <div className="roulette-code-grid">
            <div className="roulette-code-field">
              <label htmlFor="gift-code-input">Código</label>
              <input
                id="gift-code-input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ex.: PRESENTE50"
                maxLength={20}
              />
            </div>

            <div className="roulette-code-field">
              <label htmlFor="gift-reward-input">Recompensa (R$)</label>
              <input
                id="gift-reward-input"
                type="text"
                value={rewardValue}
                onChange={(event) => setRewardValue(event.target.value)}
                placeholder="Ex.: 50"
              />
            </div>

            <div className="roulette-code-field">
              <label htmlFor="gift-max-uses-input">Limite de Resgates</label>
              <input
                id="gift-max-uses-input"
                type="number"
                min={1}
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
              />
            </div>

            <div className="roulette-code-field full">
              <label htmlFor="gift-notes-input">Observações (opcional)</label>
              <textarea
                id="gift-notes-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Ex.: campanha do fim de semana"
              />
            </div>
          </div>

          <div className="roulette-code-actions">
            <button type="button" className="roulette-code-btn" onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Código'}
            </button>
          </div>

          {message ? (
            <p className="roulette-code-feedback" style={{ color: message.type === 'error' ? '#fca5a5' : '#86efac' }}>
              {message.text}
            </p>
          ) : null}

          {loadingList ? <p className="roulette-code-hint">Carregando códigos...</p> : null}

          {createdCodes.length ? (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 10 }}>Códigos no Banco</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {createdCodes.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid rgba(148,163,184,0.3)',
                      borderRadius: 12,
                      padding: 12,
                      background: 'rgba(15,23,42,0.6)',
                    }}
                  >
                    <strong>{item.code}</strong>
                    <p style={{ margin: '6px 0 0', color: '#cbd5e1' }}>
                      Recompensa: {formatBRL(item.rewardValue)} • Limite: {item.maxUses} • Usos: {item.usedCount}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
                      Status: {item.isActive ? 'Ativo' : 'Inativo'} • Criado em: {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                    </p>
                    {item.notes ? (
                      <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Obs: {item.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
