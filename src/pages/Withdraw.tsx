import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './Withdraw.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PixType = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA'

type WithdrawConfigResponse = {
  ok?: boolean
  config?: {
    withdrawFeePercent?: number
    minWithdrawAmount?: number
    maxWithdrawAmount?: number
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Withdraw() {
  const navigate = useNavigate()
  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token'),
    []
  )

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const [amount, setAmount] = useState('')
  const [holderName, setHolderName] = useState('')
  const [holderCpf, setHolderCpf] = useState('')
  const [pixType, setPixType] = useState<PixType>('CHAVE_ALEATORIA')
  const [pixKey, setPixKey] = useState('')
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [loadingPixData, setLoadingPixData] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [withdrawFeePercent, setWithdrawFeePercent] = useState(0)
  const [minWithdrawAmount, setMinWithdrawAmount] = useState(0)
  const [maxWithdrawAmount, setMaxWithdrawAmount] = useState(0)

  const [lastRequest, setLastRequest] = useState<{
    amount: number
    externalId?: string | null
    receiptCode?: string
    requestedAt: string
  } | null>(null)
  const [withdrawActivationToken, setWithdrawActivationToken] = useState('')
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [copiedActivationMessage, setCopiedActivationMessage] = useState(false)
  const [isWithdrawActivated, setIsWithdrawActivated] = useState(false)
  const [withdrawActivationExpiresAt, setWithdrawActivationExpiresAt] = useState<string | null>(null)

  const normalizeCpf = (value: string) => value.replace(/\D/g, '')

  const loadWithdrawActivationStatus = async () => {
    if (!token || !user?.id) return { ok: false, isActivated: false as boolean }

    try {
      const res = await fetch(`${API_URL}/api/withdraw/activation-status/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = (await res.json()) as {
        ok?: boolean
        isActivated?: boolean
        expiresAt?: string | null
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        navigate('/')
        return { ok: false, isActivated: false as boolean }
      }

      if (!res.ok || !data?.ok) {
        return { ok: false, isActivated: false as boolean }
      }

      const activated = Boolean(data.isActivated)
      setIsWithdrawActivated(activated)
      setWithdrawActivationExpiresAt(data.expiresAt ?? null)
      return { ok: true, isActivated: activated }
    } catch {
      setIsWithdrawActivated(false)
      setWithdrawActivationExpiresAt(null)
      return { ok: false, isActivated: false as boolean }
    }
  }

  useEffect(() => {
    if (!token || !user?.id) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      navigate('/')
      return
    }

    const loadStoredPix = async () => {
      if (!user?.id || !token) return

      setLoadingPixData(true)
      try {
        const res = await fetch(`${API_URL}/api/user/pix-key/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = (await res.json()) as {
          ok?: boolean
          hasPixKey?: boolean
          pixKey?: {
            holderName?: string
            holderCpf?: string
            pixKeyType?: PixType
            pixKey?: string
          } | null
        }

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('user')
          navigate('/')
          return
        }

        if (!res.ok || !data?.ok || !data.hasPixKey || !data.pixKey) return

        setHolderName(String(data.pixKey.holderName ?? ''))
        setHolderCpf(String(data.pixKey.holderCpf ?? ''))
        setPixType((data.pixKey.pixKeyType as PixType) ?? 'CHAVE_ALEATORIA')
        setPixKey(String(data.pixKey.pixKey ?? ''))
      } catch {
        // silencioso: usuário ainda pode preencher manualmente
      } finally {
        setLoadingPixData(false)
      }
    }

    const loadWithdrawConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/withdraw-config`)
        const data = (await res.json()) as WithdrawConfigResponse
        if (!res.ok || !data?.ok || !data.config) return

        setWithdrawFeePercent(Number(data.config.withdrawFeePercent ?? 0))
        setMinWithdrawAmount(Number(data.config.minWithdrawAmount ?? 0))
        setMaxWithdrawAmount(Number(data.config.maxWithdrawAmount ?? 0))
      } catch {
        // fallback silencioso
      }
    }

    loadStoredPix()
    loadWithdrawActivationStatus()
    loadWithdrawConfig()
  }, [navigate, token, user?.id])

  useEffect(() => {
    if (!showActivationModal || !token || !user?.id) return

    const interval = window.setInterval(async () => {
      const status = await loadWithdrawActivationStatus()
      if (status.ok && status.isActivated) {
        setShowActivationModal(false)
        setWithdrawActivationToken('')
        setCopiedActivationMessage(false)
        setError('')
        setSuccess('Saque ativado com sucesso no Telegram. Você já pode solicitar novamente.')
      }
    }, 3000)

    return () => window.clearInterval(interval)
  }, [showActivationModal, token, user?.id])

  const submitWithdraw = async () => {
    setError('')
    setSuccess('')
    setWithdrawActivationToken('')

    if (!token || !user?.id) {
      setError('Usuário não autenticado.')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      navigate('/')
      return
    }

    const parsedAmount = Number(amount.replace(',', '.'))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor de saque válido.')
      return
    }

    if (parsedAmount < minWithdrawAmount) {
      setError(`O valor mínimo de saque é ${formatBRL(minWithdrawAmount)}.`)
      return
    }

    if (maxWithdrawAmount > 0 && parsedAmount > maxWithdrawAmount) {
      setError(`O valor máximo de saque é ${formatBRL(maxWithdrawAmount)}.`)
      return
    }

    if (!holderName.trim()) {
      setError('Informe o nome do titular.')
      return
    }

    const cpf = normalizeCpf(holderCpf)
    if (cpf.length !== 11) {
      setError('CPF do titular inválido.')
      return
    }

    if (!pixKey.trim()) {
      setError('Informe a chave PIX.')
      return
    }

    if (!withdrawPassword || withdrawPassword.length < 6) {
      setError('Informe a senha de saque (mínimo 6 caracteres).')
      return
    }

    setLoading(true)
    try {
      if (!isWithdrawActivated) {
        const activationRes = await fetch(`${API_URL}/api/withdraw/activation-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        })

        const activationData = (await activationRes.json()) as {
          ok?: boolean
          token?: string
          error?: string
        }

        if (activationRes.status === 401 || activationRes.status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('user')
          navigate('/')
          return
        }

        if (!activationRes.ok || !activationData?.ok || !activationData?.token) {
          setError(activationData?.error || 'Não foi possível gerar o token de ativação de saque.')
          return
        }

        setError('Saque temporariamente bloqueado.')
        setWithdrawActivationToken(String(activationData.token))
        setShowActivationModal(true)
        setCopiedActivationMessage(false)
        setLastRequest(null)
        setSuccess('')
        return
      }

      setError('')
      setShowActivationModal(false)

      const requestRes = await fetch(`${API_URL}/api/withdraw/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          amount: parsedAmount,
          withdrawPassword,
        }),
      })

      const requestData = (await requestRes.json()) as {
        ok?: boolean
        error?: string
        message?: string
        withdraw?: {
          id?: number
          amount?: number
          externalId?: string | null
        }
      }

      if (!requestRes.ok || !requestData?.ok || !requestData.withdraw) {
        setError(requestData?.error || 'Não foi possível solicitar o saque.')
        return
      }

      setSuccess(requestData.message ?? 'Solicitação de saque enviada com sucesso.')
      const requestedAt = new Date().toISOString()
      const externalId = requestData.withdraw.externalId ?? null
      const fallbackCode = `WD-REC-${Date.now()}-${user.id}`
      setLastRequest({
        amount: Number(requestData.withdraw.amount ?? parsedAmount),
        externalId,
        receiptCode: externalId || fallbackCode,
        requestedAt,
      })
    } catch {
      setError('Erro ao processar solicitação de saque.')
    } finally {
      setLoading(false)
    }
  }

  const activationMessage = withdrawActivationToken
    ? `Ative o saque para mim: ${withdrawActivationToken}`
    : ''

  const copyActivationMessage = async () => {
    if (!activationMessage) return
    try {
      await navigator.clipboard.writeText(activationMessage)
      setCopiedActivationMessage(true)
      window.setTimeout(() => setCopiedActivationMessage(false), 1800)
    } catch {
      setCopiedActivationMessage(false)
    }
  }

  const parsedAmountPreview = Number(String(amount).replace(',', '.'))
  const hasValidPreviewAmount = Number.isFinite(parsedAmountPreview) && parsedAmountPreview > 0
  const feeValuePreview = hasValidPreviewAmount ? (parsedAmountPreview * withdrawFeePercent) / 100 : 0
  const netValuePreview = hasValidPreviewAmount ? parsedAmountPreview - feeValuePreview : 0

  return (
    <main className="tasks-page withdraw-page">
      <AppSidebar />

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Financeiro</p>
          <h1>Saque</h1>
          <span className="tasks-subtitle">Solicite seu saque PIX e acompanhe o processamento pelo webhook.</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
        </div>
      </header>

      {showActivationModal ? (
        <div className="withdraw-activation-modal-backdrop" role="presentation">
          <div className="withdraw-activation-modal" role="dialog" aria-modal="true" aria-labelledby="withdraw-activation-title">
            <h3 id="withdraw-activation-title">Ativação de saque necessária</h3>
            <p>O saque só é ativado quando você enviar no grupo a mensagem abaixo:</p>
            <pre className="withdraw-activation-code">{activationMessage}</pre>
            <div className="withdraw-activation-actions">
              <button type="button" className="withdraw-activation-copy" onClick={copyActivationMessage}>
                {copiedActivationMessage ? 'Copiado!' : 'Copiar mensagem'}
              </button>
              <button type="button" className="withdraw-activation-close" onClick={() => setShowActivationModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="withdraw-card">
        <h2>Solicitação de Saque PIX</h2>
        <p className="withdraw-help">
          Seus dados PIX são carregados automaticamente e ficam bloqueados aqui.
          Para alterar a chave PIX, use o botão abaixo.
        </p>

        {isWithdrawActivated ? (
          <div className="withdraw-feedback success">
            <p>
              Saque já ativado para sua conta.
              {withdrawActivationExpiresAt
                ? ` Válido até ${new Date(withdrawActivationExpiresAt).toLocaleString('pt-BR')}.`
                : ''}
            </p>
          </div>
        ) : null}

        <div className="withdraw-feedback withdraw-highlight withdraw-fee-highlight">
          <span className="withdraw-highlight-label">Taxa de saque</span>
          <strong className="withdraw-highlight-value">{withdrawFeePercent}%</strong>
        </div>

        {hasValidPreviewAmount ? (
          <div className="withdraw-feedback withdraw-highlight withdraw-net-highlight">
            <span className="withdraw-highlight-label">Valor líquido estimado</span>
            <strong className="withdraw-highlight-value">{formatBRL(netValuePreview)}</strong>
            <small className="withdraw-highlight-note">Taxa aplicada: {formatBRL(feeValuePreview)}</small>
          </div>
        ) : null}

        <div className="withdraw-grid">
          <label>
            Valor do saque (R$)
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label>
            Nome do titular
            <input
              type="text"
              placeholder="Nome completo"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              disabled
            />
          </label>

          <label>
            CPF do titular
            <input
              type="text"
              inputMode="numeric"
              placeholder="Somente números"
              value={holderCpf}
              onChange={(e) => setHolderCpf(e.target.value)}
              disabled
            />
          </label>

          <label>
            Tipo da chave PIX
            <select value={pixType} onChange={(e) => setPixType(e.target.value as PixType)} disabled>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="TELEFONE">Telefone</option>
              <option value="CHAVE_ALEATORIA">Chave aleatória</option>
            </select>
          </label>

          <label className="withdraw-full">
            Chave PIX
            <input
              type="text"
              placeholder="Digite sua chave PIX"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              disabled
            />
          </label>

          <label className="withdraw-full">
            Senha de saque
            <input
              type="password"
              placeholder="Senha de saque cadastrada"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
            />
          </label>
        </div>

        {loadingPixData ? <div className="withdraw-feedback">Carregando chave PIX salva...</div> : null}

        <div className="withdraw-bankcards-link-wrap">
          <button type="button" className="withdraw-bankcards-link" onClick={() => navigate('/bank-cards')}>
            Alterar chave PIX
          </button>
        </div>

        <div className="withdraw-actions">
          <button type="button" className="withdraw-submit" disabled={loading} onClick={submitWithdraw}>
            {loading ? 'Enviando...' : 'Solicitar saque'}
          </button>
        </div>

        {error ? (
          <div className="withdraw-feedback error">
            <p>{error}</p>
          </div>
        ) : null}
        {success ? (
          <div className="withdraw-feedback success">
            <p>{success}</p>
          </div>
        ) : null}

        {lastRequest ? (
          <section className="withdraw-paper-receipt" aria-label="Comprovante de solicitação de saque">
            <header className="withdraw-paper-header">
              <div>
                <h3>PGLM</h3>
                <p>Comprovante de Solicitação de Saque</p>
              </div>
              <span className="withdraw-paper-badge">VIA DO CLIENTE</span>
            </header>

            <div className="withdraw-paper-cut" />

            <div className="withdraw-paper-body">
              <p className="withdraw-paper-success">Solicitação de saque enviada com sucesso.</p>

              <div className="withdraw-paper-row">
                <span>Situação</span>
                <strong>Solicitação recebida com sucesso</strong>
              </div>

              <div className="withdraw-paper-row">
                <span>Valor solicitado</span>
                <strong>{formatBRL(lastRequest.amount)}</strong>
              </div>

              <div className="withdraw-paper-row">
                <span>Data e hora</span>
                <strong>{new Date(lastRequest.requestedAt).toLocaleString('pt-BR')}</strong>
              </div>

              <div className="withdraw-paper-row">
                <span>Comprovante</span>
                <strong>{lastRequest.receiptCode ?? lastRequest.externalId ?? '-'}</strong>
              </div>

              <div className="withdraw-paper-row">
                <span>CNPJ PGLM</span>
                <strong>12.345.678/0001-99</strong>
              </div>
            </div>

            <footer className="withdraw-paper-footer">
              <small>Documento gerado automaticamente pelo sistema PGLM.</small>
            </footer>
          </section>
        ) : null}
      </section>
    </main>
  )
}
