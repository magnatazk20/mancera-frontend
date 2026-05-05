import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './About.css'

export default function About() {
  return (
    <main className="dash-app about-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <a href="/support" className="support-float-btn" title="Suporte">
            <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </a>
          {/* ── Imagem principal ── */}
          <section className="about-photo-section">
            <img
              src="/trkZaca.png"
              alt="TRK Zachary"
              className="about-photo-main"
            />
          </section>

          {/* ── Texto sobre nós ── */}
          <section className="about-text-section">
            <p className="about-text-paragraph">
              A TRK nasceu com um propósito claro: contribuir para a melhoria da qualidade de vida do povo brasileiro por meio da geração de oportunidades acessíveis e modernas de trabalho.
            </p>
            <p className="about-text-paragraph">
              Em um mundo cada vez mais digital, a empresa identificou a necessidade de criar alternativas para pessoas que buscam renda extra ou independência financeira sem abrir mão da flexibilidade. Foi assim que surgiu a proposta da TRK: conectar pessoas a oportunidades de trabalho online, permitindo que cada colaborador escolha seus próprios horários e trabalhe de onde estiver.
            </p>
            <p className="about-text-paragraph">
              Através de uma plataforma dinâmica e inovadora, os colaboradores têm acesso a uma grande variedade de imagens fotográficas e tarefas simples, podendo concluí-las e receber comissões de acordo com sua participação.
            </p>
            <p className="about-text-paragraph">
              Mais do que uma plataforma digital, a TRK representa uma nova forma de trabalhar: com liberdade, praticidade e conforto, diretamente de casa.
            </p>
            <p className="about-text-paragraph">
              Com crescimento constante e foco nas pessoas, a TRK segue expandindo suas oportunidades pelo Brasil, ajudando milhares de pessoas a transformar tempo livre em produtividade e renda.
            </p>
          </section>

                  </div>
      </section>
    </main>
  )
}