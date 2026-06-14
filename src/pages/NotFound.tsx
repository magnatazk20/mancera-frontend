import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <main className="notfound-page">
      <section className="notfound-card" aria-labelledby="notfound-title">
        <div className="notfound-code">404</div>
        <h1 id="notfound-title" className="notfound-title">Página não encontrada</h1>
        <p className="notfound-text">
          A página que você tentou acessar não existe ou foi movida.
        </p>

        <div className="notfound-actions">
          <Link to="/dashboard" className="notfound-btn notfound-btn--primary">
            Ir para Dashboard
          </Link>
          <Link to="/" className="notfound-btn notfound-btn--ghost">
            Login
          </Link>
        </div>
      </section>
    </main>
  )
}
