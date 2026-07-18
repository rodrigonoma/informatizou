<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Lead {
  id: string;
  status: string;
  scoreTotal: number | null;
  scoreCategory: string | null;
  websiteStatus: string | null;
  business: { name: string; city: string | null; website: string | null };
}

const api = useApi();
const qc = useQueryClient();
const statusFilter = ref('');

const { data, isLoading } = useQuery({
  queryKey: ['leads', statusFilter],
  queryFn: () =>
    api<{ items: Lead[]; total: number }>(
      `/leads?take=100${statusFilter.value ? `&status=${statusFilter.value}` : ''}`,
    ),
  refetchInterval: 4000,
});

const reviewMutation = useMutation({
  mutationFn: (vars: { id: string; decision: 'APPROVED' | 'REJECTED' }) =>
    api(`/leads/${vars.id}/review`, { method: 'POST', body: { decision: vars.decision } }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
});

const categoryColor: Record<string, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-700',
  STRONG: 'bg-green-100 text-green-700',
  MODERATE: 'bg-amber-100 text-amber-700',
  WEAK: 'bg-slate-100 text-slate-600',
  REJECTED: 'bg-red-100 text-red-700',
};

const statuses = [
  '', 'REVIEW_REQUIRED', 'DEMO_READY', 'QUALIFIED', 'REJECTED', 'DO_NOT_CONTACT',
];
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Leads</h1>
          <p class="mt-1 text-sm text-slate-500">Qualificados automaticamente por score (§13).</p>
        </div>
        <select v-model="statusFilter" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option v-for="s in statuses" :key="s" :value="s">{{ s || 'Todos os status' }}</option>
        </select>
      </div>

      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Empresa</th>
              <th class="px-5 py-3">Cidade</th>
              <th class="px-5 py-3">Score</th>
              <th class="px-5 py-3">Site</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Revisão</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading"><td colspan="6" class="px-5 py-6 text-center text-slate-400">Carregando…</td></tr>
            <tr v-else-if="!data?.items.length"><td colspan="6" class="px-5 py-6 text-center text-slate-400">Nenhum lead. Execute uma campanha.</td></tr>
            <tr v-for="l in data?.items" :key="l.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td class="px-5 py-3 font-medium">{{ l.business.name }}</td>
              <td class="px-5 py-3 text-slate-600">{{ l.business.city }}</td>
              <td class="px-5 py-3">
                <span class="font-semibold">{{ l.scoreTotal ?? '—' }}</span>
                <span :class="['ml-2 rounded px-2 py-0.5 text-xs', categoryColor[l.scoreCategory ?? ''] ?? 'bg-slate-100']">
                  {{ l.scoreCategory }}
                </span>
              </td>
              <td class="px-5 py-3 text-xs text-slate-500">{{ l.websiteStatus }}</td>
              <td class="px-5 py-3 text-xs font-medium text-slate-700">{{ l.status }}</td>
              <td class="px-5 py-3 text-right">
                <div v-if="l.status === 'REVIEW_REQUIRED'" class="flex justify-end gap-2">
                  <button
                    class="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    @click="reviewMutation.mutate({ id: l.id, decision: 'APPROVED' })"
                  >
                    Aprovar
                  </button>
                  <button
                    class="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    @click="reviewMutation.mutate({ id: l.id, decision: 'REJECTED' })"
                  >
                    Rejeitar
                  </button>
                </div>
                <span v-else class="text-xs text-slate-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
