<script setup lang="ts">
useHead({ title: 'Termos de Uso — Informatizou' });
</script>

<template>
  <main class="doc os-scroll">
    <div class="doc-inner">
      <NuxtLink to="/" class="doc-back">‹ InformatizouOS</NuxtLink>
      <h1>Termos de Uso</h1>
      <p>
        Ao contratar os serviços da Informatizou, você concorda com os termos descritos nesta
        página, que regem a criação, hospedagem e manutenção de sites.
      </p>
      <p>
        As demonstrações apresentadas são propostas visuais temporárias e não representam o site
        oficial do estabelecimento até a contratação e publicação formal.
      </p>
      <p>
        Os planos de manutenção mensal são opcionais e podem ser ajustados ou cancelados conforme
        as condições acordadas.
      </p>
      <p class="doc-note">
        Este documento é um modelo inicial e será detalhado conforme a evolução do serviço.
      </p>
    </div>
  </main>
</template>

<style scoped>
.doc {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  background: linear-gradient(160deg, var(--desk-2), var(--desk-1));
  color: #e9e9ef;
}
.doc-inner {
  max-width: 64ch;
  margin: 0 auto;
  padding: clamp(3.5rem, 12vh, 7rem) 1.5rem 4rem;
}
.doc-back {
  display: inline-block;
  margin-bottom: 2rem;
  color: var(--n-blue);
  font-size: 0.95rem;
}
.doc h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 1.6rem;
}
.doc p {
  font-size: 1.08rem;
  line-height: 1.7;
  color: #b9b9c4;
  margin: 0 0 1.2rem;
}
.doc a {
  color: var(--n-blue);
}
.doc-note {
  font-size: 0.9rem !important;
  color: #7a7a86 !important;
  margin-top: 1.4rem !important;
}
</style>
