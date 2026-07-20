<script setup lang="ts">
// Página institucional (Apple HIG): hero + bento + como funciona + planos + CTA.
const contato = 'mailto:contato@informatizou.com.br?subject=Quero%20uma%20demonstração';

const passos = [
  { n: '01', t: 'Conhecemos você', d: 'Estudamos seu negócio a partir de informações públicas.' },
  { n: '02', t: 'Criamos a prévia', d: 'Você recebe uma demonstração real do site, sem compromisso.' },
  { n: '03', t: 'Ajustamos juntos', d: 'Refinamos textos, imagens, domínio e detalhes com você.' },
  { n: '04', t: 'Publicamos e cuidamos', d: 'Colocamos no ar e mantemos com um plano mensal.' },
];

const planos = [
  {
    nome: 'Implantação',
    preco: 'Sob consulta',
    periodo: 'pagamento único',
    features: ['Criação do site', 'Domínio e configuração', 'Formulário e WhatsApp', 'Mapa e SEO básico', 'Publicação'],
    destaque: false,
  },
  {
    nome: 'Manutenção Essencial',
    preco: 'Sob consulta',
    periodo: 'por mês',
    features: ['Hospedagem e SSL', 'Backups automáticos', 'Pequenas alterações', 'Monitoramento', 'Suporte'],
    destaque: true,
  },
  {
    nome: 'Manutenção Plus',
    preco: 'Sob consulta',
    periodo: 'por mês',
    features: ['Tudo do Essencial', 'Atualizações prioritárias', 'Relatórios mensais', 'Segurança reforçada', 'Suporte estendido'],
    destaque: false,
  },
];
</script>

<template>
  <main>
    <!-- HERO -->
    <section class="hero">
      <div class="container">
        <p class="eyebrow reveal">Informatizou</p>
        <h1 class="h1 reveal">Sites profissionais.<br />Sem complicação.</h1>
        <p class="sub hero-sub reveal">
          Criação, hospedagem e manutenção do seu site — e você vê uma demonstração antes de decidir.
        </p>
        <div class="hero-actions reveal">
          <a :href="contato" class="btn">Pedir demonstração</a>
          <a href="#como-funciona" class="link-blue">Como funciona <span class="chev">›</span></a>
        </div>
      </div>

      <!-- Mockup do produto (o site que entregamos) -->
      <div class="hero-stage reveal">
        <div class="mock" data-parallax="0.04" aria-hidden="true">
          <div class="mock-bar">
            <span class="dot" /><span class="dot" /><span class="dot" />
            <span class="mock-url">seunegocio.com.br</span>
          </div>
          <div class="mock-body">
            <div class="mock-band">
              <div class="mock-band-title" />
              <div class="mock-band-text" />
              <div class="mock-band-btn" />
            </div>
            <div class="mock-row">
              <div class="mock-tile" />
              <div class="mock-tile" />
              <div class="mock-tile" />
            </div>
            <div class="mock-lines">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- BENTO / SERVIÇOS -->
    <section id="servicos" class="section">
      <div class="container container-wide">
        <div class="section-head reveal">
          <h2 class="h2">Tudo que seu site precisa. Cuidamos de tudo.</h2>
          <p class="sub">Você foca no seu negócio. A parte técnica é com a gente.</p>
        </div>

        <div class="bento">
          <article class="tile tile-dark tile-wide reveal">
            <div class="tile-text">
              <h3 class="h3">Um site com a cara do seu negócio</h3>
              <p class="tile-sub">Design profissional, rápido e responsável — feito sob medida, sem parecer um template.</p>
              <a :href="contato" class="link-blue on-dark">Ver demonstração <span class="chev">›</span></a>
            </div>
            <div class="tile-art art-window" aria-hidden="true"><span /><span /><span /></div>
          </article>

          <article class="tile reveal">
            <div class="tile-text">
              <h3 class="h3">Hospedagem gerenciada</h3>
              <p class="tile-sub">SSL, backups automáticos e monitoramento. Sempre no ar.</p>
            </div>
            <div class="tile-art art-shield" aria-hidden="true"><span /></div>
          </article>

          <article class="tile reveal">
            <div class="tile-text">
              <h3 class="h3">Manutenção mensal</h3>
              <p class="tile-sub">Atualizações, alterações e suporte. Seu site sempre em dia.</p>
            </div>
            <div class="tile-art art-orbit" aria-hidden="true"><span /><span /></div>
          </article>

          <article class="tile tile-alt tile-wide reveal">
            <div class="tile-text">
              <h3 class="h3">Feito para converter</h3>
              <p class="tile-sub">Contato, WhatsApp e mapa — caminhos claros para transformar visitas em clientes.</p>
              <a :href="contato" class="link-blue">Fale com a gente <span class="chev">›</span></a>
            </div>
            <div class="tile-art art-chat" aria-hidden="true"><span /><span /></div>
          </article>
        </div>
      </div>
    </section>

    <!-- COMO FUNCIONA -->
    <section id="como-funciona" class="section section-alt">
      <div class="container">
        <div class="section-head center reveal">
          <p class="eyebrow">Como funciona</p>
          <h2 class="h2">Do primeiro olhar ao site no ar.</h2>
          <p class="sub">Quatro passos simples. Sem enrolação.</p>
        </div>
        <ol class="steps">
          <li v-for="p in passos" :key="p.n" class="step reveal">
            <span class="step-n">{{ p.n }}</span>
            <h3 class="step-t">{{ p.t }}</h3>
            <p class="step-d">{{ p.d }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- PLANOS -->
    <section id="planos" class="section">
      <div class="container">
        <div class="section-head center reveal">
          <p class="eyebrow">Planos</p>
          <h2 class="h2">Simples e transparente.</h2>
          <p class="sub">Implantação única e manutenção mensal opcional. Cancele quando quiser.</p>
        </div>
        <div class="plans">
          <article
            v-for="p in planos"
            :key="p.nome"
            class="plan reveal"
            :class="{ 'plan-featured': p.destaque }"
          >
            <span v-if="p.destaque" class="plan-tag">Recomendado</span>
            <h3 class="plan-name">{{ p.nome }}</h3>
            <div class="plan-price">
              <span class="plan-amount">{{ p.preco }}</span>
              <span class="plan-period">{{ p.periodo }}</span>
            </div>
            <ul class="plan-feats">
              <li v-for="f in p.features" :key="f"><span class="check">✓</span>{{ f }}</li>
            </ul>
            <a :href="contato" class="btn plan-cta" :class="{ 'btn-ghost': !p.destaque }">Fale conosco</a>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta section section-alt">
      <div class="container center">
        <h2 class="h2 reveal">Veja seu site antes de decidir.</h2>
        <p class="sub reveal" style="margin-top: 0.8rem">Peça uma demonstração gratuita, sem compromisso.</p>
        <div class="reveal" style="margin-top: 2rem">
          <a :href="contato" class="btn cta-btn">Pedir demonstração</a>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.center {
  text-align: center;
}

/* -- HERO ------------------------------------------------------------------ */
.hero {
  padding: clamp(4.5rem, 12vh, 8rem) 0 0;
  text-align: center;
  overflow: hidden;
}
.hero .h1 {
  margin-top: 0.4rem;
}
.hero-sub {
  max-width: 40ch;
  margin: 1.4rem auto 0;
}
.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 3vw, 1.8rem);
  margin-top: 2.2rem;
}

.hero-stage {
  margin-top: clamp(3rem, 7vh, 5rem);
  display: flex;
  justify-content: center;
  padding: 0 var(--edge);
}
.mock {
  width: min(920px, 100%);
  border-radius: 18px;
  background: #fff;
  box-shadow: var(--shadow-lift);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  will-change: transform;
}
.mock-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 44px;
  padding: 0 1rem;
  background: #f5f5f7;
  border-bottom: 1px solid var(--hair);
}
.mock-bar .dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #d5d5da;
}
.mock-url {
  margin: 0 auto;
  padding: 0.28rem 1.2rem;
  min-width: 40%;
  background: #fff;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--ink-3);
  border: 1px solid var(--hair);
}
.mock-body {
  padding: clamp(1.4rem, 3vw, 2.4rem);
  text-align: left;
}
.mock-band {
  border-radius: 14px;
  padding: clamp(1.6rem, 4vw, 2.6rem);
  background: linear-gradient(135deg, #0071e3, #42a5f5);
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.mock-band-title {
  width: 55%;
  height: 18px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
}
.mock-band-text {
  width: 78%;
  height: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.55);
}
.mock-band-btn {
  margin-top: 0.4rem;
  width: 120px;
  height: 30px;
  border-radius: 980px;
  background: #fff;
}
.mock-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.9rem;
  margin-top: 1.1rem;
}
.mock-tile {
  height: clamp(70px, 10vw, 110px);
  border-radius: 12px;
  background: #f0f0f3;
}
.mock-lines {
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.mock-lines span {
  height: 9px;
  border-radius: 5px;
  background: #ececef;
}
.mock-lines span:nth-child(1) {
  width: 90%;
}
.mock-lines span:nth-child(2) {
  width: 96%;
}
.mock-lines span:nth-child(3) {
  width: 60%;
}

/* -- Seção: cabeçalho ------------------------------------------------------ */
.section-head {
  margin-bottom: clamp(2.5rem, 6vh, 4rem);
}
.section-head .sub {
  margin-top: 0.8rem;
}
.section-head.center {
  text-align: center;
  max-width: 40ch;
  margin-left: auto;
  margin-right: auto;
}
.section-head.center .sub {
  margin-left: auto;
  margin-right: auto;
}

/* -- Bento ----------------------------------------------------------------- */
.bento {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.9rem, 1.6vw, 1.4rem);
}
.tile {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-card);
  background: var(--bg-alt);
  padding: clamp(1.8rem, 3vw, 2.6rem);
  min-height: 260px;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.4s var(--ease),
    box-shadow 0.4s var(--ease);
}
.tile:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-soft);
}
.tile-wide {
  grid-column: 1 / -1;
  min-height: 300px;
}
.tile-dark {
  background: var(--dark-2);
  color: var(--on-dark);
}
.tile-alt {
  background: #eef1f6;
}
.tile-text {
  max-width: 42ch;
  position: relative;
  z-index: 2;
}
.tile-sub {
  margin: 0.7rem 0 1.1rem;
  color: var(--ink-2);
  font-size: 1.0625rem;
  line-height: 1.45;
}
.tile-dark .tile-sub {
  color: var(--on-dark-2);
}
.link-blue.on-dark {
  color: var(--link-on-dark);
}

/* Arte abstrata dos tiles */
.tile-art {
  position: absolute;
  pointer-events: none;
}
.art-window {
  right: -40px;
  bottom: -30px;
  width: 260px;
  height: 180px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  transform: rotate(-6deg);
}
.art-window span {
  height: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.14);
}
.art-window span:nth-child(1) {
  width: 60%;
  background: var(--link-on-dark);
  opacity: 0.6;
}
.art-window span:nth-child(2) {
  width: 85%;
}
.art-window span:nth-child(3) {
  width: 45%;
}
.art-shield {
  right: 1.5rem;
  bottom: 1.5rem;
  width: 92px;
  height: 92px;
  border-radius: 26px;
  background: linear-gradient(160deg, #34c759, #30b350);
  display: grid;
  place-items: center;
  box-shadow: 0 10px 24px rgba(52, 199, 89, 0.28);
}
.art-shield span {
  width: 34px;
  height: 18px;
  border-left: 5px solid #fff;
  border-bottom: 5px solid #fff;
  transform: rotate(-45deg) translateY(-4px);
  border-radius: 2px;
}
.art-orbit {
  right: 1.2rem;
  bottom: 1.2rem;
  width: 100px;
  height: 100px;
}
.art-orbit span {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(0, 113, 227, 0.25);
}
.art-orbit span:nth-child(2) {
  inset: 22px;
  border-color: rgba(0, 113, 227, 0.45);
  background: radial-gradient(circle, rgba(0, 113, 227, 0.15), transparent 70%);
}
.art-chat {
  right: -20px;
  bottom: -18px;
  display: flex;
  gap: 12px;
}
.art-chat span {
  width: 96px;
  height: 62px;
  border-radius: 20px 20px 20px 4px;
  background: #fff;
  box-shadow: var(--shadow-soft);
}
.art-chat span:nth-child(2) {
  background: var(--blue);
  border-radius: 20px 20px 4px 20px;
  transform: translateY(26px);
}

/* -- Como funciona / passos ----------------------------------------------- */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: clamp(1.4rem, 3vw, 2.4rem);
}
.step-n {
  font-size: 2rem;
  font-weight: 600;
  color: var(--blue);
  letter-spacing: -0.02em;
}
.step-t {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0.7rem 0 0.4rem;
}
.step-d {
  margin: 0;
  color: var(--ink-2);
  font-size: 1rem;
  line-height: 1.5;
}

/* -- Planos ---------------------------------------------------------------- */
.plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(1rem, 2vw, 1.6rem);
  align-items: start;
}
.plan {
  position: relative;
  background: #fff;
  border: 1px solid var(--hair);
  border-radius: var(--radius-card);
  padding: clamp(1.8rem, 3vw, 2.4rem);
}
.plan-featured {
  border-color: transparent;
  box-shadow: var(--shadow-lift);
  transform: translateY(-6px);
}
.plan-tag {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--blue);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.28rem 0.85rem;
  border-radius: 980px;
}
.plan-name {
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
}
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0.7rem 0 1.4rem;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid var(--hair);
}
.plan-amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
}
.plan-period {
  font-size: 0.9rem;
  color: var(--ink-3);
}
.plan-feats {
  list-style: none;
  margin: 0 0 1.6rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.plan-feats li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  color: var(--ink);
}
.check {
  color: var(--blue);
  font-weight: 700;
}
.plan-cta {
  width: 100%;
}

/* -- CTA final ------------------------------------------------------------- */
.cta .h2 {
  max-width: 22ch;
  margin: 0 auto;
}
.cta-btn {
  padding: 0.85rem 1.8rem;
  font-size: 1.15rem;
}

/* -- Responsivo ------------------------------------------------------------ */
@media (max-width: 860px) {
  .steps {
    grid-template-columns: repeat(2, 1fr);
  }
  .plans {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
  }
  .plan-featured {
    transform: none;
  }
}
@media (max-width: 640px) {
  .bento {
    grid-template-columns: 1fr;
  }
  .tile-wide {
    grid-column: auto;
  }
  .steps {
    grid-template-columns: 1fr;
  }
  .hero-actions {
    flex-direction: column;
  }
}
</style>
