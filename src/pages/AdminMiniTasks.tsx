import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

type MiniTaskItem = {
  id: number
  title: string
  inviteGoal: number
  rewardAmount: number
  badgeLabel: string
  isActive: boolean
  sortOrder: number
}

type FormState = {
  title: string
  inviteGoal: string
  rewardAmount: string
  badgeLabel: string
  isActive: boolean
  sortOrder: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const defaultForm: FormState = {
  title: '',
  inviteGoal: '0',
  rewardAmount: '0',
  badgeLabel: '',
  isActive: true,
  sortOrder: '0',
}

export default function AdminMiniTasks() {
  const [tasks, setTasks] = useState<MiniTaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const token = useMemo(() => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '', [])

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  )

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/mini-tasks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false || !Array.isArray(data?.tasks)) {
        throw new Error(data?.error ?? 'Falha ao carregar mini tasks.')
      }

      const normalized: MiniTaskItem[] = data.tasks.map((item: any) => ({
        id: Number(item?.id ?? 0),
        title: String(item?.title ?? ''),
        inviteGoal: Number(item?.inviteGoal ?? 0),
        rewardAmount: Number(item?.rewardAmount ?? 0),
        badgeLabel: String(item?.badgeLabel ?? ''),
        isActive: Boolean(item?.isActive),
        sortOrder: Number(item?.sortOrder ?? 0),
      }))

      setTasks(normalized)
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao carregar mini tasks.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  const startEdit = (task: MiniTaskItem) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      inviteGoal: String(task.inviteGoal),
      rewardAmount: String(task.rewardAmount),
      badgeLabel: task.badgeLabel,
      isActive: task.isActive,
      sortOrder: String(task.sortOrder),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        inviteGoal: Number(form.inviteGoal),
        rewardAmount: Number(String(form.rewardAmount).replace(',', '.')),
        badgeLabel: form.badgeLabel.trim(),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      }

      const isEditing = editingId != null
      const endpoint = isEditing
        ? `${API_URL}/api/admin/mini-tasks/${editingId}`
        : `${API_URL}/api/admin/mini-tasks`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error ?? 'Falha ao salvar mini task.')
      }

      setToast({
        type: 'success',
        message: isEditing ? 'Mini task atualizada com sucesso.' : 'Mini task criada com sucesso.',
      })
      resetForm()
      await loadTasks()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao salvar mini task.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Deseja realmente remover esta mini task?')
    if (!confirmed) return

    try {
      const res = await fetch(`${API_URL}/api/admin/mini-tasks/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error ?? 'Falha ao remover mini task.')
      }

      setToast({ type: 'success', message: 'Mini task removida com sucesso.' })
      if (editingId === id) resetForm()
      await loadTasks()
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Erro ao remover mini task.' })
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Mini Tasks</h1>
            <p>Configure, edite e remova tarefas da tabela mini_tasks.</p>
          </div>
        </header>

        <article className="admin-card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? `Editar #${editingId}` : 'Nova mini task'}</h2>
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Título</span>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>

            <label>
              <span>Meta de convites</span>
              <input
                type="number"
                min={0}
                value={form.inviteGoal}
                onChange={(e) => setForm((prev) => ({ ...prev, inviteGoal: e.target.value }))}
                required
              />
            </label>

            <label>
              <span>Recompensa (R$)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.rewardAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, rewardAmount: e.target.value }))}
                required
              />
            </label>

            <label>
              <span>Emblema</span>
              <input
                value={form.badgeLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, badgeLabel: e.target.value }))}
                placeholder="Ex: 🥉 Bronze"
                required
              />
            </label>

            <label>
              <span>Ordem</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                required
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              <span>Ativa</span>
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar mini task'}
              </button>
              {editingId ? (
                <button className="btn ghost" type="button" onClick={resetForm}>
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="admin-card">
          <h2 style={{ marginTop: 0 }}>Lista de mini tasks</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : tasks.length === 0 ? (
            <p>Nenhuma mini task encontrada.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Meta</th>
                    <th>Recompensa</th>
                    <th>Emblema</th>
                    <th>Ordem</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>{task.title}</td>
                      <td>{task.inviteGoal}</td>
                      <td>{Number(task.rewardAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td>{task.badgeLabel}</td>
                      <td>{task.sortOrder}</td>
                      <td>{task.isActive ? 'Ativa' : 'Inativa'}</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn ghost" type="button" onClick={() => startEdit(task)}>
                          Editar
                        </button>
                        <button className="btn danger" type="button" onClick={() => handleDelete(task.id)}>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {toast ? (
        <FloatingToast
          open={Boolean(toast)}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </main>
  )
}
