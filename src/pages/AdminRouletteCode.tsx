import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

export default function AdminRouletteCode() {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [message, setMessage] = useState('')

  const handleCreate = () => {
    if (!code.trim()) {
      setMessage('Informe um código para a roleta.')
      return
    }

    setMessage(`Código "${code.trim()}" preparado para criação (integração backend pendente).`)
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Criar Código da Roleta</h1>
            <p className="admin-subtitle">Crie códigos promocionais para ações da roleta.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Novo Código</h2>
            <span>Painel administrativo</span>
          </div>

          <div className="admin-form-grid">
            <label className="admin-form-field">
              <span>Código</span>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ex.: ROLETA10"
              />
            </label>

            <label className="admin-form-field">
              <span>Recompensa (opcional)</span>
              <input
                type="text"
                value={reward}
                onChange={(event) => setReward(event.target.value)}
                placeholder="Ex.: Giro extra / R$ 10"
              />
            </label>

            <label className="admin-form-field admin-form-field-full">
              <span>Descrição (opcional)</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Detalhes sobre o código da roleta"
              />
            </label>
          </div>

          <div className="admin-shortcuts">
            <button type="button" onClick={handleCreate}>Criar Código</button>
          </div>

          {message ? <p className="admin-log-hint">{message}</p> : null}

          <p className="admin-log-hint">
            Integração com API de criação de código da roleta pode ser ligada na próxima etapa.
          </p>
        </section>
      </section>
    </main>
  )
}
