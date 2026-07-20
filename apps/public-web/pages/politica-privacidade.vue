<script setup lang="ts">
useHead({ title: 'Política de Privacidade — Informatizou' });
</script>

<template>
  <main class="doc">
    <div class="container">
      <NuxtLink to="/" class="link-blue back"><span class="chev">‹</span> Início</NuxtLink>
      <h1 class="h1 doc-title">Política de Privacidade</h1>
      <div class="doc-body">
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
          <a class="link-blue" href="mailto:contato@informatizou.com.br">contato@informatizou.com.br</a>.
        </p>
        <p class="doc-note">
          Este documento é um modelo inicial e será detalhado conforme a evolução do serviço.
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.doc {
  padding: clamp(3.5rem, 10vh, 6rem) 0 clamp(3rem, 8vh, 5rem);
}
.back {
  font-size: 1rem;
}
.doc-title {
  font-size: clamp(2.2rem, 5vw, 3.25rem);
  margin: 1.4rem 0 2rem;
}
.doc-body {
  max-width: 62ch;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
}
.doc-body p {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--ink-2);
}
.doc-body .link-blue {
  font-size: inherit;
}
.doc-note {
  font-size: 0.95rem !important;
  color: var(--ink-3) !important;
  margin-top: 0.6rem !important;
}
</style>
