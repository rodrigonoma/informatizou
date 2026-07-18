<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';

definePageMeta({ middleware: 'auth' });

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const api = useApi();
const { data, isLoading } = useQuery({
  queryKey: ['audit'],
  queryFn: () => api<{ items: AuditEntry[] }>('/admin/audit?take=150'),
  refetchInterval: 8000,
});
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="text-xl font-semibold tracking-tight">Auditoria</h1>
      <p class="mt-1 text-sm text-slate-500">Trilha de todas as ações relevantes (§41).</p>

      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Quando</th>
              <th class="px-5 py-3">Ação</th>
              <th class="px-5 py-3">Entidade</th>
              <th class="px-5 py-3">Usuário</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading"><td colspan="4" class="px-5 py-6 text-center text-slate-400">Carregando…</td></tr>
            <tr v-else-if="!data?.items.length"><td colspan="4" class="px-5 py-6 text-center text-slate-400">Sem registros.</td></tr>
            <tr v-for="a in data?.items" :key="a.id" class="border-b border-slate-100 last:border-0">
              <td class="px-5 py-3 text-xs text-slate-500">{{ new Date(a.createdAt).toLocaleString('pt-BR') }}</td>
              <td class="px-5 py-3 font-medium">{{ a.action }}</td>
              <td class="px-5 py-3 text-slate-600">{{ a.entityType }}</td>
              <td class="px-5 py-3 text-slate-600">{{ a.user?.name ?? 'sistema' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
