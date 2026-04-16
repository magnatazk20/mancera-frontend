import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteCode.css'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3333'

export default function AdminRouletteCode() {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (creating) return

    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      const msg = 'Informe um código para a roleta.'
      setMessage(msg)
      window.alert(msg)
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      const msg = 'Sessão expirada. Faça login novamente para criar códigos.'
      setMessage(msg)
      window.alert(msg)
      return
    }

    try {
      setCreating(true)
      setMessage('')

      const response = await fetch(`${API_URL}/api/admin/roulette-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: normalizedCode,
          reward: reward.trim(),
          description: description.trim(),
        }),
      })

      const data = await response.json().catch(() => ({} as Record<string, unknown>))
      if (!response.ok) {
        const errorMessage =
          typeof data?.error === 'string' && data.error.trim()
            ? data.error.trim()
            : 'Não foi possível criar o código da roleta.'
        setMessage(errorMessage)
        window.alert(errorMessage)
        return
      }

      const successMessage =
        typeof data?.message === 'string' && data.message.trim()
          ? data.message.trim()
          : `Código "${normalizedCode}" criado com sucesso.`
      setMessage(successMessage)
      setCode('')
      setReward('')
      setDescription('')
      window.alert(successMessage)
    } catch {
      const errorMessage = 'Erro de conexão ao criar código da roleta.'
      setMessage(errorMessage)
      window.alert(errorMessage)
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
            <h1 className="roulette-code-title">Criar Código da Roleta</h1>
            <p className="roulette-code-subtitle">Crie códigos promocionais para ações da roleta.</p>
          </div>
        </header>

        <section className="roulette-code-card">
          <div className="roulette-code-card-head">
            <h2>Novo Código</h2>
            <p>Painel administrativo</p>
          </div>

          <div className="roulette-code-grid">
            <div className="roulette-code-field">
              <label htmlFor="roulette-code-input">Código</label>
              <input
                id="roulette-code-input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ex.: ROLETA10"
                disabled={creating}
              />
            </div>

            <div className="roulette-code-field">
              <label htmlFor="roulette-reward-input">Recompensa (opcional)</label>
              <input
                id="roulette-reward-input"
                type="text"
                value={reward}
                onChange={(event) => setReward(event.target.value)}
                placeholder="Ex.: Giro extra / R$ 10"
                disabled={creating}
              />
            </div>

            <div className="roulette-code-field full">
              <label htmlFor="roulette-description-input">Descrição (opcional)</label>
              <textarea
                id="roulette-description-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Detalhes sobre o código da roleta"
                disabled={creating}
              />
            </div>
          </div>

          <div className="roulette-code-actions">
            <button type="button" className="roulette-code-btn" onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Código'}
            </button>
          </div>

          {message ? <p className="roulette-code-feedback">{message}</p> : null}

          <p className="roulette-code-hint">
            Códigos criados ficam disponíveis imediatamente para uso nas ações da roleta.
          </p>
        </section>
      </section>
    </main>
  )
}
