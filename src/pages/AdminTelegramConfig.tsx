import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminTelegramConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [botToken, setBotToken] = useState('')
  const [groupId, setGroupId] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadConfig = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/telegram-config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao carregar configuração do Telegram.') })
        return
      }

      setBotToken(String(data?.config?.botToken ?? ''))
      setGroupId(String(data?.config?.groupId ?? ''))
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao carregar configuração do Telegram.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const normalizedBotToken = botToken.trim()
    const normalizedGroupId = groupId.trim()

    if (!normalizedBotToken) {
      setToast({ type: 'error', message: 'Bot token é obrigatório.' })
      return
    }

    if (!normalizedGroupId) {
      setToast({ type: 'error', message: 'Group ID é obrigatório.' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/telegram-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          botToken: normalizedBotToken,
          groupId: normalizedGroupId,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao salvar configuração do Telegram.') })
        return
      }

      setToast({ type: 'success', message: String(data?.message ?? 'Configuração do Telegram salva com sucesso.') })
      await loadConfig()
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao salvar configuração do Telegram.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Bot Telegram</h1>
            <p className="admin-subtitle">Configure o token do bot e o ID do grupo do Telegram.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Configuração Telegram</h2>
            <span>Dados usados para integração de notificações</span>
          </div>

          {loading ? (
            <p className="admin-log-hint">Carregando configuração...</p>
          ) : (
            <div style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-bot-token">Bot Token</label>
                <input
                  id="telegram-bot-token"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: 123456789:AA..."
                  value={botToken}
                  onChange={(event) => setBotToken(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-group-id">Group ID</label>
                <input
                  id="telegram-group-id"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: -1001234567890"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar configuração'}
                </button>
                <button type="button" className="btn ghost" onClick={loadConfig} disabled={saving}>
                  Recarregar
                </button>
              </div>
            </div>
          )}
        </section>
      </section>

      <FloatingToast
        open={Boolean(toast?.message)}
        type={toast?.type ?? 'success'}
        message={toast?.message ?? ''}
        onClose={() => setToast(null)}
      />
    </main>
  )
}
