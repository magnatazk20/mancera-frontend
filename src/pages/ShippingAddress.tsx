import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ShippingAddress.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type ShippingAddressData = {
  recipientName: string
  phone: string
  zipCode: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
  complement: string
}

const EMPTY_ADDRESS: ShippingAddressData = {
  recipientName: '',
  phone: '',
  zipCode: '',
  state: '',
  city: '',
  neighborhood: '',
  street: '',
  number: '',
  complement: '',
}

export default function ShippingAddress() {
  const navigate = useNavigate()
  const [address, setAddress] = useState<ShippingAddressData | null>(null)
  const [draft, setDraft] = useState<ShippingAddressData>(EMPTY_ADDRESS)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const cepCacheRef = useRef<Record<string, { state: string; city: string; neighborhood: string; street: string }>>({})
  const lastFetchedCepRef = useRef<string>('')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const storageKey = user?.id ? `shipping_address_${user.id}` : 'shipping_address_guest'

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as ShippingAddressData
      setAddress(parsed)
    } catch {
      // ignore malformed localStorage
    }
  }, [storageKey])

  const formatZipCode = (value: string) => {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const fetchCepData = async (zipCodeDigits: string) => {
    if (zipCodeDigits.length !== 8) return

    if (cepCacheRef.current[zipCodeDigits]) {
      const cached = cepCacheRef.current[zipCodeDigits]
      setDraft((prev) => ({
        ...prev,
        state: cached.state,
        city: cached.city,
        neighborhood: cached.neighborhood,
        street: cached.street,
      }))
      return
    }

    try {
      const res = await fetch(`https://viacep.com.br/ws/${zipCodeDigits}/json/`)
      const data = await res.json().catch(() => ({})) as {
        erro?: boolean
        uf?: string
        localidade?: string
        bairro?: string
        logradouro?: string
      }

      if (!res.ok || data?.erro) {
        setMsg({ type: 'error', text: 'CEP não encontrado.' })
        return
      }

      const mapped = {
        state: String(data.uf ?? '').trim(),
        city: String(data.localidade ?? '').trim(),
        neighborhood: String(data.bairro ?? '').trim(),
        street: String(data.logradouro ?? '').trim(),
      }

      cepCacheRef.current[zipCodeDigits] = mapped

      setDraft((prev) => ({
        ...prev,
        state: mapped.state || prev.state,
        city: mapped.city || prev.city,
        neighborhood: mapped.neighborhood || prev.neighborhood,
        street: mapped.street || prev.street,
      }))
    } catch {
      setMsg({ type: 'error', text: 'Não foi possível consultar o CEP agora.' })
    }
  }

  const onChange = (field: keyof ShippingAddressData, value: string) => {
    if (field === 'zipCode') {
      const formatted = formatZipCode(value)
      const digits = formatted.replace(/\D/g, '')
      setDraft((prev) => ({ ...prev, zipCode: formatted }))

      if (digits.length === 8 && lastFetchedCepRef.current !== digits) {
        lastFetchedCepRef.current = digits
        void fetchCepData(digits)
      }

      if (digits.length < 8) {
        lastFetchedCepRef.current = ''
      }

      return
    }

    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const openCreate = () => {
    setMsg(null)
    setDraft(address ?? EMPTY_ADDRESS)
    setEditing(true)
  }

  const onSave = () => {
    const requiredFields: Array<keyof ShippingAddressData> = [
      'recipientName',
      'phone',
      'zipCode',
      'state',
      'city',
      'neighborhood',
      'street',
      'number',
    ]

    const missing = requiredFields.find((field) => !String(draft[field] ?? '').trim())
    if (missing) {
      setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios.' })
      return
    }

    const normalized: ShippingAddressData = {
      ...draft,
      recipientName: draft.recipientName.trim(),
      phone: draft.phone.trim(),
      zipCode: draft.zipCode.trim(),
      state: draft.state.trim(),
      city: draft.city.trim(),
      neighborhood: draft.neighborhood.trim(),
      street: draft.street.trim(),
      number: draft.number.trim(),
      complement: draft.complement.trim(),
    }

    localStorage.setItem(storageKey, JSON.stringify(normalized))
    setAddress(normalized)
    setEditing(false)
    setMsg({ type: 'success', text: 'Endereço salvo com sucesso.' })
  }

  return (
    <main className="sa-page">
      <header className="sa-header">
        <button
          type="button"
          className="sa-back"
          onClick={() => navigate('/profile')}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="sa-title">Endereço de entrega</h1>
      </header>

      {msg ? (
        <div className={`sa-msg sa-msg--${msg.type}`}>
          {msg.text}
        </div>
      ) : null}

      {!editing && !address ? (
        <section className="sa-empty-wrap">
          <div className="sa-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 120 120" fill="none">
              <rect x="18" y="38" width="84" height="54" rx="8" fill="#f7f8fa" />
              <path d="M18 44h84" stroke="#eef1f4" strokeWidth="4" />
              <rect x="34" y="56" width="52" height="10" rx="5" fill="#ffffff" />
            </svg>
          </div>
          <p className="sa-empty-text">Sem mais dados</p>
        </section>
      ) : null}

      {!editing && address ? (
        <section className="sa-card-wrap">
          <article className="sa-card">
            <h2>{address.recipientName}</h2>
            <p>{address.phone}</p>
            <p>
              {address.street}, {address.number}
              {address.complement ? `, ${address.complement}` : ''}
            </p>
            <p>{address.neighborhood} - {address.city}/{address.state}</p>
            <p>CEP: {address.zipCode}</p>
          </article>
        </section>
      ) : null}

      {editing ? (
        <section className="sa-form-wrap">
          <div className="sa-form-grid">
            <label className="sa-field">
              <span>Nome do destinatário*</span>
              <input
                type="text"
                value={draft.recipientName}
                onChange={(e) => onChange('recipientName', e.target.value)}
                placeholder="Nome completo"
              />
            </label>

            <label className="sa-field">
              <span>Telefone*</span>
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                placeholder="(DDD) 9XXXX-XXXX"
              />
            </label>

            <label className="sa-field">
              <span>CEP*</span>
              <input
                type="text"
                value={draft.zipCode}
                onChange={(e) => onChange('zipCode', e.target.value)}
                placeholder="00000-000"
              />
            </label>

            <label className="sa-field sa-field--row">
              <span>Estado*</span>
              <input
                type="text"
                value={draft.state}
                onChange={(e) => onChange('state', e.target.value)}
                placeholder="UF"
              />
            </label>

            <label className="sa-field">
              <span>Cidade*</span>
              <input
                type="text"
                value={draft.city}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="Sua cidade"
              />
            </label>

            <label className="sa-field">
              <span>Bairro*</span>
              <input
                type="text"
                value={draft.neighborhood}
                onChange={(e) => onChange('neighborhood', e.target.value)}
                placeholder="Seu bairro"
              />
            </label>

            <label className="sa-field">
              <span>Rua*</span>
              <input
                type="text"
                value={draft.street}
                onChange={(e) => onChange('street', e.target.value)}
                placeholder="Nome da rua"
              />
            </label>

            <label className="sa-field sa-field--row">
              <span>Número*</span>
              <input
                type="text"
                value={draft.number}
                onChange={(e) => onChange('number', e.target.value)}
                placeholder="Nº"
              />
            </label>

            <label className="sa-field">
              <span>Complemento</span>
              <input
                type="text"
                value={draft.complement}
                onChange={(e) => onChange('complement', e.target.value)}
                placeholder="Apto, bloco, referência"
              />
            </label>
          </div>
        </section>
      ) : null}

      <div className="sa-footer">
        {!editing ? (
          <button type="button" className="sa-add-btn" onClick={openCreate}>
            {address ? 'Editar endereço de entrega' : 'Adicionar endereço de entrega'}
          </button>
        ) : (
          <div className="sa-footer-actions">
            <button
              type="button"
              className="sa-cancel-btn"
              onClick={() => {
                setEditing(false)
                setMsg(null)
              }}
            >
              Cancelar
            </button>
            <button type="button" className="sa-add-btn" onClick={onSave}>
              Salvar endereço
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
