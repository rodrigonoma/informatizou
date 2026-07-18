<script setup lang="ts">
// Página genérica da Informatizou na raiz do subdomínio de demos (§20).
useHead({ title: 'Informatizou · Demonstrações' });
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
      I
    </div>
    <h1 class="mt-6 text-2xl font-semibold tracking-tight">Informatizou</h1>
    <p class="mt-2 max-w-md text-slate-500">
      Este endereço hospeda demonstrações de sites criadas pela Informatizou. Acesse o link
      recebido para visualizar a sua demonstração.
    </p>
    <a
      href="https://www.informatizou.com.br"
      class="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      Conhecer a Informatizou
    </a>
  </main>
</template>
