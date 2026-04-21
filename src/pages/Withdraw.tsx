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
    withdrawStartTime?: string
    withdrawEndTime?: string
    withdrawAllowedDays?: string
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
  const [withdrawStartTime, setWithdrawStartTime] = useState('00:00')
  const [withdrawEndTime, setWithdrawEndTime] = useState('23:59')
  const [withdrawAllowedDays, setWithdrawAllowedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

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
  const [groupUrl, setGroupUrl] = useState('')
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [hasWithdrawPassword, setHasWithdrawPassword] = useState<boolean | null>(null)

  // ── Segurança: aceita apenas dígitos e vírgula/ponto para valor monetário ──
  const sanitizeAmount = (value: string) =>
    String(value ?? '').replace(/[^0-9.,]/g, '').slice(0, 12)

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
        const res = await fetch(`${API_URL}/api/withdraw-config`)
        const data = (await res.json()) as WithdrawConfigResponse
        if (!res.ok || !data?.ok || !data.config) return

        setWithdrawFeePercent(Number(data.config.withdrawFeePercent ?? 0))
        setMinWithdrawAmount(Number(data.config.minWithdrawAmount ?? 0))
        setMaxWithdrawAmount(Number(data.config.maxWithdrawAmount ?? 0))
        setWithdrawStartTime(String(data.config.withdrawStartTime ?? '00:00'))
        setWithdrawEndTime(String(data.config.withdrawEndTime ?? '23:59'))
        const parsedDays = String(data.config.withdrawAllowedDays ?? '0,1,2,3,4,5,6')
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        setWithdrawAllowedDays(parsedDays.length > 0 ? [...new Set(parsedDays)] : [0, 1, 2, 3, 4, 5, 6])
      } catch {
        // fallback silencioso
      }
    }

    const loadGroupUrl = async () => {
      try {
        const res = await fetch(`${API_URL}/api/community-links`)
        const data = (await res.json()) as { ok?: boolean; links?: { whatsappGroupUrl?: string } }
        if (data?.ok && data?.links?.whatsappGroupUrl) {
          setGroupUrl(data.links.whatsappGroupUrl)
        }
      } catch {
        // silencioso
      }
    }

    const loadBalance = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/summary/${user.id}`)
        const data = (await res.json()) as { ok?: boolean; balance?: number }
        if (res.ok && data?.balance !== undefined) {
          setUserBalance(Number(data.balance ?? 0))
        }
      } catch {
        // silencioso
      }
    }

    const loadWithdrawPasswordStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/withdraw-password/status/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = (await res.json()) as { ok?: boolean; hasWithdrawPassword?: boolean }
        if (res.ok && data?.ok) {
          setHasWithdrawPassword(Boolean(data.hasWithdrawPassword))
        }
      } catch {
        // silencioso
      }
    }

    loadStoredPix()
    loadWithdrawActivationStatus()
    loadWithdrawConfig()
    loadGroupUrl()
    loadBalance()
    loadWithdrawPasswordStatus()
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

    if (hasWithdrawPassword === false) {
      navigate('/withdraw-password')
      return
    }

    // ── Segurança: sanitiza e valida valor antes de qualquer lógica ──
    const rawAmount = sanitizeAmount(amount)

    // bloqueia valores com mais de 2 casas decimais (ex: 10,001)
    const decimalMatch = rawAmount.replace(',', '.').match(/\.(\d+)/)
    if (decimalMatch && decimalMatch[1].length > 2) {
      setError('Informe um valor com no máximo 2 casas decimais (ex: 150,00).')
      return
    }

    const parsedAmount = Number(rawAmount.replace(',', '.'))

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor de saque válido.')
      return
    }

    // limite absoluto de segurança no frontend (R$ 100.000)
    if (parsedAmount > 100_000) {
      setError('Valor de saque excede o limite permitido.')
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

    if (userBalance !== null && parsedAmount > userBalance) {
      setError(`Saldo insuficiente. Seu saldo atual é ${formatBRL(userBalance)}.`)
      return
    }

    if (!isWithdrawWindowOpen) {
      setError(withdrawWindowMessage)
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      const receiptPayload = {
        amount: Number(requestData.withdraw.amount ?? parsedAmount),
        externalId,
        receiptCode: externalId || fallbackCode,
        requestedAt,
      }

      setLastRequest(receiptPayload)
      navigate('/saque/comprovante', { state: receiptPayload })
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

  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  const parseTimeToMinutes = (timeValue: string) => {
    const [hh, mm] = String(timeValue ?? '').split(':').map((v) => Number(v))
    if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
    return hh * 60 + mm
  }

  const startMinutes = parseTimeToMinutes(withdrawStartTime)
  const endMinutes = parseTimeToMinutes(withdrawEndTime)
  const nowInSaoPaulo = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const currentWeekDay = nowInSaoPaulo.getDay()
  const currentMinutes = nowInSaoPaulo.getHours() * 60 + nowInSaoPaulo.getMinutes()

  const isDayAllowed = withdrawAllowedDays.includes(currentWeekDay)
  const isTimeAllowed =
    startMinutes != null && endMinutes != null
      ? startMinutes <= endMinutes
        ? currentMinutes >= startMinutes && currentMinutes <= endMinutes
        : currentMinutes >= startMinutes || currentMinutes <= endMinutes
      : false

  const isWithdrawWindowOpen = isDayAllowed && isTimeAllowed
  const allowedDaysLabel =
    withdrawAllowedDays.length > 0
      ? withdrawAllowedDays
          .slice()
          .sort((a, b) => a - b)
          .map((day) => weekdayNames[day] ?? String(day))
          .join(', ')
      : 'Nenhum'

  const withdrawWindowMessage = !isDayAllowed
    ? `Saque indisponível hoje. Dias permitidos: ${allowedDaysLabel}.`
    : !isTimeAllowed
      ? `Saque indisponível neste horário. Permitido entre ${withdrawStartTime} e ${withdrawEndTime} (horário de São Paulo).`
      : 'Saque disponível agora.'

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
            <h3 id="withdraw-activation-title">⚠️ Ativação de saque necessária</h3>

            <div className="withdraw-activation-steps">
              <div className="withdraw-activation-step">
                <span className="withdraw-activation-step-num">1</span>
                <span>Copie a mensagem abaixo</span>
              </div>
              <div className="withdraw-activation-step">
                <span className="withdraw-activation-step-num">2</span>
                <span>Acesse o grupo oficial da PGLM</span>
              </div>
              <div className="withdraw-activation-step">
                <span className="withdraw-activation-step-num">3</span>
                <span>Cole e envie a mensagem no grupo</span>
              </div>
              <div className="withdraw-activation-step">
                <span className="withdraw-activation-step-num">4</span>
                <span>Aguarde a ativação automática</span>
              </div>
            </div>

            <p className="withdraw-activation-label">Mensagem para enviar:</p>
            <pre className="withdraw-activation-code">{activationMessage}</pre>

            {groupUrl ? (
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="withdraw-activation-group-link"
              >
                📲 Ir para o Grupo Oficial da PGLM
              </a>
            ) : (
              <p className="withdraw-activation-no-link">
                Acesse o grupo oficial da PGLM e envie a mensagem acima para ativar seu saque.
              </p>
            )}

            <div className="withdraw-activation-actions">
              <button type="button" className="withdraw-activation-copy" onClick={copyActivationMessage}>
                {copiedActivationMessage ? '✅ Copiado!' : 'Copiar mensagem'}
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

        <div className="withdraw-balance-display">
          <span className="withdraw-balance-label">Saldo disponível</span>
          <strong className="withdraw-balance-value">
            {userBalance !== null ? formatBRL(userBalance) : '—'}
          </strong>
        </div>

        {hasWithdrawPassword === false ? (
          <div className="withdraw-no-pwd-backdrop" role="presentation">
            <div className="withdraw-no-pwd-modal" role="dialog" aria-modal="true" aria-labelledby="no-pwd-title">
              <div className="withdraw-no-pwd-icon-wrap">
                <svg className="withdraw-no-pwd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="2.2" />
                  <path d="M8 10V7.7a4 4 0 0 1 8 0V10" />
                </svg>
              </div>
              <h3 id="no-pwd-title" className="withdraw-no-pwd-title">Senha de saque necessária</h3>
              <p className="withdraw-no-pwd-desc">
                Você ainda não cadastrou uma senha de saque.<br />
                É necessário criar uma senha antes de solicitar qualquer saque na plataforma.
              </p>
              <div className="withdraw-no-pwd-actions">
                <button
                  type="button"
                  className="withdraw-no-pwd-btn-primary"
                  onClick={() => navigate('/withdraw-password')}
                >
                  Criar senha de saque
                </button>
                <button
                  type="button"
                  className="withdraw-no-pwd-btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        ) : null}

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

        <div className={`withdraw-feedback withdraw-window-status ${isWithdrawWindowOpen ? 'success' : 'error'}`}>
          <p>{withdrawWindowMessage}</p>
          <small>
            Janela configurada: {withdrawStartTime} até {withdrawEndTime} • Dias: {allowedDaysLabel}
          </small>
        </div>

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
              maxLength={12}
              autoComplete="off"
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              onPaste={(e) => {
                e.preventDefault()
                const pasted = e.clipboardData.getData('text')
                setAmount(sanitizeAmount(pasted))
              }}
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
              maxLength={72}
              autoComplete="current-password"
              onChange={(e) => setWithdrawPassword(
                String(e.target.value).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 72)
              )}
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
          <button
            type="button"
            className="withdraw-submit"
            disabled={loading || !isWithdrawWindowOpen || hasWithdrawPassword === false}
            onClick={submitWithdraw}
          >
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
