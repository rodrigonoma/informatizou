<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Proposal {
  id: string;
  status: string;
  implementationCents: number | null;
  monthlyCents: number | null;
  pdfUrl: string | null;
  lead: { business: { name: string } } | null;
  customer: { name: string } | null;
}

const api = useApi();
const qc = useQueryClient();

const { data, isLoading } = useQuery({
  queryKey: ['proposals'],
  queryFn: () => api<{ items: Proposal[] }>('/proposals'),
  refetchInterval: 5000,
});

const pdfMutation = useMutation({
  mutationFn: (id: string) => api(`/proposals/${id}/generate-pdf`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
});
const sendMutation = useMutation({
  mutationFn: (id: string) => api(`/proposals/${id}/send`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
});
const acceptMutation = useMutation({
  mutationFn: (id: string) => api(`/proposals/${id}/accept`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
});

function brl(cents: number | null): string {
  return cents == null ? '—' : (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-indigo-100 text-indigo-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-200 text-slate-500',
};
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Propostas</h1>
      <p class="mt-1 text-sm text-slate-500">Crie propostas a partir dos leads (§32). PDF e conversão em cliente (§33).</p>

      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Empresa</th>
              <th class="px-5 py-3">Implantação</th>
              <th class="px-5 py-3">Mensal</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading"><td colspan="5" class="px-5 py-6 text-center text-slate-400">Carregando…</td></tr>
            <tr v-else-if="!data?.items.length"><td colspan="5" class="px-5 py-6 text-center text-slate-400">Nenhuma proposta. Crie a partir de um lead interessado.</td></tr>
            <tr v-for="p in data?.items" :key="p.id" class="border-b border-slate-100 last:border-0">
              <td class="px-5 py-3 font-medium">{{ p.customer?.name ?? p.lead?.business.name ?? '—' }}</td>
              <td class="px-5 py-3">{{ brl(p.implementationCents) }}</td>
              <td class="px-5 py-3">{{ brl(p.monthlyCents) }}</td>
              <td class="px-5 py-3"><span :class="['rounded px-2 py-0.5 text-xs', statusColor[p.status] ?? 'bg-slate-100']">{{ p.status }}</span></td>
              <td class="px-5 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button class="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" @click="pdfMutation.mutate(p.id)">PDF</button>
                  <button v-if="p.status === 'DRAFT'" class="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" @click="sendMutation.mutate(p.id)">Enviar</button>
                  <button v-if="p.status !== 'ACCEPTED'" class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700" @click="acceptMutation.mutate(p.id)">Aceitar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-slate-400">Para criar uma proposta, use a API POST /proposals com o leadId. Formulário completo na evolução da UI.</p>
    </main>
  </div>
</template>
