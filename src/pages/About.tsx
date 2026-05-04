import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './About.css'

export default function About() {
  return (
    <main className="dash-app about-page">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
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