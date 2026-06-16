import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'

export default function Support() {
  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />
        <div className="dash-content">

          {/* ── Banner de boas-vindas (mesmo visual da dashboard) ── */}
          <section className="trk-hero-banner" aria-label="Banner de boas-vindas">
            <iframe
              src="https://player.vimeo.com/video/723441502?autoplay=1&loop=1&muted=1&background=1&quality=auto"
              allow="autoplay; fullscreen"
              title="Mancera"
            />
          </section>

{/* ── Botões de suporte ── */}
          <section className="support-cards">


            {/* Card do Grupo */}
            <div className="support-card">
              <h2 className="support-card__title">Grupo de Membros</h2>
              <p className="support-card__desc">Entre no grupo oficial de membros Mancera para atualizações e suporte da comunidade.</p>
              <a
                href="https://chat.whatsapp.com/CrNhvk35n47JkXytDsATMa"
                target="_blank"
                rel="noopener noreferrer"
                className="support-card__btn support-card__btn--grupo"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Entrar no Grupo
              </a>
            </div>

          </section>

        </div>
      </section>
    </main>
  )
}