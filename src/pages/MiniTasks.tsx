import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './MiniTasks.css'

type MiniTask = {
  id: number
  title: string
  inviteGoal: number
  reward: number
}

type RedeemState = Record<number, 'idle' | 'loading' | 'done'>

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MiniTasks() {
  const navigate = useNavigate()
  const [redeemState, setRedeemState] = useState<RedeemState>({})
  const [notice, setNotice] = useState<string>('')

  const tasks = useMemo<MiniTask[]>(
    () => [
      { id: 1, title: 'Convidar 30 usuários', inviteGoal: 30, reward: 10 },
      { id: 2, title: 'Convidar 20 usuários', inviteGoal: 20, reward: 20 },
      { id: 3, title: 'Convidar 40 usuários', inviteGoal: 40, reward: 25 },
      { id: 4, title: 'Convidar 50 usuários', inviteGoal: 50, reward: 35 },
      { id: 5, title: 'Convidar 60 usuários', inviteGoal: 60, reward: 45 },
      { id: 6, title: 'Convidar 70 usuários', inviteGoal: 70, reward: 55 },
      { id: 7, title: 'Convidar 80 usuários', inviteGoal: 80, reward: 70 },
      { id: 8, title: 'Convidar 90 usuários', inviteGoal: 90, reward: 85 },
      { id: 9, title: 'Convidar 100 usuários', inviteGoal: 100, reward: 100 },
      { id: 10, title: 'Convidar 120 usuários', inviteGoal: 120, reward: 130 },
    ],
    []
  )

  const handleRedeem = async (task: MiniTask) => {
    setNotice('')
    setRedeemState((prev) => ({ ...prev, [task.id]: 'loading' }))

    try {
      const userId = Number(localStorage.getItem('userId') ?? 0)
      if (!userId || Number.isNaN(userId)) {
        throw new Error('Faça login novamente para resgatar.')
      }

      const response = await fetch(`/api/mini-tasks/${userId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.error ??
            'Resgate não disponível. Somente convidados nível 1 (direto do seu link) com depósito contam.'
        )
      }

      setRedeemState((prev) => ({ ...prev, [task.id]: 'done' }))
      setNotice(data?.message ?? 'Resgate realizado com sucesso.')
    } catch (err: any) {
      setRedeemState((prev) => ({ ...prev, [task.id]: 'idle' }))
      setNotice(
        err?.message ??
          'Não foi possível resgatar. Apenas convidados nível 1 depositantes são válidos.'
      )
    }
  }

  return (
    <main className="tasks-page mini-tasks-page">
      <AppSidebar />
      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Perfil</p>
          <h1>Mini tarefas</h1>
          <span className="tasks-subtitle">Complete convites e receba recompensas</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="mini-tasks-hero">
        <h2>Desafios de convite</h2>
        <p>Conclua metas de convites para receber bônus em saldo.</p>
        <small className="mini-tasks-rule">
          Regra: só conta convidado nível 1 (direto do seu link) que fez depósito.
        </small>
      </section>

      {notice ? <div className="mini-tasks-notice">{notice}</div> : null}

      <section className="mini-tasks-grid">
        {tasks.map((task) => {
          const state = redeemState[task.id] ?? 'idle'
          return (
            <article key={task.id} className="mini-task-card" role="article" aria-label={task.title}>
              <div className="mini-task-left">
                <span className="mini-task-index">#{task.id}</span>
                <div>
                  <h3 className="mini-task-title">{task.title}</h3>
                  <p className="mini-task-sub">Meta: {task.inviteGoal} convidados</p>
                </div>
              </div>
              <div className="mini-task-reward">
                <span>Recompensa</span>
                <strong>{formatBRL(task.reward)}</strong>
                <button
                  type="button"
                  className="mini-task-redeem-btn"
                  disabled={state === 'loading' || state === 'done'}
                  onClick={() => handleRedeem(task)}
                >
                  {state === 'loading' ? 'Resgatando...' : state === 'done' ? 'Resgatado' : 'Resgatar'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
