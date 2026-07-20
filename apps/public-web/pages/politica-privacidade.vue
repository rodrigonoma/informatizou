<script setup lang="ts">
useHead({ title: 'Política de Privacidade — Informatizou' });
</script>

<template>
  <main class="doc os-scroll">
    <div class="doc-inner">
      <NuxtLink to="/" class="doc-back">‹ InformatizouOS</NuxtLink>
      <h1>Política de Privacidade</h1>
      <p>
        A Informatizou respeita a sua privacidade. Coletamos apenas informações necessárias para
        prestar nossos serviços de criação, hospedagem e manutenção de sites.
      </p>
      <p>
        Os dados de contato fornecidos são utilizados exclusivamente para comunicação comercial e
        prestação de serviço, e nunca são vendidos a terceiros.
      </p>
      <p>
        Você pode, a qualquer momento, solicitar a remoção dos seus dados ou o encerramento de
        contatos enviando uma mensagem para
        <a href="mailto:contato@informatizou.com.br">contato@informatizou.com.br</a>.
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
