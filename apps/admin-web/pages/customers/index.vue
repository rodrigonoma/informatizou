<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subscriptions: { status: string; priceCents: number }[];
  sites: { status: string | null }[];
}

const api = useApi();
const { data, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: () => api<{ items: Customer[] }>('/customers'),
  refetchInterval: 6000,
});

function brl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Clientes</h1>
      <p class="mt-1 text-sm text-slate-500">Convertidos a partir de propostas aceitas (§33).</p>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-if="isLoading" class="text-slate-400">Carregando…</div>
        <div v-else-if="!data?.items.length" class="text-slate-400">Nenhum cliente ainda.</div>
        <div v-for="c in data?.items" :key="c.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="font-semibold">{{ c.name }}</h3>
          <p class="mt-1 text-xs text-slate-500">{{ c.email ?? c.phone ?? '—' }}</p>
          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span class="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">{{ c.sites.length }} site(s)</span>
            <span v-for="(s, i) in c.subscriptions" :key="i" class="rounded bg-brand-50 px-2 py-0.5 text-brand-700">
              {{ s.status }} · {{ brl(s.priceCents) }}/mês
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
