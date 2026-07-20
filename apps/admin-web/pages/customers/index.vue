<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: 'auth' });

interface WaConfig {
  phoneNumberId: string;
  label: string | null;
  businessName: string;
}
interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  portalEmail: string | null;
  lastPortalLoginAt: string | null;
  subscriptions: { status: string; priceCents: number }[];
  sites: { status: string | null }[];
  whatsappConfigs: WaConfig[];
}

const auth = useAuthStore();
const api = useApi();
const qc = useQueryClient();
const isAdmin = computed(() => auth.user?.role === 'ADMIN');

const { data, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: () => api<{ items: Customer[] }>('/customers'),
  refetchInterval: 6000,
});

function brl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ----- Modal de acesso ao painel -----
const target = ref<Customer | null>(null);
const formEmail = ref('');
const formPassword = ref('');
const formPhone = ref('');
const formError = ref('');
const formOk = ref('');

function openGrant(c: Customer) {
  target.value = c;
  formEmail.value = c.portalEmail ?? c.email ?? '';
  formPassword.value = '';
  formPhone.value = c.whatsappConfigs[0]?.phoneNumberId ?? '';
  formError.value = '';
  formOk.value = '';
}
function closeGrant() {
  target.value = null;
}
function suggestPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  formPassword.value = out;
}

const grant = useMutation({
  mutationFn: (payload: { customerId: string; email: string; password: string; phoneNumberId?: string }) =>
    api('/admin/portal/grant', { method: 'POST', body: payload }),
  onSuccess: async () => {
    formOk.value = 'Acesso ao painel ativado com sucesso.';
    await qc.invalidateQueries({ queryKey: ['customers'] });
  },
  onError: (e: unknown) => {
    const status = (e as { statusCode?: number }).statusCode;
    formError.value =
      status === 403
        ? 'Você não tem permissão para ativar o painel (somente ADMIN).'
        : (e as { data?: { message?: string } })?.data?.message ?? 'Falha ao ativar o acesso.';
  },
});

function submitGrant() {
  if (!target.value) return;
  formError.value = '';
  formOk.value = '';
  if (formPassword.value.length < 8) {
    formError.value = 'A senha precisa ter ao menos 8 caracteres.';
    return;
  }
  grant.mutate({
    customerId: target.value.id,
    email: formEmail.value.trim(),
    password: formPassword.value,
    phoneNumberId: formPhone.value.trim() || undefined,
  });
}

function fmtDate(s: string | null): string {
  return s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
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
        <div v-for="c in data?.items" :key="c.id" class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="font-semibold">{{ c.name }}</h3>
          <p class="mt-1 text-xs text-slate-500">{{ c.email ?? c.phone ?? '—' }}</p>
          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span class="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">{{ c.sites.length }} site(s)</span>
            <span v-for="(s, i) in c.subscriptions" :key="i" class="rounded bg-brand-50 px-2 py-0.5 text-brand-700">
              {{ s.status }} · {{ brl(s.priceCents) }}/mês
            </span>
          </div>

          <!-- Acesso ao painel -->
          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div class="text-xs">
              <span v-if="c.portalEmail" class="inline-flex items-center gap-1 font-medium text-emerald-700">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Painel ativo
              </span>
              <span v-else class="inline-flex items-center gap-1 text-slate-400">
                <span class="h-1.5 w-1.5 rounded-full bg-slate-300" /> Sem painel
              </span>
              <p v-if="c.portalEmail" class="mt-0.5 text-[11px] text-slate-400">{{ c.portalEmail }}</p>
            </div>
            <button
              v-if="isAdmin"
              class="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              @click="openGrant(c)"
            >
              {{ c.portalEmail ? 'Editar acesso' : 'Ativar painel' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal -->
    <div v-if="target" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="closeGrant">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold">Acesso ao painel</h2>
        <p class="mt-1 text-sm text-slate-500">{{ target.name }}</p>

        <form class="mt-4 space-y-4" @submit.prevent="submitGrant">
          <label class="block">
            <span class="text-xs font-medium text-slate-600">E-mail de login</span>
            <input v-model="formEmail" type="email" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>

          <label class="block">
            <span class="text-xs font-medium text-slate-600">Senha {{ target.portalEmail ? '(define uma nova)' : '' }}</span>
            <div class="mt-1 flex gap-2">
              <input v-model="formPassword" type="text" required minlength="8" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="mín. 8 caracteres" />
              <button type="button" class="whitespace-nowrap rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50" @click="suggestPassword">
                Gerar
              </button>
            </div>
          </label>

          <label class="block">
            <span class="text-xs font-medium text-slate-600">Número de WhatsApp (opcional)</span>
            <select v-if="target.whatsappConfigs.length" v-model="formPhone" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">— não vincular agora —</option>
              <option v-for="w in target.whatsappConfigs" :key="w.phoneNumberId" :value="w.phoneNumberId">
                {{ w.label || w.businessName }} · {{ w.phoneNumberId }}
              </option>
            </select>
            <input v-else v-model="formPhone" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Phone Number ID (Meta)" />
            <p class="mt-1 text-[11px] text-slate-400">Vincula o número de WhatsApp a este cliente para ele configurar o chatbot.</p>
          </label>

          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</p>
          <p v-if="formOk" class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ formOk }}</p>

          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="closeGrant">
              {{ formOk ? 'Fechar' : 'Cancelar' }}
            </button>
            <button type="submit" :disabled="grant.isPending.value" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {{ grant.isPending.value ? 'Salvando…' : 'Ativar acesso' }}
            </button>
          </div>
        </form>

        <p v-if="target.lastPortalLoginAt" class="mt-4 text-[11px] text-slate-400">
          Último acesso ao painel: {{ fmtDate(target.lastPortalLoginAt) }}
        </p>
      </div>
    </div>
  </div>
</template>
