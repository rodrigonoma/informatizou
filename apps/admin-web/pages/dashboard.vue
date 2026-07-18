<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { useAuthStore, type PublicUser } from '~/stores/auth';

definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const config = useRuntimeConfig();
const router = useRouter();

// Valida o token contra /auth/me (redireciona ao login se inválido).
const { isLoading, isError } = useQuery({
  queryKey: ['me'],
  queryFn: () =>
    $fetch<PublicUser>('/auth/me', {
      baseURL: config.public.apiBase,
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      credentials: 'include',
    }),
});

watch(isError, (v) => {
  if (v) {
    auth.logout();
    router.push('/login');
  }
});

// Cartões placeholder do dashboard (métricas reais chegam nas fases seguintes).
const stats = [
  { label: 'Empresas encontradas', value: '—', hint: 'Fase 2' },
  { label: 'Leads qualificados', value: '—', hint: 'Fase 3' },
  { label: 'Demos publicadas', value: '—', hint: 'Fase 4' },
  { label: 'Propostas', value: '—', hint: 'Fase 6' },
];
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Visão geral</h1>
      <p class="mt-1 text-sm text-slate-500">
        Fundação (Fase 1) — autenticação, banco e provider fake ativos.
        <span v-if="isLoading" class="text-slate-400">carregando…</span>
      </p>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="s in stats"
          :key="s.label"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm text-slate-500">{{ s.label }}</p>
          <p class="mt-2 text-3xl font-semibold">{{ s.value }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ s.hint }}</p>
        </div>
      </div>

      <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-700">Status do sistema</h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-600">
          <li class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-500" /> API autenticada
          </li>
          <li class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-500" /> Banco de dados migrado e semeado
          </li>
          <li class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-500" /> Provider fake (20 empresas)
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>
