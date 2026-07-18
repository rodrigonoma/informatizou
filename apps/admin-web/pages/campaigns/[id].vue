<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Execution {
  status: string;
  businessesFound: number;
  businessesProcessed: number;
  withWebsite: number;
  withoutWebsite: number;
  duplicatesRemoved: number;
}
interface Campaign {
  id: string;
  name: string;
  segment: string;
  location: string;
  status: string;
  provider: string;
  resultLimit: number;
  executions?: Execution[];
}
interface Business {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
}

const route = useRoute();
const id = String(route.params.id);
const api = useApi();
const qc = useQueryClient();

const { data: campaign } = useQuery({
  queryKey: ['campaign', id],
  queryFn: () => api<Campaign>(`/campaigns/${id}`),
  refetchInterval: 3000,
});

const { data: progress } = useQuery({
  queryKey: ['campaign-progress', id],
  queryFn: () => api<{ execution: Execution | null }>(`/campaigns/${id}/progress`),
  refetchInterval: 2000,
});

const { data: businesses } = useQuery({
  queryKey: ['campaign-businesses', id],
  queryFn: () => api<{ items: Business[]; total: number }>(`/businesses?campaignId=${id}&take=100`),
  refetchInterval: 3000,
});

const runMutation = useMutation({
  mutationFn: () => api(`/campaigns/${id}/run`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', id] }),
});

const exec = computed(() => progress.value?.execution ?? campaign.value?.executions?.[0] ?? null);
const canRun = computed(() =>
  ['DRAFT', 'COMPLETED', 'CANCELLED', 'FAILED', 'PAUSED'].includes(campaign.value?.status ?? ''),
);
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <NuxtLink to="/campaigns" class="text-sm text-brand-600 hover:underline">← Campanhas</NuxtLink>
      <div class="mt-3 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">{{ campaign?.name }}</h1>
          <p class="text-sm text-slate-500">
            {{ campaign?.segment }} · {{ campaign?.location }} ·
            <span class="font-medium">{{ campaign?.status }}</span>
          </p>
        </div>
        <button
          :disabled="!canRun || runMutation.isPending.value"
          class="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          @click="runMutation.mutate()"
        >
          {{ runMutation.isPending.value ? 'Enfileirando…' : 'Executar campanha' }}
        </button>
      </div>

      <!-- Progresso -->
      <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div v-for="stat in [
          { label: 'Encontradas', value: exec?.businessesFound ?? 0 },
          { label: 'Processadas', value: exec?.businessesProcessed ?? 0 },
          { label: 'Com site', value: exec?.withWebsite ?? 0 },
          { label: 'Sem site', value: exec?.withoutWebsite ?? 0 },
          { label: 'Duplicatas', value: exec?.duplicatesRemoved ?? 0 },
        ]" :key="stat.label" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs text-slate-500">{{ stat.label }}</p>
          <p class="mt-1 text-2xl font-semibold">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Empresas -->
      <h2 class="mt-8 text-sm font-semibold text-slate-700">
        Empresas ({{ businesses?.total ?? 0 }})
      </h2>
      <div class="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Empresa</th>
              <th class="px-5 py-3">Cidade</th>
              <th class="px-5 py-3">Nota</th>
              <th class="px-5 py-3">Avaliações</th>
              <th class="px-5 py-3">Site</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!businesses?.items.length">
              <td colspan="5" class="px-5 py-6 text-center text-slate-400">
                Nenhuma empresa ainda. Execute a campanha.
              </td>
            </tr>
            <tr v-for="b in businesses?.items" :key="b.id" class="border-b border-slate-100 last:border-0">
              <td class="px-5 py-3 font-medium">{{ b.name }}</td>
              <td class="px-5 py-3 text-slate-600">{{ b.city }}</td>
              <td class="px-5 py-3 text-slate-600">{{ b.rating ?? '—' }}</td>
              <td class="px-5 py-3 text-slate-600">{{ b.reviewCount ?? '—' }}</td>
              <td class="px-5 py-3">
                <span v-if="b.website" class="text-emerald-600">sim</span>
                <span v-else class="text-amber-600">sem site</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
