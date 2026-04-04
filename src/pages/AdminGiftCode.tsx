import { useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteCode.css'

type GiftCodeItem = {
  id: string
  code: string
  rewardValue: number
  maxUses: number
  notes: string
  createdAt: string
}

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminGiftCode() {
  const [code, setCode] = useState('')
  const [rewardValue, setRewardValue] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [createdCodes, setCreatedCodes] = useState<GiftCodeItem[]>([])

  const totalCodes = useMemo(() => createdCodes.length, [createdCodes])

  const handleCreate = () => {
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

    const alreadyExists = createdCodes.some((item) => item.code === normalizedCode)
    if (alreadyExists) {
      setMessage({ type: 'error', text: 'Esse código já foi criado nesta sessão.' })
      return
    }

    const newCode: GiftCodeItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: normalizedCode,
      rewardValue: Number(numericReward.toFixed(2)),
      maxUses: numericMaxUses,
      notes: notes.trim(),
      createdAt: new Date().toLocaleString('pt-BR'),
    }

    setCreatedCodes((prev) => [newCode, ...prev])
    setCode('')
    setRewardValue('')
    setMaxUses('1')
    setNotes('')
    setMessage({
      type: 'success',
      text: `Código ${normalizedCode} criado. Agora ele pode ser usado no /profile na área "Resgatar Código de Presente" quando conectado ao backend.`,
    })
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
            <p>Total criado nesta sessão: {totalCodes}</p>
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
            <button type="button" className="roulette-code-btn" onClick={handleCreate}>
              Criar Código
            </button>
          </div>

          {message ? (
            <p className="roulette-code-feedback" style={{ color: message.type === 'error' ? '#fca5a5' : '#86efac' }}>
              {message.text}
            </p>
          ) : null}

          {createdCodes.length ? (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 10 }}>Códigos Criados</h3>
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
                      Recompensa: {formatBRL(item.rewardValue)} • Limite: {item.maxUses} • Criado: {item.createdAt}
                    </p>
                    {item.notes ? (
                      <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Obs: {item.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="roulette-code-hint">
            Integração com API de gift code pode ser conectada em seguida para persistir os códigos no banco.
          </p>
        </section>
      </section>
    </main>
  )
}
