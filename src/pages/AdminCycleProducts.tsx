import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type CycleProduct = {
  id: number
  name: string
  description: string
  imageUrl: string
  price: number
  redeemRewardValue: number
  isActive: boolean
  createdAt: string | null
}

type FormState = {
  name: string
  description: string
  imageUrl: string
  price: string
  redeemRewardValue: string
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const emptyForm: FormState = {
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  redeemRewardValue: '',
  isActive: true,
}

export default function AdminCycleProducts() {
  const [products, setProducts] = useState<CycleProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const loadProducts = async () => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/cycle-products`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        products?: Array<{
          id?: number
          name?: string
          description?: string
          imageUrl?: string
          price?: number
          redeemRewardValue?: number
          isActive?: boolean
          createdAt?: string | null
        }>
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao carregar produtos.' })
        setProducts([])
        return
      }

      const mapped: CycleProduct[] = Array.isArray(data.products)
        ? data.products.map((item) => ({
            id: Number(item.id ?? 0),
            name: String(item.name ?? ''),
            description: String(item.description ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
            price: Number(item.price ?? 0),
            redeemRewardValue: Number(item.redeemRewardValue ?? 0),
            isActive: Boolean(item.isActive),
            createdAt: item.createdAt ?? null,
          }))
        : []

      setProducts(mapped)
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao carregar produtos.' })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const fillEditForm = (product: CycleProduct) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: String(product.price),
      redeemRewardValue: String(product.redeemRewardValue),
      isActive: product.isActive,
    })
    setFeedback(null)
  }

  const handleSave = async () => {
    const normalizedName = form.name.trim()
    const normalizedDescription = form.description.trim()
    const normalizedImageUrl = form.imageUrl.trim()
    const numericPrice = Number(form.price.replace(',', '.'))
    const numericReward = Number(form.redeemRewardValue.replace(',', '.'))

    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    if (!normalizedName) {
      setFeedback({ type: 'error', text: 'Informe o nome do produto.' })
      return
    }

    if (!normalizedDescription) {
      setFeedback({ type: 'error', text: 'Informe a descrição do produto.' })
      return
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFeedback({ type: 'error', text: 'Informe um preço válido.' })
      return
    }

    if (!Number.isFinite(numericReward) || numericReward < 0) {
      setFeedback({ type: 'error', text: 'Informe um valor de resgate válido.' })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const isEditing = editingId != null
      const endpoint = isEditing
        ? `${API_URL}/api/admin/cycle-products/${editingId}`
        : `${API_URL}/api/admin/cycle-products`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: normalizedName,
          description: normalizedDescription,
          imageUrl: normalizedImageUrl,
          price: Number(numericPrice.toFixed(2)),
          redeemRewardValue: Number(numericReward.toFixed(2)),
          isActive: form.isActive,
        }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao salvar produto.' })
        return
      }

      setFeedback({ type: 'success', text: data?.message || (isEditing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.') })
      resetForm()
      await loadProducts()
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao salvar produto.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: CycleProduct) => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const confirmed = window.confirm(`Deseja realmente apagar o produto "${product.name}"?`)
    if (!confirmed) return

    setDeletingId(product.id)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/cycle-products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao apagar produto.' })
        return
      }

      setFeedback({ type: 'success', text: data?.message || 'Produto apagado com sucesso.' })
      if (editingId === product.id) resetForm()
      await loadProducts()
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao apagar produto.' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Produtos (cycle_products)</h1>
            <p className="admin-subtitle">Crie, edite e apague os produtos exibidos na loja.</p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {products.length}</span>
          </div>
        </header>

        <section className="admin-panel admin-cycle-form-panel">
          <h3 className="admin-cycle-form-title">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="admin-cycle-form-grid">
            <div className="admin-cycle-field">
              <label>Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Preço (R$)</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Ex.: 29.90"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Ganho no resgate (R$)</label>
              <input
                type="text"
                value={form.redeemRewardValue}
                onChange={(e) => setForm((prev) => ({ ...prev, redeemRewardValue: e.target.value }))}
                placeholder="Ex.: 5.00"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Imagem (URL)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="admin-cycle-field full">
              <label>Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Descrição do produto"
              />
            </div>

            <div className="admin-cycle-field full">
              <label className="admin-cycle-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Produto ativo
              </label>
            </div>
          </div>

          <div className="admin-cycle-actions">
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar produto'}
            </button>
            {editingId ? (
              <button type="button" className="btn ghost" onClick={resetForm} disabled={saving}>
                Cancelar edição
              </button>
            ) : null}
          </div>
        </section>

        {feedback ? (
          <div className={`gift-toast ${feedback.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
            {feedback.text}
          </div>
        ) : null}

        {loading ? (
          <div className="vip-inline-message">Carregando produtos...</div>
        ) : !products.length ? (
          <div className="vip-inline-message">Nenhum produto encontrado.</div>
        ) : (
          <section className="admin-panel admin-cycle-list-panel">
            <div className="admin-cycle-list">
              {products.map((product) => (
                <article key={product.id} className="admin-cycle-item">
                  <div className="admin-cycle-item-head">
                    <div>
                      <strong className="admin-cycle-item-title">{product.name}</strong>
                      <p className="admin-cycle-item-description">{product.description}</p>
                      <p className="admin-cycle-item-meta">
                        Preço: {formatBRL(product.price)} • Resgate: {formatBRL(product.redeemRewardValue)}
                      </p>
                      <p className="admin-cycle-item-meta secondary">
                        Status: {product.isActive ? 'Ativo' : 'Inativo'} • Criado em: {product.createdAt ? new Date(product.createdAt).toLocaleString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="admin-cycle-item-actions">
                      <button type="button" className="btn ghost" onClick={() => fillEditForm(product)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn admin-cycle-delete-btn"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? 'Apagando...' : 'Apagar'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
