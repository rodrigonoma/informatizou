<script setup lang="ts">
import { ROBOTS_DIRECTIVE, DEMO_UNAVAILABLE } from '~/utils/demo-notices';

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ''));

// Reforço explícito de noindex por página (§20).
useHead({
  title: 'Demonstração indisponível · Informatizou',
  meta: [{ name: 'robots', content: ROBOTS_DIRECTIVE }],
});

// Fase 1: ainda não há demonstrações publicadas; toda slug cai na página de
// indisponível (§21). Na Fase 4, buscaremos a demo por slug na API e, quando
// PUBLISHED e não expirada, renderizaremos o template com os avisos (§19).
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
      I
    </div>
    <h1 class="mt-6 max-w-lg text-2xl font-semibold tracking-tight">
      {{ DEMO_UNAVAILABLE.title }}
    </h1>
    <p class="mt-3 max-w-md text-slate-500">{{ DEMO_UNAVAILABLE.body }}</p>
    <p class="mt-4 font-medium text-slate-700">{{ DEMO_UNAVAILABLE.question }}</p>
    <a
      href="https://www.informatizou.com.br"
      class="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      {{ DEMO_UNAVAILABLE.cta }}
    </a>
    <p class="mt-8 text-xs text-slate-300">ref: {{ slug }}</p>
  </main>
</template>
