<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { ref, computed } from 'vue';

definePageMeta({ middleware: 'auth' });

type Mode = 'BOT' | 'HUMAN' | 'CLOSED';
interface Message {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  text: string | null;
  kind: string;
  createdAt: string;
}
interface Conversation {
  id: string;
  contactPhone: string;
  contactName: string | null;
  mode: Mode;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  messages: Message[];
}

const api = useApi();
const qc = useQueryClient();
const selectedId = ref<string>('');
const draft = ref('');

const { data: list, isLoading } = useQuery({
  queryKey: ['whatsapp-conversations'],
  queryFn: () => api<Conversation[]>('/admin/whatsapp/conversations'),
  refetchInterval: 5000,
});

const { data: current } = useQuery({
  queryKey: computed(() => ['whatsapp-conversation', selectedId.value]),
  queryFn: () => api<Conversation>(`/admin/whatsapp/conversations/${selectedId.value}`),
  enabled: computed(() => Boolean(selectedId.value)),
  refetchInterval: 4000,
});

function refresh() {
  qc.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
  if (selectedId.value) qc.invalidateQueries({ queryKey: ['whatsapp-conversation', selectedId.value] });
}

const modeMutation = useMutation({
  mutationFn: (action: 'takeover' | 'return' | 'close') =>
    api(`/admin/whatsapp/conversations/${selectedId.value}/${action}`, { method: 'POST' }),
  onSuccess: refresh,
});

const replyMutation = useMutation({
  mutationFn: (text: string) =>
    api(`/admin/whatsapp/conversations/${selectedId.value}/reply`, { method: 'POST', body: { text } }),
  onSuccess: () => {
    draft.value = '';
    refresh();
  },
});

function sendReply() {
  const text = draft.value.trim();
  if (text) replyMutation.mutate(text);
}

const MODE_BADGE: Record<Mode, string> = {
  BOT: 'bg-brand-50 text-brand-700',
  HUMAN: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-slate-100 text-slate-500',
};
const MODE_LABEL: Record<Mode, string> = { BOT: 'Bot', HUMAN: 'Humano', CLOSED: 'Encerrada' };

function fmtTime(s: string | null): string {
  if (!s) return '';
  return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-6 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Conversas do WhatsApp</h1>
          <p class="mt-1 text-sm text-slate-500">Acompanhe e assuma o atendimento quando quiser.</p>
        </div>
        <NuxtLink
          to="/whatsapp"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Configuração
        </NuxtLink>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <!-- Lista -->
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div v-if="isLoading" class="p-4 text-sm text-slate-400">Carregando…</div>
          <div v-else-if="!list?.length" class="p-4 text-sm text-slate-400">Nenhuma conversa ainda.</div>
          <ul v-else class="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            <li
              v-for="c in list"
              :key="c.id"
              class="cursor-pointer px-4 py-3 hover:bg-slate-50"
              :class="selectedId === c.id ? 'bg-slate-50' : ''"
              @click="selectedId = c.id"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-800">{{ c.contactName || c.contactPhone }}</span>
                <span class="rounded px-1.5 py-0.5 text-xs font-medium" :class="MODE_BADGE[c.mode]">
                  {{ MODE_LABEL[c.mode] }}
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-slate-500">
                {{ c.messages?.[0]?.text ?? '—' }}
              </p>
              <p class="mt-0.5 text-[11px] text-slate-400">{{ fmtTime(c.lastInboundAt) }}</p>
            </li>
          </ul>
        </div>

        <!-- Thread -->
        <div class="flex min-h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div v-if="!selectedId" class="flex flex-1 items-center justify-center text-sm text-slate-400">
            Selecione uma conversa.
          </div>
          <template v-else-if="current">
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div>
                <p class="text-sm font-semibold text-slate-800">{{ current.contactName || current.contactPhone }}</p>
                <p class="text-xs text-slate-400">{{ current.contactPhone }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="rounded px-2 py-0.5 text-xs font-medium" :class="MODE_BADGE[current.mode]">
                  {{ MODE_LABEL[current.mode] }}
                </span>
                <button
                  v-if="current.mode === 'BOT'"
                  class="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  @click="modeMutation.mutate('takeover')"
                >
                  Assumir
                </button>
                <button
                  v-if="current.mode === 'HUMAN'"
                  class="rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                  @click="modeMutation.mutate('return')"
                >
                  Devolver ao bot
                </button>
                <button
                  v-if="current.mode !== 'CLOSED'"
                  class="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  @click="modeMutation.mutate('close')"
                >
                  Encerrar
                </button>
              </div>
            </div>

            <div class="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div
                v-for="m in current.messages"
                :key="m.id"
                class="flex"
                :class="m.direction === 'INBOUND' ? 'justify-start' : 'justify-end'"
              >
                <div
                  class="max-w-[75%] rounded-2xl px-3.5 py-2 text-sm"
                  :class="m.direction === 'INBOUND' ? 'bg-slate-100 text-slate-800' : 'bg-brand-600 text-white'"
                >
                  <p class="whitespace-pre-wrap">{{ m.text }}</p>
                  <p class="mt-1 text-[10px] opacity-70">{{ fmtTime(m.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 p-3">
              <form class="flex items-center gap-2" @submit.prevent="sendReply">
                <input
                  v-model="draft"
                  :disabled="current.mode === 'CLOSED'"
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  placeholder="Escreva uma resposta…"
                />
                <button
                  type="submit"
                  :disabled="!draft.trim() || replyMutation.isPending.value || current.mode === 'CLOSED'"
                  class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
              <p class="mt-1.5 px-1 text-[11px] text-slate-400">
                Responder manualmente assume a conversa (o bot para de responder).
              </p>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>
