<script setup lang="ts">
useHead({ title: 'Política de Privacidade — Informatizou' });
</script>

<template>
  <main class="doc-desk">
    <div class="doc bevel-out">
      <div class="doc-title">
        <span>Política de Privacidade — Bloco de Notas</span>
        <NuxtLink to="/" class="doc-x" aria-label="Voltar">✕</NuxtLink>
      </div>
      <div class="doc-body bevel-in os-scroll">
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
        <p><NuxtLink to="/" class="btn95 doc-back">‹ Voltar ao InformatizouOS</NuxtLink></p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.doc-desk {
  position: fixed;
  inset: 0;
  background: var(--w-teal);
  overflow: auto;
  padding: 5vh 16px;
}
.doc {
  max-width: 720px;
  margin: 0 auto;
  background: var(--w-face);
  padding: 3px;
}
.doc-title {
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3px 0 6px;
  background: linear-gradient(90deg, var(--w-navy), var(--w-blue));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.doc-x {
  width: 18px;
  height: 17px;
  display: grid;
  place-items: center;
  color: #000;
  text-decoration: none;
  font-size: 11px;
  background: var(--w-face);
  box-shadow:
    inset -1px -1px 0 var(--w-dark),
    inset 1px 1px 0 var(--w-hi),
    inset -2px -2px 0 var(--w-shadow),
    inset 2px 2px 0 var(--w-light);
}
.doc-body {
  margin-top: 2px;
  padding: 22px 26px 26px;
  background: #fff;
}
.doc-body h1 {
  font-size: 1.6rem;
  margin: 0 0 1.2rem;
}
.doc-body p {
  font-size: 14px;
  line-height: 1.6;
  color: #000;
  margin: 0 0 1rem;
}
.doc-body a {
  color: #0000cc;
}
.doc-note {
  color: #555 !important;
  font-size: 12px !important;
}
.doc-back {
  display: inline-block;
  text-decoration: none;
  color: #000;
  font-weight: 700;
}
</style>
