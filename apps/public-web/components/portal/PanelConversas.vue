<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { usePortal } from '~/composables/usePortal';

type Mode = 'BOT' | 'HUMAN' | 'CLOSED';
interface Message {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  text: string | null;
  createdAt: string;
}
interface Conversation {
  id: string;
  contactPhone: string;
  contactName: string | null;
  mode: Mode;
  lastInboundAt: string | null;
  messages: Message[];
}

const { api } = usePortal();
const list = ref<Conversation[]>([]);
const current = ref<Conversation | null>(null);
const selectedId = ref('');
const draft = ref('');
const loadingList = ref(true);
const sending = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const MODE_LABEL: Record<Mode, string> = { BOT: 'Bot', HUMAN: 'Humano', CLOSED: 'Encerrada' };

async function loadList() {
  try {
    list.value = await api<Conversation[]>('/portal/whatsapp/conversations');
  } finally {
    loadingList.value = false;
  }
}
async function loadCurrent() {
  if (!selectedId.value) return;
  current.value = await api<Conversation>(`/portal/whatsapp/conversations/${selectedId.value}`);
}
async function select(id: string) {
  selectedId.value = id;
  await loadCurrent();
}
async function setMode(action: 'takeover' | 'return' | 'close') {
  if (!selectedId.value) return;
  await api(`/portal/whatsapp/conversations/${selectedId.value}/${action}`, { method: 'POST' });
  await Promise.all([loadCurrent(), loadList()]);
}
async function sendReply() {
  const text = draft.value.trim();
  if (!text || !selectedId.value) return;
  sending.value = true;
  try {
    await api(`/portal/whatsapp/conversations/${selectedId.value}/reply`, { method: 'POST', body: { text } });
    draft.value = '';
    await Promise.all([loadCurrent(), loadList()]);
  } finally {
    sending.value = false;
  }
}

function fmt(s: string | null): string {
  if (!s) return '';
  return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  loadList();
  timer = setInterval(() => {
    loadList();
    if (selectedId.value) loadCurrent();
  }, 6000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div>
    <h2 class="ph">Conversas</h2>
    <div class="split">
      <!-- Lista -->
      <div class="listbox win-well os-scroll">
        <p v-if="loadingList" class="muted p">Carregando…</p>
        <p v-else-if="!list.length" class="muted p">Nenhuma conversa ainda.</p>
        <button
          v-for="c in list"
          :key="c.id"
          class="item"
          :class="{ sel: selectedId === c.id }"
          @click="select(c.id)"
        >
          <span class="itop">
            <b>{{ c.contactName || c.contactPhone }}</b>
            <span class="tag bevel-in">{{ MODE_LABEL[c.mode] }}</span>
          </span>
          <span class="prev">{{ c.messages?.[0]?.text ?? '—' }}</span>
        </button>
      </div>

      <!-- Thread -->
      <div class="thread win-well">
        <p v-if="!current" class="muted p">Selecione uma conversa.</p>
        <template v-else>
          <div class="thead">
            <div>
              <b>{{ current.contactName || current.contactPhone }}</b>
              <span class="sub">{{ current.contactPhone }}</span>
            </div>
            <div class="acts">
              <button v-if="current.mode === 'BOT'" class="btn95 sm" @click="setMode('takeover')">Assumir</button>
              <button v-if="current.mode === 'HUMAN'" class="btn95 sm" @click="setMode('return')">Devolver ao bot</button>
              <button v-if="current.mode !== 'CLOSED'" class="btn95 sm" @click="setMode('close')">Encerrar</button>
            </div>
          </div>

          <div class="msgs os-scroll">
            <div v-for="m in current.messages" :key="m.id" class="mrow" :class="m.direction === 'INBOUND' ? 'in' : 'out'">
              <div class="bubble bevel-out">
                <p>{{ m.text }}</p>
                <span class="time">{{ fmt(m.createdAt) }}</span>
              </div>
            </div>
          </div>

          <form class="reply" @submit.prevent="sendReply">
            <input
              v-model="draft"
              class="win-input"
              :disabled="current.mode === 'CLOSED'"
              placeholder="Escreva uma resposta…"
            />
            <button type="submit" class="btn95" :disabled="!draft.trim() || sending || current.mode === 'CLOSED'">
              Enviar
            </button>
          </form>
          <p class="note">Responder manualmente assume a conversa (o bot para de responder).</p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ph {
  font-size: 15px;
  margin: 0 0 12px;
}
.muted {
  color: #303030;
  font-size: 12px;
}
.p {
  padding: 12px;
}
.split {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 10px;
  height: 420px;
}
@media (max-width: 640px) {
  .split {
    grid-template-columns: 1fr;
    height: auto;
  }
}
.listbox {
  background: #fff;
  overflow: auto;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  text-align: left;
  padding: 7px 9px;
  border-bottom: 1px solid #d9d9d9;
  background: #fff;
}
.item.sel {
  background: var(--w-navy);
  color: #fff;
}
.item.sel .tag {
  color: #000;
}
.itop {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
}
.tag {
  background: var(--w-face);
  color: #000;
  font-size: 10px;
  padding: 0 5px;
}
.prev {
  font-size: 11px;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.thread {
  background: var(--w-face);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.thead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  flex-wrap: wrap;
}
.sub {
  font-size: 11px;
  color: #303030;
  margin-left: 6px;
}
.acts {
  display: flex;
  gap: 5px;
}
.sm {
  min-height: 22px;
  padding: 2px 8px;
  font-size: 11px;
}
.msgs {
  flex: 1;
  overflow: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  margin: 0 6px;
}
.mrow {
  display: flex;
}
.mrow.in {
  justify-content: flex-start;
}
.mrow.out {
  justify-content: flex-end;
}
.bubble {
  max-width: 76%;
  background: var(--w-face);
  padding: 6px 8px;
  font-size: 12px;
}
.mrow.out .bubble {
  background: #d7f0d0;
}
.bubble p {
  margin: 0;
  white-space: pre-wrap;
}
.time {
  display: block;
  font-size: 9px;
  color: #505050;
  margin-top: 3px;
}
.reply {
  display: flex;
  gap: 6px;
  padding: 8px 6px 4px;
}
.note {
  font-size: 10px;
  color: #303030;
  padding: 0 8px 6px;
}
</style>
