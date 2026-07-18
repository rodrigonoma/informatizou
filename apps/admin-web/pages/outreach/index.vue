<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface Message {
  id: string;
  channel: string;
  status: string;
  subject: string | null;
  body: string;
  variant: string | null;
  lead: { business: { name: string } };
}

const api = useApi();
const qc = useQueryClient();
const selected = ref<Message | null>(null);

const { data, isLoading } = useQuery({
  queryKey: ['outreach'],
  queryFn: () => api<{ items: Message[]; total: number }>('/outreach/messages?take=100'),
  refetchInterval: 5000,
});

const approveMutation = useMutation({
  mutationFn: (id: string) => api(`/outreach/messages/${id}/approve`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
});
const rejectMutation = useMutation({
  mutationFn: (id: string) => api(`/outreach/messages/${id}/reject`, { method: 'POST' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
});

const statusColor: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT: 'bg-emerald-100 text-emerald-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-500',
  FAILED: 'bg-red-100 text-red-700',
};
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Prospecção</h1>
      <p class="mt-1 text-sm text-slate-500">Mensagens comerciais com aprovação (§27). E-mail só dispara quando habilitado.</p>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3">Empresa</th>
                <th class="px-4 py-3">Canal</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="4" class="px-4 py-6 text-center text-slate-400">Carregando…</td></tr>
              <tr v-else-if="!data?.items.length"><td colspan="4" class="px-4 py-6 text-center text-slate-400">Nenhuma mensagem.</td></tr>
              <tr
                v-for="m in data?.items"
                :key="m.id"
                class="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                :class="{ 'bg-brand-50': selected?.id === m.id }"
                @click="selected = m"
              >
                <td class="px-4 py-3 font-medium">{{ m.lead.business.name }}</td>
                <td class="px-4 py-3 text-xs text-slate-500">{{ m.channel }}</td>
                <td class="px-4 py-3">
                  <span :class="['rounded px-2 py-0.5 text-xs', statusColor[m.status] ?? 'bg-slate-100']">{{ m.status }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div v-if="m.status === 'PENDING_APPROVAL'" class="flex justify-end gap-1">
                    <button class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700" @click.stop="approveMutation.mutate(m.id)">Aprovar</button>
                    <button class="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" @click.stop="rejectMutation.mutate(m.id)">Rejeitar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div v-if="selected">
            <h2 class="text-sm font-semibold text-slate-700">{{ selected.lead.business.name }} · {{ selected.channel }}</h2>
            <p v-if="selected.subject" class="mt-2 text-sm font-medium">{{ selected.subject }}</p>
            <pre class="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs text-slate-700">{{ selected.body }}</pre>
          </div>
          <p v-else class="text-sm text-slate-400">Selecione uma mensagem para visualizar.</p>
        </div>
      </div>
    </main>
  </div>
</template>
