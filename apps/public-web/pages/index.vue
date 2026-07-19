<script setup lang="ts">
// Página institucional — cenas (não seções) do Informatizou Motion System.
const contato = 'mailto:contato@informatizou.com.br?subject=Quero%20uma%20demonstração';

const processo = [
  {
    n: '01',
    t: 'Leitura',
    d: 'Estudamos seu negócio a partir de informações públicas. Nada de formulários intermináveis — começamos entendendo você.',
  },
  {
    n: '02',
    t: 'Demonstração',
    d: 'Você recebe uma prévia real da sua presença digital. Sem compromisso, sem custo, sem promessas vazias.',
  },
  {
    n: '03',
    t: 'Refino',
    d: 'Ajustamos textos, imagens, domínio e cada detalhe junto com você, até ficar exatamente com a sua cara.',
  },
  {
    n: '04',
    t: 'Vida',
    d: 'Publicamos e cuidamos: hospedagem segura, backups, monitoramento e evolução contínua, mês a mês.',
  },
];

const capacidades = [
  { k: 'Criação', d: 'Presença sob medida — rápida, acessível e impossível de confundir com um template.' },
  { k: 'Hospedagem', d: 'Infraestrutura própria com SSL, backups automáticos e monitoramento contínuo.' },
  { k: 'Manutenção', d: 'Evolução mensal: alterações, suporte próximo e relatórios claros.' },
  { k: 'Conversão', d: 'Contato, WhatsApp e caminhos pensados para transformar visita em cliente.' },
];
</script>

<template>
  <main>
    <!-- CENA 01 — ABERTURA / SINAL -->
    <section class="scene open">
      <span class="scene-tag hud">01 — abertura</span>

      <div class="open-inner">
        <p class="kicker hud reveal">◦ presença digital viva</p>

        <h1 class="statement breathe">
          <span class="mask-line" style="transition-delay: 0.05s"><span>Não fazemos</span></span>
          <span class="mask-line" style="transition-delay: 0.14s"><span>sites.</span></span>
          <span class="mask-line offset" style="transition-delay: 0.32s"><span>Construímos</span></span>
          <span class="mask-line offset" style="transition-delay: 0.42s"
            ><span class="sig">presença.</span></span
          >
        </h1>

        <p class="lede hud reveal" style="transition-delay: 0.6s">
          criação · hospedagem · manutenção — tratadas como experiência, não como produto.
        </p>
      </div>

      <a href="#manifesto" class="scroll-hint" data-cursor aria-label="Rolar para o manifesto">
        <span class="hud">role</span>
        <span class="hint-line"><i /></span>
      </a>
    </section>

    <!-- CENA 02 — MANIFESTO -->
    <section id="manifesto" class="scene manifesto">
      <span class="scene-tag hud">02 — manifesto</span>
      <div class="mani-stack">
        <p class="mani-line reveal">Cada negócio é único.</p>
        <p class="mani-line reveal right" style="transition-delay: 0.08s">
          Sua presença digital também deveria ser.
        </p>
        <p class="mani-line reveal" style="transition-delay: 0.16s" data-parallax="0.05">
          Nada de páginas iguais. <em class="sig">Nada de templates.</em>
        </p>
        <p class="mani-line small reveal right" style="transition-delay: 0.24s">
          Um ambiente vivo, feito sob medida — que faz quem chega parar e pensar:
          <em class="sig">nunca vi algo assim.</em>
        </p>
      </div>
    </section>

    <!-- CENA 03 — PROCESSO (índice vivo) -->
    <section class="scene processo">
      <span class="scene-tag hud">03 — processo</span>
      <p class="proc-intro hud reveal">quatro movimentos, do primeiro olhar ao site no ar</p>
      <div class="proc-list">
        <article v-for="p in processo" :key="p.n" class="proc-row reveal">
          <span class="proc-n" data-parallax="0.06">{{ p.n }}</span>
          <h3 class="proc-t">{{ p.t }}</h3>
          <p class="proc-d">{{ p.d }}</p>
        </article>
      </div>
    </section>

    <!-- CENA 04 — CAPACIDADES (índice interativo) -->
    <section class="scene capacidades">
      <span class="scene-tag hud">04 — capacidades</span>
      <ul class="cap-list">
        <li
          v-for="(c, i) in capacidades"
          :key="c.k"
          class="cap-row reveal"
          :style="{ transitionDelay: i * 0.06 + 's' }"
        >
          <a :href="contato" class="cap-link" data-cursor>
            <span class="cap-idx hud">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="cap-k">{{ c.k }}</span>
            <span class="cap-d">{{ c.d }}</span>
            <span class="cap-arr">→</span>
          </a>
        </li>
      </ul>
    </section>

    <!-- CENA 05 — FECHAMENTO / GESTO -->
    <section class="scene fechamento">
      <span class="scene-tag hud">05 — próximo passo</span>
      <div class="fech-inner">
        <p class="kicker hud reveal">◦ comece vendo, não decidindo</p>
        <h2 class="fech-title">
          <span class="mask-line"><span>Veja sua <em class="sig">presença</em></span></span>
          <span class="mask-line" style="transition-delay: 0.12s"><span>antes de decidir.</span></span>
        </h2>
        <a
          :href="contato"
          class="fech-cta reveal"
          data-magnetic
          data-magnetic-strength="0.25"
          style="transition-delay: 0.3s"
        >
          <span>Pedir demonstração</span>
          <span class="fech-arr">→</span>
        </a>
      </div>

      <!-- Rodapé HUD (não é footer tradicional) -->
      <footer class="hud-foot reveal">
        <span class="hud">Informatizou · 2026</span>
        <nav class="foot-nav">
          <NuxtLink to="/politica-privacidade" class="hud" data-cursor>política de privacidade</NuxtLink>
          <NuxtLink to="/termos" class="hud" data-cursor>termos</NuxtLink>
        </nav>
        <span class="hud dim">feito com intenção</span>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.scene {
  position: relative;
  padding: clamp(6rem, 14vh, 12rem) var(--edge);
  z-index: 2;
}
.scene-tag {
  position: absolute;
  top: clamp(1.6rem, 5vh, 3rem);
  right: var(--edge);
  color: var(--ink-faint);
}

.kicker {
  color: var(--signal);
  margin: 0 0 clamp(1.4rem, 4vh, 2.6rem);
}
.sig {
  color: var(--signal);
  font-style: italic;
}

/* -- Cena 01 -------------------------------------------------------------- */
.open {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.open-inner {
  max-width: 100%;
}
.statement {
  font-size: clamp(2.6rem, 10.5vw, 9.5rem);
  font-weight: 250;
  line-height: 0.94;
  letter-spacing: -0.045em;
  margin: 0;
}
.statement .sig {
  font-weight: 400;
}
.statement .offset:first-of-type {
  margin-top: clamp(0.6rem, 2vw, 1.6rem);
}
.statement .offset {
  padding-left: clamp(0px, 6vw, 6vw);
}
.lede {
  margin: clamp(2.4rem, 6vh, 4rem) 0 0;
  max-width: 46ch;
  letter-spacing: 0.14em;
  line-height: 1.9;
}

.scroll-hint {
  position: absolute;
  bottom: clamp(1.6rem, 5vh, 3rem);
  left: var(--edge);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}
.hint-line {
  display: block;
  width: 1px;
  height: 54px;
  background: var(--ink-ghost);
  overflow: hidden;
  position: relative;
}
.hint-line i {
  position: absolute;
  inset: 0;
  background: var(--signal);
  animation: scroll-hint 2.6s var(--ease-out) infinite;
}

/* -- Cena 02 -------------------------------------------------------------- */
.manifesto {
  min-height: 100vh;
  display: flex;
  align-items: center;
}
.mani-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(1.4rem, 5vh, 3.4rem);
}
.mani-line {
  font-size: clamp(1.9rem, 6vw, 5rem);
  font-weight: 300;
  line-height: 1.02;
  letter-spacing: -0.03em;
  max-width: 20ch;
  margin: 0;
}
.mani-line.small {
  font-size: clamp(1.3rem, 3.4vw, 2.6rem);
  font-weight: 300;
  line-height: 1.3;
  max-width: 30ch;
  color: var(--ink-dim);
}
.mani-line.right {
  align-self: flex-end;
  text-align: right;
}

/* -- Cena 03 -------------------------------------------------------------- */
.proc-intro {
  color: var(--ink-faint);
  margin: 0 0 clamp(3rem, 8vh, 6rem);
}
.proc-list {
  border-top: 1px solid var(--line);
}
.proc-row {
  display: grid;
  grid-template-columns: clamp(4rem, 12vw, 11rem) minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(1rem, 4vw, 3rem);
  align-items: baseline;
  padding: clamp(2rem, 6vh, 4rem) 0;
  border-bottom: 1px solid var(--line);
}
.proc-n {
  font-family: var(--font-mono);
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  color: var(--signal);
  will-change: transform;
}
.proc-t {
  font-size: clamp(1.8rem, 4.6vw, 3.6rem);
  font-weight: 300;
  letter-spacing: -0.03em;
  margin: 0;
}
.proc-d {
  font-size: clamp(0.98rem, 1.3vw, 1.15rem);
  line-height: 1.7;
  color: var(--ink-dim);
  margin: 0;
  max-width: 44ch;
}

/* -- Cena 04 -------------------------------------------------------------- */
.cap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line);
}
.cap-row {
  border-bottom: 1px solid var(--line);
}
.cap-link {
  display: grid;
  grid-template-columns: clamp(3rem, 6vw, 5rem) minmax(0, auto) minmax(0, 1fr) 2rem;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.4rem);
  padding: clamp(1.6rem, 4.5vh, 3rem) 0;
  transition: padding-left 0.6s var(--ease-spring);
}
.cap-idx {
  color: var(--ink-faint);
  transition: color 0.4s var(--ease-out);
}
.cap-k {
  font-size: clamp(2.2rem, 8vw, 6.5rem);
  font-weight: 300;
  letter-spacing: -0.04em;
  line-height: 1;
  transition: color 0.4s var(--ease-out);
}
.cap-d {
  font-size: clamp(0.95rem, 1.2vw, 1.1rem);
  line-height: 1.6;
  color: var(--ink-faint);
  opacity: 0.55;
  max-width: 40ch;
  transform: translateX(-8px);
  transition:
    opacity 0.5s var(--ease-out),
    transform 0.6s var(--ease-spring),
    color 0.4s var(--ease-out);
}
.cap-arr {
  justify-self: end;
  font-size: 1.3rem;
  color: var(--signal);
  opacity: 0;
  transform: translateX(-10px);
  transition:
    opacity 0.5s var(--ease-out),
    transform 0.6s var(--ease-spring);
}
.cap-link:hover {
  padding-left: clamp(0.6rem, 2vw, 2rem);
}
.cap-link:hover .cap-idx {
  color: var(--signal);
}
.cap-link:hover .cap-d {
  opacity: 1;
  color: var(--ink-dim);
  transform: translateX(0);
}
.cap-link:hover .cap-arr {
  opacity: 1;
  transform: translateX(0);
}

/* -- Cena 05 -------------------------------------------------------------- */
.fechamento {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.fech-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.fech-title {
  font-size: clamp(2.6rem, 10vw, 9.5rem);
  font-weight: 250;
  line-height: 0.94;
  letter-spacing: -0.045em;
  margin: 0;
}
.fech-title em {
  font-weight: 400;
}
.fech-cta {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  align-self: flex-start;
  margin-top: clamp(2.4rem, 6vh, 4rem);
  padding: 1.1rem 0;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink);
  border-bottom: 1px solid var(--signal);
  will-change: transform;
  transition:
    gap 0.5s var(--ease-spring),
    color 0.4s var(--ease-out);
}
.fech-cta:hover {
  gap: 1.6rem;
  color: var(--signal);
}
.fech-arr {
  color: var(--signal);
}

.hud-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: clamp(3rem, 8vh, 5rem);
  border-top: 1px solid var(--line);
}
.foot-nav {
  display: flex;
  gap: clamp(1rem, 3vw, 2.2rem);
}
.foot-nav a:hover {
  color: var(--signal);
}
.dim {
  color: var(--ink-faint);
}

@media (max-width: 760px) {
  .proc-row {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
  .cap-link {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'idx k'
      'd d';
    row-gap: 0.8rem;
  }
  .cap-idx {
    grid-area: idx;
  }
  .cap-k {
    grid-area: k;
  }
  .cap-d {
    grid-area: d;
    opacity: 0.7;
    transform: none;
  }
  .cap-arr {
    display: none;
  }
  .statement .offset {
    padding-left: 0;
  }
}
</style>
