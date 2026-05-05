import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Withdraw.css'

type WalletType = 'balance' | 'commission'

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

type VipData = {
  levelName: string
  vipPrice: number
  dailyTaskLimit: number
  taskRewardAmount: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const maskPixKey = (value: string) => {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  if (raw.includes('@')) {
    const [user, domain] = raw.split('@')
    if (!user) return `***@${domain}`
    const visible = user.slice(0, 2)
    return `${visible}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`
  }
  if (raw.length <= 4) return '*'.repeat(raw.length)
  const start = raw.slice(0, 2)
  const end = raw.slice(-2)
  const middle = '*'.repeat(Math.max(3, raw.length - 4))
  return `${start}${middle}${end}`
}

/**
 * Valores fixos de saque por nivel VIP.
 * T0 = bloqueado (sem opcoes).
 */
const WITHDRAW_OPTIONS_BY_LEVEL: Record<string, number[]> = {
  T1: [30, 200, 300, 500, 1000],
  T2: [500, 700, 1000],
  T3: [1000, 2000, 3000],
  T4: [1000, 2000, 3000],
  T5: [1000, 2000, 4000],
}

/**
 * Identifica o nivel VIP pelo nome ou pelo preco.
 * Tenta primeiro pelo nome (T1, T2...), depois por faixas de preco.
 * VIP com price=0 e sempre T0 (bloqueado).
 * Qualquer VIP pago sem match = fallback para T1.
 */
const resolveVipTier = (levelName: string, vipPrice: number): string | null => {
  if (vipPrice <= 0) return null // T0

  // Tenta extrair do nome (ex: "T1", "T3 Premium", "Nivel T2")
  const nameMatch = String(levelName ?? '').toUpperCase().match(/T(\d+)/)
  if (nameMatch) {
    const key = `T${nameMatch[1]}`
    if (WITHDRAW_OPTIONS_BY_LEVEL[key]) return key
  }

  // Tenta extrair um numero do nome (ex: "VIP 1" -> T1, "Nivel 3" -> T3)
  const numMatch = String(levelName ?? '').match(/(\d+)/)
  if (numMatch) {
    const key = `T${numMatch[1]}`
    if (WITHDRAW_OPTIONS_BY_LEVEL[key]) return key
  }

  // Fallback: qualquer VIP pago usa T1
  return 'T1'
}

/**
 * Retorna as opcoes de saque baseado no nivel VIP e saldo.
 */
const buildWithdrawOptions = (levelName: string, vipPrice: number, balance: number): number[] => {
  if (vipPrice <= 0 || balance <= 0) return []

  const tier = resolveVipTier(levelName, vipPrice)
  if (!tier) return []

  const options = WITHDRAW_OPTIONS_BY_LEVEL[tier] ?? WITHDRAW_OPTIONS_BY_LEVEL['T1']
  return (options ?? []).filter((v) => v <= balance)
}

/**
 * Retorna o valor minimo de saque do nivel VIP.
 */
const getMinWithdrawByVip = (levelName: string, vipPrice: number): number => {
  if (vipPrice <= 0) return 0

  const tier = resolveVipTier(levelName, vipPrice)
  if (!tier) return 0

  const options = WITHDRAW_OPTIONS_BY_LEVEL[tier] ?? WITHDRAW_OPTIONS_BY_LEVEL['T1']
  if (!options || options.length === 0) return 0
  return Math.min(...options)
}

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

  const [_holderName, setHolderName] = useState('')
  const [holderCpf, setHolderCpf] = useState('')
  const [pixType, setPixType] = useState<PixType>('CHAVE_ALEATORIA')
  const [pixKey, setPixKey] = useState('')
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [loadingPixData, setLoadingPixData] = useState(false)

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [withdrawFeePercent, setWithdrawFeePercent] = useState(0)
  const [minWithdrawAmount, setMinWithdrawAmount] = useState(0)
  const [maxWithdrawAmount, setMaxWithdrawAmount] = useState(0)
  const [withdrawStartTime, setWithdrawStartTime] = useState('00:00')
  const [withdrawEndTime, setWithdrawEndTime] = useState('23:59')
  const [withdrawAllowedDays, setWithdrawAllowedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [commissionBalance, setCommissionBalance] = useState<number | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<WalletType>('balance')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [hasWithdrawPassword, setHasWithdrawPassword] = useState<boolean | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordModalError, setPasswordModalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // VIP state
  const [vipData, setVipData] = useState<VipData | null>(null)
  const [vipLoaded, setVipLoaded] = useState(false)

  // T0 check: user is T0 if they have no VIP or VIP price is 0
  const isT0 = vipLoaded && (vipData === null || vipData.vipPrice === 0)

  // Balance da carteira selecionada
  const activeBalance = selectedWallet === 'commission' ? commissionBalance : userBalance
  const safeBalance = activeBalance !== null && activeBalance > 0 ? activeBalance : 0

  // Minimo de saque do VIP do usuario
  const vipMinAmount = getMinWithdrawByVip(vipData?.levelName ?? '', vipData?.vipPrice ?? 0)

  // Opcoes de valor baseadas no VIP
  const withdrawOptions = buildWithdrawOptions(vipData?.levelName ?? '', vipData?.vipPrice ?? 0, safeBalance)

  // Preview de valores
  const withdrawAmount = selectedAmount ?? 0
  const hasValidPreviewAmount = withdrawAmount > 0
  const feeValuePreview = hasValidPreviewAmount ? (withdrawAmount * withdrawFeePercent) / 100 : 0
  const netValuePreview = hasValidPreviewAmount ? withdrawAmount - feeValuePreview : 0

  // Limpa a selecao de valor quando troca de carteira
  useEffect(() => {
    setSelectedAmount(null)
  }, [selectedWallet])

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
          headers: { Authorization: `Bearer ${token}` },
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
        // silencioso
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
        setWithdrawStartTime(String(data.config.withdrawStartTime ?? '00:00'))
        setWithdrawEndTime(String(data.config.withdrawEndTime ?? '23:59'))
        const parsedDays = String(data.config.withdrawAllowedDays ?? '0,1,2,3,4,5,6')
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        setWithdrawAllowedDays(parsedDays.length > 0 ? [...new Set(parsedDays)] : [0, 1, 2, 3, 4, 5, 6])
      } catch {
        // silencioso
      }
    }

    const loadBalance = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/summary/${user.id}`)
        const data = (await res.json()) as {
          ok?: boolean
          balance?: number
          commissionBalance?: number
        }
        if (res.ok && data?.balance !== undefined) {
          setUserBalance(Number(data.balance ?? 0))
          setCommissionBalance(Number(data.commissionBalance ?? 0))
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

    const loadVipStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/vip/user/${user.id}`)
        const data = (await res.json()) as {
          ok?: boolean
          hasVip?: boolean
          vip?: {
            levelName?: string
            vipPrice?: number
            dailyTaskLimit?: number
            taskRewardAmount?: number
          } | null
        }
        if (res.ok && data?.ok) {
          if (data.hasVip && data.vip) {
            setVipData({
              levelName: String(data.vip.levelName ?? ''),
              vipPrice: Number(data.vip.vipPrice ?? 0),
              dailyTaskLimit: Number(data.vip.dailyTaskLimit ?? 0),
              taskRewardAmount: Number(data.vip.taskRewardAmount ?? 0),
            })
          } else {
            setVipData(null)
          }
        }
      } catch {
        // silencioso
      } finally {
        setVipLoaded(true)
      }
    }

    loadStoredPix()
    loadWithdrawConfig()
    loadBalance()
    loadWithdrawPasswordStatus()
    loadVipStatus()
  }, [navigate, token, user?.id])

  const openPasswordModal = () => {
    if (!token || !user?.id) {
      setFeedback({ type: 'error', message: 'Usuario nao autenticado.' })
      navigate('/')
      return
    }

    if (isT0) {
      return
    }

    if (hasWithdrawPassword === false) {
      navigate('/withdraw-password')
      return
    }

    if (!selectedAmount || selectedAmount <= 0) {
      setFeedback({ type: 'error', message: 'Selecione um valor de saque.' })
      return
    }

    if (selectedAmount < minWithdrawAmount && minWithdrawAmount > 0) {
      setFeedback({ type: 'error', message: `O valor minimo de saque e ${formatBRL(minWithdrawAmount)}.` })
      return
    }

    if (maxWithdrawAmount > 0 && selectedAmount > maxWithdrawAmount) {
      setFeedback({ type: 'error', message: `O valor maximo de saque e ${formatBRL(maxWithdrawAmount)}.` })
      return
    }

    if (activeBalance !== null && selectedAmount > activeBalance) {
      setFeedback({ type: 'error', message: 'Saldo insuficiente para este valor.' })
      return
    }

    if (!isWithdrawWindowOpen) {
      setFeedback({ type: 'error', message: withdrawWindowMessage })
      return
    }

    if (!pixKey.trim()) {
      setFeedback({ type: 'error', message: 'Cadastre um cartao bancario antes de sacar.' })
      return
    }

    setWithdrawPassword('')
    setShowPassword(false)
    setPasswordModalError('')
    setShowPasswordModal(true)
  }

  const submitWithdraw = async () => {
    setPasswordModalError('')

    if (!token || !user?.id) {
      setPasswordModalError('Usuario nao autenticado.')
      return
    }

    if (!selectedAmount || selectedAmount <= 0) {
      setPasswordModalError('Valor de saque invalido.')
      return
    }

    if (!withdrawPassword || withdrawPassword.length < 6) {
      setPasswordModalError('Informe a senha de saque (minimo 6 caracteres).')
      return
    }

    setLoading(true)
    try {
      const requestRes = await fetch(`${API_URL}/api/withdraw/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          amount: selectedAmount,
          withdrawPassword,
          walletType: selectedWallet,
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
        setPasswordModalError(requestData?.error || 'Nao foi possivel solicitar o saque.')
        return
      }

      setShowPasswordModal(false)
      setWithdrawPassword('')

      const requestedAt = new Date().toISOString()
      const externalId = requestData.withdraw.externalId ?? null
      const fallbackCode = `WD-REC-${Date.now()}-${user.id}`

      navigate('/saque/comprovante', {
        state: {
          amount: Number(requestData.withdraw.amount ?? selectedAmount),
          externalId,
          receiptCode: externalId || fallbackCode,
          requestedAt,
          walletType: selectedWallet,
          pixKey,
          pixType,
          holderCpf,
        },
      })
    } catch {
      setPasswordModalError('Erro ao processar solicitacao de saque.')
    } finally {
      setLoading(false)
    }
  }

  const closePasswordModal = () => {
    if (loading) return
    setShowPasswordModal(false)
    setWithdrawPassword('')
    setShowPassword(false)
    setPasswordModalError('')
  }

  const weekdayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

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
  const buildAllowedDaysLabel = (days: number[]): string => {
    if (days.length === 0) return 'Nenhum'
    if (days.length === 7) return 'Todos os dias'
    const sorted = days.slice().sort((a, b) => a - b)
    const ranges: { start: number; end: number }[] = []
    let rangeStart = sorted[0]
    let prev = sorted[0]
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i]
      } else {
        ranges.push({ start: rangeStart, end: prev })
        rangeStart = sorted[i]
        prev = sorted[i]
      }
    }
    ranges.push({ start: rangeStart, end: prev })
    return ranges
      .map((r) =>
        r.start === r.end
          ? weekdayNames[r.start]
          : `${weekdayNames[r.start]} a ${weekdayNames[r.end]}`
      )
      .join(', ')
  }

  const allowedDaysLabel = buildAllowedDaysLabel(withdrawAllowedDays)

  const withdrawWindowMessage = !isDayAllowed
    ? `Saque indisponivel hoje. Dias permitidos: ${allowedDaysLabel}.`
    : !isTimeAllowed
      ? `Saque indisponivel neste horario. Permitido entre ${withdrawStartTime} e ${withdrawEndTime}.`
      : 'Saque disponivel agora.'

  return (
    <main className="wd-page">
      <a href="/support" className="support-float-btn" title="Suporte"><img src="/icon-support.png" alt="Suporte" width="26" height="26" /></a>
      {/* ── Topbar ── */}
      <header className="wd-topbar">
        <button type="button" className="wd-topbar-back" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <span className="wd-topbar-title">Saque</span>
      </header>

      <div className="wd-scroll-box">
        {/* ── Wallet selector ── */}
        <div className="wd-section-label">Carteira</div>
        <div className="wd-wallet-row">
          <button
            type="button"
            className={`wd-wallet-opt${selectedWallet === 'balance' ? ' wd-wallet-opt--active' : ''}`}
            onClick={() => setSelectedWallet('balance')}
            disabled={isT0}
          >
            <span className="wd-wallet-opt__name">Saldo</span>
            <strong className="wd-wallet-opt__val">{userBalance !== null ? formatBRL(userBalance) : '--'}</strong>
          </button>
          <button
            type="button"
            className={`wd-wallet-opt${selectedWallet === 'commission' ? ' wd-wallet-opt--active' : ''}`}
            onClick={() => setSelectedWallet('commission')}
            disabled={isT0}
          >
            <span className="wd-wallet-opt__name">Comissao</span>
            <strong className="wd-wallet-opt__val">{commissionBalance !== null ? formatBRL(commissionBalance) : '--'}</strong>
          </button>
        </div>

        {/* ── Nivel VIP ── */}
        <div className="wd-cell">
          <div className="wd-cell-title">Nivel VIP</div>
          <div className="wd-cell-value">
            <span className={`wd-cell-text ${isT0 ? 'wd-cell-text--red' : 'wd-cell-text--green'}`}>
              {!vipLoaded ? 'Carregando...' : (vipData?.levelName || 'Estagiario (T0)')}
            </span>
          </div>
        </div>

        {/* ── Selecionar valor ── */}
        <div className="wd-section-label">Selecione o valor</div>
        {isT0 ? (
          <div className="wd-amount-empty">
            Disponivel a partir do nivel T1
          </div>
        ) : withdrawOptions.length === 0 ? (
          <div className="wd-amount-empty">
            {safeBalance <= 0 ? 'Saldo insuficiente' : `Saldo inferior ao minimo do seu VIP (${formatBRL(vipMinAmount)})`}
          </div>
        ) : (
          <div className="wd-amount-grid">
            {withdrawOptions.map((val) => (
              <button
                key={val}
                type="button"
                className={`wd-amount-btn${selectedAmount === val ? ' wd-amount-btn--active' : ''}`}
                onClick={() => setSelectedAmount(val)}
              >
                {formatBRL(val)}
              </button>
            ))}
          </div>
        )}

        {/* ── Cartao bancario ── */}
        <div className="wd-cell">
          <div className="wd-cell-title">Cartao bancario</div>
          <div className="wd-cell-value">
            <input
              type="text"
              className="wd-cell-input"
              value={loadingPixData ? 'Carregando...' : (pixKey ? maskPixKey(pixKey) : 'Nenhum cadastrado')}
              readOnly
              disabled
            />
          </div>
        </div>

        {/* ── Info rows ── */}
        <div className="wd-cell">
          <div className="wd-cell-title">Saque minimo</div>
          <div className="wd-cell-value">
            <span className="wd-cell-text">{vipMinAmount > 0 ? formatBRL(vipMinAmount) : '--'}</span>
          </div>
        </div>

        <div className="wd-cell">
          <div className="wd-cell-title">Taxa</div>
          <div className="wd-cell-value">
            <span className="wd-cell-text">{withdrawFeePercent}%</span>
          </div>
        </div>

        <div className="wd-cell">
          <div className="wd-cell-title">Valor liquido</div>
          <div className="wd-cell-value">
            <span className="wd-cell-text">{hasValidPreviewAmount ? formatBRL(netValuePreview) : '--'}</span>
          </div>
        </div>

        <div className="wd-cell">
          <div className="wd-cell-title">Horario de saque</div>
          <div className="wd-cell-value">
            <span className={`wd-cell-text ${isWithdrawWindowOpen ? 'wd-cell-text--green' : 'wd-cell-text--red'}`}>
              {isWithdrawWindowOpen ? 'Disponivel' : 'Indisponivel'} ({withdrawStartTime} - {withdrawEndTime})
            </span>
          </div>
        </div>

        {/* ── Alterar cartao ── */}
        <div className="wd-link-wrap">
          <button type="button" className="wd-link-btn" onClick={() => navigate('/bank-cards')}>
            Alterar cartao bancario
          </button>
        </div>

        {/* ── Submit ── */}
        <div className="wd-submit-wrap">
          <button
            type="button"
            className="wd-submit"
            disabled={loading || !isWithdrawWindowOpen || hasWithdrawPassword === false || isT0 || !selectedAmount}
            onClick={openPasswordModal}
          >
            <span>
              {loading
                ? 'Enviando...'
                : isT0
                  ? 'VIP necessario para sacar'
                  : !selectedAmount
                    ? 'Selecione um valor'
                    : `Sacar ${formatBRL(selectedAmount)}`}
            </span>
          </button>
        </div>
      </div>

      {/* ── Modal: usuario T0 (estagiario) ── */}
      {isT0 ? (
        <div className="wd-modal-overlay" onClick={() => navigate('/dashboard')}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wd-modal-icon wd-modal-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <p className="wd-modal-message">Voce ainda e <strong>Estagiario (T0)</strong>. Para realizar saques, e necessario ter pelo menos o nivel <strong>T1</strong> ou superior.</p>
            <button type="button" className="wd-modal-button" onClick={() => navigate('/vip')}>Ver planos VIP</button>
            <button type="button" className="wd-modal-button wd-modal-button--ghost" onClick={() => navigate('/dashboard')}>Voltar ao inicio</button>
          </div>
        </div>
      ) : null}

      {/* ── Modal: sem senha cadastrada ── */}
      {!isT0 && hasWithdrawPassword === false ? (
        <div className="wd-modal-overlay" onClick={() => navigate('/dashboard')}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wd-modal-icon wd-modal-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="10" rx="2.2" /><path d="M8 10V7.7a4 4 0 0 1 8 0V10" /></svg>
            </div>
            <p className="wd-modal-message">Voce ainda nao cadastrou uma senha de saque. Crie uma antes de solicitar.</p>
            <button type="button" className="wd-modal-button" onClick={() => navigate('/withdraw-password')}>Criar senha de saque</button>
            <button type="button" className="wd-modal-button wd-modal-button--ghost" onClick={() => navigate('/dashboard')}>Voltar ao inicio</button>
          </div>
        </div>
      ) : null}

      {/* ── Modal: confirmar senha ── */}
      {showPasswordModal ? (
        <div className="wd-modal-overlay" onClick={closePasswordModal}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wd-modal-icon wd-modal-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="10" rx="2.2" /><path d="M8 10V7.7a4 4 0 0 1 8 0V10" /></svg>
            </div>
            <p className="wd-modal-message">
              Digite sua senha de saque para confirmar <strong>{formatBRL(selectedAmount ?? 0)}</strong>.
            </p>
            <div className="wd-modal-field">
              <input
                type={showPassword ? 'text' : 'password'}
                className="wd-cell-input"
                placeholder="Senha de saque"
                value={withdrawPassword}
                maxLength={72}
                autoComplete="current-password"
                autoFocus
                onChange={(e) =>
                  setWithdrawPassword(
                    String(e.target.value).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 72)
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) submitWithdraw()
                }}
              />
              <button type="button" className="wd-modal-eye" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {passwordModalError ? <p className="wd-modal-error">{passwordModalError}</p> : null}
            <button type="button" className="wd-modal-button" onClick={submitWithdraw} disabled={loading}>
              {loading ? 'Processando...' : 'Confirmar saque'}
            </button>
            <button type="button" className="wd-modal-button wd-modal-button--ghost" onClick={closePasswordModal} disabled={loading}>
              Cancelar
            </button>
            <button type="button" className="wd-modal-forgot" onClick={() => { setShowPasswordModal(false); navigate('/withdraw-password') }}>
              Esqueci minha senha de saque
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Modal: erro / sucesso ── */}
      {feedback ? (
        <div className="wd-modal-overlay" onClick={() => setFeedback(null)}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`wd-modal-icon wd-modal-icon--${feedback.type}`}>
              {feedback.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              )}
            </div>
            <p className="wd-modal-message">{feedback.message}</p>
            <button type="button" className="wd-modal-button" onClick={() => setFeedback(null)}>OK</button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
