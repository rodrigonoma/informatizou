<script setup lang="ts">
useHead({ title: 'Termos de Uso — Informatizou' });
</script>

<template>
  <main class="doc scene">
    <span class="scene-tag hud">documento — termos</span>
    <NuxtLink to="/" class="back hud" data-cursor>← voltar</NuxtLink>
    <h1 class="doc-title reveal">Termos<br />de <em class="sig">Uso</em>.</h1>
    <div class="doc-body">
      <p class="reveal">
        Ao contratar os serviços da Informatizou, você concorda com os termos descritos nesta
        página, que regem a criação, hospedagem e manutenção de sites.
      </p>
      <p class="reveal">
        As demonstrações apresentadas são propostas visuais temporárias e não representam o site
        oficial do estabelecimento até a contratação e publicação formal.
      </p>
      <p class="reveal">
        Os planos de manutenção mensal são opcionais e podem ser ajustados ou cancelados conforme
        as condições acordadas.
      </p>
      <p class="note reveal">
        Este documento é um modelo inicial e será detalhado conforme a evolução do serviço.
      </p>
    </div>
  </main>
</template>

<style scoped>
.doc {
  min-height: 100vh;
  max-width: 62ch;
  margin: 0 auto;
  padding-top: clamp(7rem, 16vh, 12rem);
}
.scene-tag {
  position: absolute;
  top: clamp(1.6rem, 5vh, 3rem);
  right: var(--edge);
  color: var(--ink-faint);
}
.back {
  display: inline-block;
  margin-bottom: clamp(2rem, 6vh, 4rem);
  color: var(--ink-dim);
  transition: color 0.4s var(--ease-out);
}
.back:hover {
  color: var(--signal);
}
.doc-title {
  font-size: clamp(2.6rem, 9vw, 6rem);
  font-weight: 250;
  line-height: 0.94;
  letter-spacing: -0.04em;
  margin: 0 0 clamp(2.4rem, 7vh, 4.5rem);
}
.sig {
  color: var(--signal);
  font-style: italic;
  font-weight: 400;
}
.doc-body {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
.doc-body p {
  font-size: 1.08rem;
  line-height: 1.85;
  color: var(--ink-dim);
  margin: 0;
}
.note {
  font-family: var(--font-mono);
  font-size: 0.8rem !important;
  letter-spacing: 0.08em;
  color: var(--ink-faint) !important;
  line-height: 1.7 !important;
  margin-top: 1rem !important;
}
</style>
