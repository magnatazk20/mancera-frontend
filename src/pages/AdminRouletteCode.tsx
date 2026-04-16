import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteCode.css'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3333'

export default function AdminRouletteCode() {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [createdCodes, setCreatedCodes] = useState<
    Array<{
      id: number
      code: string
      reward: string
      description: string
      isActive: boolean
      createdAt: string | null
    }>
  >([])

  const totalCodes = useMemo(() => createdCodes.length, [createdCodes])

  const loadCodes = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) return

    setLoadingList(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/roulette-codes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({} as Record<string, unknown>))
      if (!response.ok) {
        const errorMessage =
          typeof data?.error === 'string' && data.error.trim()
            ? data.error.trim()
            : 'Não foi possível carregar os códigos da roleta.'
        setMessage(errorMessage)
        return
      }

      const list = Array.isArray((data as { rouletteCodes?: unknown[] }).rouletteCodes)
        ? ((data as { rouletteCodes: Array<Record<string, unknown>> }).rouletteCodes ?? [])
        : []

      const mapped = list.map((item) => ({
        id: Number(item.id ?? 0),
        code: String(item.code ?? ''),
        reward: String(item.reward ?? ''),
        description: String(item.description ?? ''),
        isActive: Number(item.isActive ?? 1) === 1 || item.isActive === true,
        createdAt: item.createdAt == null ? null : String(item.createdAt),
      }))

      setCreatedCodes(mapped)
    } catch {
      setMessage('Erro de conexão ao carregar códigos da roleta.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadCodes()
  }, [])

  const handleCreate = async () => {
    if (creating) return

    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      const msg = 'Informe um código para a roleta.'
      setMessage(msg)
      window.alert(msg)
      return
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      const msg = 'Token não encontrado. Faça login novamente.'
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
      await loadCodes()
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
            <p>Painel administrativo • Total cadastrados: {totalCodes}</p>
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
          <p className="roulette-code-hint">
            Link direto para resgatar/usar na roleta:{' '}
            <a
              href={code.trim() ? `/roleta?codigo=${encodeURIComponent(code.trim().toUpperCase())}` : '/roleta'}
              style={{ color: '#93c5fd', fontWeight: 700 }}
            >
              {code.trim()
                ? `Abrir Roleta com código (${code.trim().toUpperCase()})`
                : 'Abrir Roleta'}
            </a>
          </p>

          {loadingList ? <p className="roulette-code-hint">Carregando códigos...</p> : null}

          {createdCodes.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 10, color: '#eaf2ff' }}>Códigos criados</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {createdCodes.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid rgba(148,163,184,0.35)',
                      borderRadius: 10,
                      padding: 12,
                      background: 'rgba(15,23,42,0.88)',
                      color: '#eaf2ff',
                    }}
                  >
                    <strong style={{ color: '#f8fbff' }}>{item.code}</strong>
                    <p style={{ margin: '6px 0 0', color: '#dbeafe' }}>
                      Recompensa: {item.reward || '-'} • Status: {item.isActive ? 'Ativo' : 'Inativo'}
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#cbd5e1' }}>Descrição: {item.description || '-'}</p>
                    <p style={{ margin: '6px 0 0', color: '#93c5fd' }}>
                      Criado em:{' '}
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                    </p>
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
