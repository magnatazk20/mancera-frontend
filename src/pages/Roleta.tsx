import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Roleta.css'

const PRIZES = ['1 BRL', '16 BRL', '35 BRL', '73 BRL', '183 BRL', '16600 BRL', '50 BRL', '90 BRL']

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
const WINNERS_SEED = [
  { phone: '****15658', amount: '35 BRL' },
  { phone: '****38633', amount: '73 BRL' },
  { phone: '****00277', amount: '183 BRL' },
  { phone: '****13231', amount: '35 BRL' },
  { phone: '****99044', amount: '16600 BRL' },
  { phone: '****60030', amount: '16 BRL' },
]

export default function Roleta() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'winners' | 'mine'>('winners')
  const [myWins, setMyWins] = useState<Array<{ amount: string; at: string }>>([])
  const [liveWinners, setLiveWinners] = useState(WINNERS_SEED)
  const [remainingSpins, setRemainingSpins] = useState(0)
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState<string | null>(null)
  const [redeemErrorMessage, setRedeemErrorMessage] = useState<string | null>(null)
  const redeemedCodeRef = useRef<string | null>(null)

  const segmentAngle = 360 / PRIZES.length
  const codeFromUrl = (searchParams.get('codigo') ?? '').trim().toUpperCase()

  useEffect(() => {
    let ignore = false

    const loadRoletaData = async () => {
      try {
        const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
        if (!rawUser) return
        const parsed = JSON.parse(rawUser) as { id?: number }
        const userId = Number(parsed?.id)
        if (!userId || Number.isNaN(userId)) return

        if (codeFromUrl && redeemedCodeRef.current !== codeFromUrl) {
          redeemedCodeRef.current = codeFromUrl
          const redeemResponse = await fetch(`${API_URL}/api/roleta/redeem-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, code: codeFromUrl }),
          })

          const redeemData = await redeemResponse.json().catch(() => ({} as { ok?: boolean; message?: string; error?: string; availableSpins?: number }))
          if (!ignore) {
            if (redeemResponse.ok && redeemData?.ok) {
              setRedeemErrorMessage(null)
              setRedeemSuccessMessage(`🎉 Parabéns! Você resgatou o código ${codeFromUrl}.`)
              if (typeof redeemData.availableSpins === 'number') {
                setRemainingSpins(Number(redeemData.availableSpins))
              }
            } else {
              setRedeemSuccessMessage(null)
              setRedeemErrorMessage(String(redeemData?.error ?? 'Não foi possível resgatar o código da roleta.'))
            }
          }
        }

        const [winsRes, spinsRes] = await Promise.all([
          fetch(`${API_URL}/api/roleta/spins/${userId}?limit=20`),
          fetch(`${API_URL}/api/roleta/spins-available/${userId}`),
        ])

        if (winsRes.ok) {
          const winsData = await winsRes.json() as {
            ok?: boolean
            spins?: Array<{ prizeLabel?: string; createdAt?: string }>
          }

          if (!ignore && winsData?.ok && Array.isArray(winsData.spins)) {
            setMyWins(
              winsData.spins.map((s) => ({
                amount: String(s.prizeLabel ?? ''),
                at: s.createdAt ? new Date(s.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
              }))
            )
          }
        }

        if (spinsRes.ok) {
          const spinsData = await spinsRes.json() as {
            ok?: boolean
            availableSpins?: number
          }

          if (!ignore && spinsData?.ok) {
            setRemainingSpins(Number(spinsData.availableSpins ?? 0))
          }
        }
      } catch {
        // noop
      }
    }

    const timer = window.setInterval(() => {
      setLiveWinners((prev) => {
        const randomPhone = `****${Math.floor(10000 + Math.random() * 89999)}`
        const randomAmount = PRIZES[Math.floor(Math.random() * PRIZES.length)]
        const next = [{ phone: randomPhone, amount: randomAmount }, ...prev]
        return next.slice(0, 18)
      })
    }, 1800)

    loadRoletaData()

    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [codeFromUrl])

  const wheelStyle = useMemo(() => {
    const colors = ['#0ea5e9', '#0284c7', '#06b6d4', '#0891b2', '#2563eb', '#1d4ed8', '#0ea5e9', '#0284c7']
    const stops = PRIZES.map((_, i) => {
      const start = i * segmentAngle
      const end = start + segmentAngle
      return `${colors[i % colors.length]} ${start}deg ${end}deg`
    }).join(', ')

    return {
      background: `conic-gradient(${stops})`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    }
  }, [rotation, segmentAngle])

  const spin = async () => {
    if (isSpinning || remainingSpins <= 0) return
    setIsSpinning(true)
    setWinner(null)

    try {
      const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
      if (!rawUser) {
        setIsSpinning(false)
        return
      }

      const parsed = JSON.parse(rawUser) as { id?: number }
      const userId = Number(parsed?.id)
      if (!userId || Number.isNaN(userId)) {
        setIsSpinning(false)
        return
      }

      const response = await fetch(`${API_URL}/api/roleta/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json() as {
        ok?: boolean
        spin?: { prizeLabel?: string; prizeIndex?: number; createdAt?: string }
        availableSpinsAfter?: number
      }

      if (!response.ok || !data?.ok || !data.spin) {
        setIsSpinning(false)
        return
      }

      const selectedIndex = 0
      const center = selectedIndex * segmentAngle + segmentAngle / 2
      const pointerAngle = 270
      const finalRotation = rotation + 2160 + (pointerAngle - center - (rotation % 360))
      setRotation(finalRotation)

      setTimeout(() => {
        const result = '1 BRL'
        setWinner(result)
        setMyWins((prev) => [
          { amount: result, at: data.spin?.createdAt ? new Date(data.spin.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR') },
          ...prev,
        ])
        if (typeof data.availableSpinsAfter === 'number') {
          setRemainingSpins(Number(data.availableSpinsAfter))
        } else {
          setRemainingSpins((prev) => Math.max(prev - 1, 0))
        }
        setIsSpinning(false)
      }, 4700)
    } catch {
      setIsSpinning(false)
    }
  }

  return (
    <main className="roleta-pro">
      <div className="roleta-wrap">
        <header className="roleta-head">
          <button className="roleta-back-btn" onClick={() => navigate('/dashboard')} type="button">
            ←
          </button>
          <h1>Roda da Sorte</h1>
          <div className="roleta-head-spacer" />
        </header>

        <section className="wheel-stage">
          <div className="wheel-pointer" />
          <div className="wheel-ring" />
          <div className="wheel-disc" style={wheelStyle}>
            {PRIZES.map((text, i) => {
              const angle = i * segmentAngle + segmentAngle / 2
              return (
                <div
                  key={`${text}-${i}`}
                  className="wheel-label"
                  style={{
                    left: `${50 + 34 * Math.sin((angle * Math.PI) / 180)}%`,
                    top: `${50 - 34 * Math.cos((angle * Math.PI) / 180)}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  {text}
                </div>
              )
            })}
            {PRIZES.map((_, i) => (
              <span
                key={`line-${i}`}
                className="wheel-line"
                style={{ transform: `translate(-50%, -100%) rotate(${i * segmentAngle}deg)` }}
              />
            ))}
          </div>

          <button className="wheel-center-btn" disabled>
            IR
          </button>

          <div className="spins-badge">
            Giros Restantes: <strong>{remainingSpins}</strong>
          </div>
        </section>

        <section className="spin-cta">
          {redeemSuccessMessage ? <p className="winner-text">{redeemSuccessMessage}</p> : null}
          {redeemErrorMessage ? <p className="winner-text">Erro ao resgatar código: {redeemErrorMessage}</p> : null}
          <button
            type="button"
            onClick={spin}
            disabled={isSpinning || remainingSpins <= 0}
            className={remainingSpins > 0 && !isSpinning ? 'ready' : ''}
          >
            {isSpinning ? 'Girando...' : 'Iniciar Sorteio'}
          </button>
          {winner ? <p className="winner-text">Resultado: {winner}</p> : null}
        </section>

        <section className="records-card">
          <div className="records-tabs">
            <button className={activeTab === 'winners' ? 'active' : ''} onClick={() => setActiveTab('winners')} type="button">
              Registros de Ganhadores
            </button>
            <button className={activeTab === 'mine' ? 'active' : ''} onClick={() => setActiveTab('mine')} type="button">
              Minhas Vitórias
            </button>
          </div>

          <div className="records-list">
            {activeTab === 'winners' ? (
              liveWinners.map((item, idx) => (
                <article className="record-row" key={`${item.phone}-${idx}`}>
                  <div>
                    <small>Parabéns</small>
                    <p>{item.phone}</p>
                  </div>
                  <strong>+{item.amount}</strong>
                </article>
              ))
            ) : myWins.length === 0 ? (
              <div className="empty-state">Você ainda não possui vitórias.</div>
            ) : (
              myWins.map((item, idx) => (
                <article className="record-row" key={`${item.at}-${idx}`}>
                  <div>
                    <small>Você ganhou</small>
                    <p>{item.at}</p>
                  </div>
                  <strong>+{item.amount}</strong>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
