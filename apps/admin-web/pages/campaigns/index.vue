<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Campaign {
  id: string;
  name: string;
  segment: string;
  location: string;
  status: string;
  provider: string;
  createdAt: string;
}

const api = useApi();
const qc = useQueryClient();

const { data, isLoading } = useQuery({
  queryKey: ['campaigns'],
  queryFn: () => api<{ items: Campaign[]; total: number }>('/campaigns'),
});

const form = reactive({
  name: '',
  segment: '',
  location: '',
  resultLimit: 100,
  provider: 'fake',
});
const error = ref<string | null>(null);

const createMutation = useMutation({
  mutationFn: () =>
    api<Campaign>('/campaigns', { method: 'POST', body: { ...form } }),
  onSuccess: () => {
    form.name = '';
    form.segment = '';
    form.location = '';
    qc.invalidateQueries({ queryKey: ['campaigns'] });
  },
  onError: () => {
    error.value = 'Não foi possível criar a campanha.';
  },
});

const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  QUEUED: 'bg-amber-100 text-amber-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-500',
  FAILED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-orange-100 text-orange-700',
};
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Campanhas</h1>
      <p class="mt-1 text-sm text-slate-500">Pesquise empresas por segmento e localização.</p>

      <!-- Nova campanha -->
      <form
        class="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-5"
        @submit.prevent="createMutation.mutate()"
      >
        <input v-model="form.name" required placeholder="Nome" class="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="form.segment" required placeholder="Segmento (ex.: padarias)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="form.location" required placeholder="Local (ex.: Ribeirão Preto, SP)" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button
          type="submit"
          :disabled="createMutation.isPending.value"
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {{ createMutation.isPending.value ? 'Criando…' : 'Criar campanha' }}
        </button>
      </form>
      <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>

      <!-- Lista -->
      <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Nome</th>
              <th class="px-5 py-3">Segmento</th>
              <th class="px-5 py-3">Local</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="px-5 py-6 text-center text-slate-400">Carregando…</td>
            </tr>
            <tr v-else-if="!data?.items.length">
              <td colspan="5" class="px-5 py-6 text-center text-slate-400">Nenhuma campanha ainda.</td>
            </tr>
            <tr v-for="c in data?.items" :key="c.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td class="px-5 py-3 font-medium">{{ c.name }}</td>
              <td class="px-5 py-3 text-slate-600">{{ c.segment }}</td>
              <td class="px-5 py-3 text-slate-600">{{ c.location }}</td>
              <td class="px-5 py-3">
                <span :class="['rounded px-2 py-0.5 text-xs font-medium', statusColor[c.status] ?? 'bg-slate-100']">
                  {{ c.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <NuxtLink :to="`/campaigns/${c.id}`" class="text-sm font-medium text-brand-600 hover:underline">
                  Abrir
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
