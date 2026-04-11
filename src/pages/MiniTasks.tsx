import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'

type MiniTask = {
  id: number
  title: string
  inviteGoal: number
  reward: number
}

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MiniTasks() {
  const navigate = useNavigate()

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

  return (
    <main className="tasks-page">
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

      <section className="tasks-list">
        {tasks.map((task) => (
          <article key={task.id} className="task-card" role="article" aria-label={task.title}>
            <div>
              <h3>{task.title}</h3>
              <p>Meta: {task.inviteGoal} convidados</p>
            </div>
            <div>
              <strong>{formatBRL(task.reward)}</strong>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
