<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Demo {
  id: string;
  slug: string;
  template: string;
  status: string;
  publicUrl: string | null;
  expiresAt: string | null;
  lead: { business: { name: string; city: string | null } };
}

const api = useApi();
const qc = useQueryClient();

const { data, isLoading } = useQuery({
  queryKey: ['demos'],
  queryFn: () => api<{ items: Demo[]; total: number }>('/demo-sites?take=100'),
  refetchInterval: 5000,
});

const publishMutation = useMutation({
  mutationFn: (id: string) => api(`/demo-sites/${id}/publish`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['demos'] }),
});

const statusColor: Record<string, string> = {
  REVIEW_REQUIRED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-slate-200 text-slate-500',
  SOLD: 'bg-purple-100 text-purple-700',
  DISABLED: 'bg-slate-100 text-slate-500',
};

function daysLeft(expiresAt: string | null): string {
  if (!expiresAt) return '—';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expirada';
  return `${Math.ceil(ms / 86400000)}d`;
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Demonstrações</h1>
      <p class="mt-1 text-sm text-slate-500">Geradas automaticamente a partir dos leads aprovados (§18).</p>

      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Empresa</th>
              <th class="px-5 py-3">Template</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Expira</th>
              <th class="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading"><td colspan="5" class="px-5 py-6 text-center text-slate-400">Carregando…</td></tr>
            <tr v-else-if="!data?.items.length"><td colspan="5" class="px-5 py-6 text-center text-slate-400">Nenhuma demo ainda.</td></tr>
            <tr v-for="d in data?.items" :key="d.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td class="px-5 py-3 font-medium">{{ d.lead.business.name }}</td>
              <td class="px-5 py-3 text-xs text-slate-500">{{ d.template }}</td>
              <td class="px-5 py-3">
                <span :class="['rounded px-2 py-0.5 text-xs font-medium', statusColor[d.status] ?? 'bg-slate-100']">{{ d.status }}</span>
              </td>
              <td class="px-5 py-3 text-slate-600">{{ daysLeft(d.expiresAt) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <a v-if="d.publicUrl && d.status === 'PUBLISHED'" :href="d.publicUrl" target="_blank" class="text-sm font-medium text-brand-600 hover:underline">Ver</a>
                  <button
                    v-if="d.status === 'REVIEW_REQUIRED' || d.status === 'APPROVED' || d.status === 'EXPIRED'"
                    class="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                    @click="publishMutation.mutate(d.id)"
                  >
                    Publicar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
