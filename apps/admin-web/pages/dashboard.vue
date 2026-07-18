<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const router = useRouter();
const api = useApi();

interface Stats {
  businessesFound: number;
  withoutWebsite: number;
  leadsQualified: number;
  demosPublished: number;
  demosExpiring: number;
  contactsPending: number;
  contactsSent: number;
  interested: number;
  proposals: number;
  sales: number;
  implementationRevenueCents: number;
  monthlyRevenueCents: number;
  providerCostCents: number;
}

const { data: stats, isError } = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => api<Stats>('/stats/dashboard'),
  refetchInterval: 5000,
});

watch(isError, (v) => {
  if (v) {
    auth.logout();
    router.push('/login');
  }
});

function brl(cents = 0): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const cards = computed(() => [
  { label: 'Empresas encontradas', value: stats.value?.businessesFound ?? 0 },
  { label: 'Sem site', value: stats.value?.withoutWebsite ?? 0 },
  { label: 'Leads qualificados', value: stats.value?.leadsQualified ?? 0 },
  { label: 'Demos publicadas', value: stats.value?.demosPublished ?? 0 },
  { label: 'Demos expirando (3d)', value: stats.value?.demosExpiring ?? 0 },
  { label: 'Contatos pendentes', value: stats.value?.contactsPending ?? 0 },
  { label: 'Interessados', value: stats.value?.interested ?? 0 },
  { label: 'Vendas', value: stats.value?.sales ?? 0 },
]);
const money = computed(() => [
  { label: 'Receita implantação', value: brl(stats.value?.implementationRevenueCents) },
  { label: 'Receita mensal', value: brl(stats.value?.monthlyRevenueCents) },
  { label: 'Custo de provedores', value: brl(stats.value?.providerCostCents) },
]);
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Visão geral</h1>
      <p class="mt-1 text-sm text-slate-500">Métricas em tempo real do funil de prospecção.</p>

      <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="c in cards" :key="c.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">{{ c.label }}</p>
          <p class="mt-2 text-3xl font-semibold">{{ c.value }}</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="m in money" :key="m.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">{{ m.label }}</p>
          <p class="mt-2 text-2xl font-semibold">{{ m.value }}</p>
        </div>
      </div>

      <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-700">Status do sistema</h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-600">
          <li class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-500" /> Pipeline autônomo ativo (pesquisa → qualificação → demo → prospecção → vendas)</li>
          <li class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-500" /> Compliance por código (noindex, opt-out, SSRF, auditoria)</li>
        </ul>
      </div>
    </main>
  </div>
</template>
