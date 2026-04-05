import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteCode.css'

export default function AdminRouletteCode() {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [message, setMessage] = useState('')

  const handleCreate = () => {
    if (!code.trim()) {
      const msg = 'Informe um código para a roleta.'
      setMessage(msg)
      window.alert(msg)
      return
    }

    const msg = `Código "${code.trim()}" preparado para criação (integração backend pendente).`
    setMessage(msg)
    window.alert(msg)
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
              />
            </div>
          </div>

          <div className="roulette-code-actions">
            <button type="button" className="roulette-code-btn" onClick={handleCreate}>Criar Código</button>
          </div>

          {message ? <p className="roulette-code-feedback">{message}</p> : null}

          <p className="roulette-code-hint">
            Integração com API de criação de código da roleta pode ser ligada na próxima etapa.
          </p>
        </section>
      </section>
    </main>
  )
}
