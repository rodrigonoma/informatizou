<script setup lang="ts">
// Shell global (Apple HIG): barra de navegação em vidro fosco + rodapé.
useMotionSystem();

const contato = 'mailto:contato@informatizou.com.br';
const links = [
  { label: 'Serviços', to: '/#servicos' },
  { label: 'Como funciona', to: '/#como-funciona' },
  { label: 'Planos', to: '/#planos' },
];
const ano = 2026;
</script>

<template>
  <div class="shell">
    <header class="nav">
      <div class="nav-inner container container-wide">
        <NuxtLink to="/" class="brand" aria-label="Informatizou — início">Informatizou</NuxtLink>
        <nav class="nav-links" aria-label="Principal">
          <a v-for="l in links" :key="l.to" :href="l.to" class="nav-link">{{ l.label }}</a>
        </nav>
        <a :href="contato" class="btn nav-cta">Fale conosco</a>
      </div>
    </header>

    <NuxtPage />

    <footer class="foot">
      <div class="container container-wide">
        <p class="foot-note">
          Informatizou — criação, hospedagem e manutenção de sites profissionais para o seu negócio.
          As demonstrações apresentadas são propostas visuais e não representam o site oficial até a
          contratação e publicação.
        </p>
        <div class="foot-bar">
          <span class="foot-copy">Copyright © {{ ano }} Informatizou. Todos os direitos reservados.</span>
          <nav class="foot-links" aria-label="Rodapé">
            <NuxtLink to="/politica-privacidade">Política de Privacidade</NuxtLink>
            <span class="foot-sep" aria-hidden="true">|</span>
            <NuxtLink to="/termos">Termos</NuxtLink>
            <span class="foot-sep" aria-hidden="true">|</span>
            <a :href="contato">Contato</a>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* -- Barra em vidro fosco -------------------------------------------------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: var(--nav-h);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid transparent;
  transition:
    background 0.3s var(--ease),
    border-color 0.3s var(--ease);
}
.nav.is-scrolled {
  background: rgba(255, 255, 255, 0.82);
  border-bottom-color: var(--hair);
}
.nav-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.brand {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.4rem);
  margin: 0 auto;
}
.nav-link {
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(29, 29, 31, 0.8);
  transition: color 0.2s var(--ease);
}
.nav-link:hover {
  color: var(--ink);
}
.nav-cta {
  padding: 0.42rem 1rem;
  font-size: 0.9rem;
}

@media (max-width: 720px) {
  .nav-links {
    display: none;
  }
  .brand {
    margin-right: auto;
  }
}

/* -- Rodapé --------------------------------------------------------------- */
.foot {
  margin-top: auto;
  background: var(--bg-alt);
  color: var(--ink-3);
  padding: 2.5rem 0 3rem;
  font-size: 0.75rem;
  line-height: 1.5;
}
.foot-note {
  margin: 0 0 1.4rem;
  max-width: 70ch;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid var(--hair);
}
.foot-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.foot-links {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.foot-links a {
  color: var(--ink-3);
  transition: color 0.2s var(--ease);
}
.foot-links a:hover {
  color: var(--ink);
  text-decoration: underline;
}
.foot-sep {
  color: rgba(0, 0, 0, 0.18);
}
</style>
