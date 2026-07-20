<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { ref, watch, computed } from 'vue';

definePageMeta({ middleware: 'auth' });

interface MenuOption {
  key: string;
  label: string;
  keywords?: string[];
  response: string;
  handoff?: boolean;
}
interface BusinessHours {
  enabled: boolean;
  tz?: string;
  days: Record<string, [string, string][]>;
}
interface BotConfig {
  id: string;
  phoneNumberId: string;
  label: string | null;
  businessName: string;
  tone: string | null;
  greeting: string | null;
  awayMessage: string | null;
  fallbackMessage: string | null;
  handoffMessage: string | null;
  handoffKeyword: string;
  knowledge: string | null;
  businessHours: BusinessHours | null;
  menuEnabled: boolean;
  menuHeader: string | null;
  options: MenuOption[] | null;
  aiEnabled: boolean;
  enabled: boolean;
}

const WEEKDAYS = [
  { key: '1', label: 'Segunda' },
  { key: '2', label: 'Terça' },
  { key: '3', label: 'Quarta' },
  { key: '4', label: 'Quinta' },
  { key: '5', label: 'Sexta' },
  { key: '6', label: 'Sábado' },
  { key: '0', label: 'Domingo' },
];

interface OptionRow extends MenuOption {
  keywordsText: string;
}
interface DayRow {
  key: string;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
}

const api = useApi();
const qc = useQueryClient();

const { data: configs, isLoading } = useQuery({
  queryKey: ['whatsapp-configs'],
  queryFn: () => api<BotConfig[]>('/admin/whatsapp/config'),
});

const selectedId = ref<string>('');
const saved = ref(false);
const error = ref<string>('');

const form = ref({
  phoneNumberId: '',
  label: '',
  businessName: '',
  tone: '',
  greeting: '',
  awayMessage: '',
  fallbackMessage: '',
  handoffMessage: '',
  handoffKeyword: 'atendente',
  knowledge: '',
  menuEnabled: false,
  menuHeader: '',
  aiEnabled: true,
  enabled: true,
});
const hoursEnabled = ref(false);
const hoursTz = ref('America/Sao_Paulo');
const days = ref<DayRow[]>(
  WEEKDAYS.map((d) => ({ key: d.key, label: d.label, enabled: false, open: '09:00', close: '18:00' })),
);
const options = ref<OptionRow[]>([]);

function loadInto(c: BotConfig) {
  form.value = {
    phoneNumberId: c.phoneNumberId,
    label: c.label ?? '',
    businessName: c.businessName,
    tone: c.tone ?? '',
    greeting: c.greeting ?? '',
    awayMessage: c.awayMessage ?? '',
    fallbackMessage: c.fallbackMessage ?? '',
    handoffMessage: c.handoffMessage ?? '',
    handoffKeyword: c.handoffKeyword ?? 'atendente',
    knowledge: c.knowledge ?? '',
    menuEnabled: c.menuEnabled,
    menuHeader: c.menuHeader ?? '',
    aiEnabled: c.aiEnabled,
    enabled: c.enabled,
  };
  hoursEnabled.value = c.businessHours?.enabled ?? false;
  hoursTz.value = c.businessHours?.tz ?? 'America/Sao_Paulo';
  days.value = WEEKDAYS.map((d) => {
    const range = c.businessHours?.days?.[d.key]?.[0];
    return {
      key: d.key,
      label: d.label,
      enabled: Boolean(range),
      open: range?.[0] ?? '09:00',
      close: range?.[1] ?? '18:00',
    };
  });
  options.value = (c.options ?? []).map((o) => ({ ...o, keywordsText: (o.keywords ?? []).join(', ') }));
}

function resetNew() {
  selectedId.value = '';
  form.value = {
    phoneNumberId: '',
    label: '',
    businessName: '',
    tone: '',
    greeting: 'Olá! 👋 Obrigado por chamar a gente.',
    awayMessage: 'Estamos fora do horário de atendimento agora, mas já já retornamos por aqui!',
    fallbackMessage: 'Recebi sua mensagem! Em instantes um atendente responde.',
    handoffMessage: 'Certo! Vou chamar um atendente para continuar com você. 🙌',
    handoffKeyword: 'atendente',
    knowledge: '',
    menuEnabled: false,
    menuHeader: 'Como posso te ajudar? Responda com o número:',
    aiEnabled: true,
    enabled: true,
  };
  hoursEnabled.value = false;
  hoursTz.value = 'America/Sao_Paulo';
  days.value = WEEKDAYS.map((d) => ({ key: d.key, label: d.label, enabled: false, open: '09:00', close: '18:00' }));
  options.value = [];
}

watch(
  () => configs.value,
  (list) => {
    if (list && list.length && !selectedId.value) {
      selectedId.value = list[0]!.id;
      loadInto(list[0]!);
    } else if (list && !list.length) {
      resetNew();
    }
  },
  { immediate: true },
);

function onSelect(id: string) {
  saved.value = false;
  if (id === '__new__') return resetNew();
  const c = configs.value?.find((x) => x.id === id);
  if (c) {
    selectedId.value = id;
    loadInto(c);
  }
}

function addOption() {
  options.value.push({
    key: String(options.value.length + 1),
    label: '',
    keywordsText: '',
    response: '',
    handoff: false,
  });
}
function removeOption(i: number) {
  options.value.splice(i, 1);
}

const canSave = computed(() => form.value.phoneNumberId.trim() && form.value.businessName.trim());

const mutation = useMutation({
  mutationFn: (payload: Record<string, unknown>) =>
    api<BotConfig>('/admin/whatsapp/config', { method: 'PUT', body: payload }),
  onSuccess: async (c) => {
    saved.value = true;
    error.value = '';
    await qc.invalidateQueries({ queryKey: ['whatsapp-configs'] });
    selectedId.value = c.id;
  },
  onError: (e: unknown) => {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? 'Falha ao salvar.';
  },
});

function save() {
  const businessHours = {
    enabled: hoursEnabled.value,
    tz: hoursTz.value,
    days: days.value.reduce<Record<string, [string, string][]>>((acc, d) => {
      if (d.enabled) acc[d.key] = [[d.open, d.close]];
      return acc;
    }, {}),
  };
  const opts = options.value
    .filter((o) => o.label.trim() && o.response.trim())
    .map((o) => ({
      key: o.key || undefined,
      label: o.label.trim(),
      keywords: o.keywordsText
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      response: o.response.trim(),
      handoff: Boolean(o.handoff),
    }));

  mutation.mutate({
    phoneNumberId: form.value.phoneNumberId.trim(),
    label: form.value.label || undefined,
    businessName: form.value.businessName.trim(),
    tone: form.value.tone || undefined,
    greeting: form.value.greeting || undefined,
    awayMessage: form.value.awayMessage || undefined,
    fallbackMessage: form.value.fallbackMessage || undefined,
    handoffMessage: form.value.handoffMessage || undefined,
    handoffKeyword: form.value.handoffKeyword || undefined,
    knowledge: form.value.knowledge || undefined,
    businessHours,
    menuEnabled: form.value.menuEnabled,
    menuHeader: form.value.menuHeader || undefined,
    options: opts,
    aiEnabled: form.value.aiEnabled,
    enabled: form.value.enabled,
  });
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-4xl px-6 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Chatbot do WhatsApp</h1>
          <p class="mt-1 text-sm text-slate-500">
            Configure o atendimento automático: fluxo, menu de opções, mensagens e IA.
          </p>
        </div>
        <NuxtLink
          to="/whatsapp/conversas"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver conversas →
        </NuxtLink>
      </div>

      <div v-if="isLoading" class="mt-8 text-slate-400">Carregando…</div>

      <form v-else class="mt-6 space-y-6" @submit.prevent="save">
        <!-- Seleção de número -->
        <div class="flex flex-wrap items-center gap-3">
          <select
            :value="selectedId || '__new__'"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            @change="onSelect(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="c in configs" :key="c.id" :value="c.id">
              {{ c.label || c.businessName }} · {{ c.phoneNumberId }}
            </option>
            <option value="__new__">+ Novo número</option>
          </select>
          <span v-if="saved" class="text-sm font-medium text-emerald-600">✓ Salvo</span>
          <span v-if="error" class="text-sm font-medium text-red-600">{{ error }}</span>
        </div>

        <!-- Identificação -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Identificação</h2>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Phone Number ID (Meta)</span>
              <input v-model="form.phoneNumberId" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="1234567890" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Apelido (interno)</span>
              <input v-model="form.label" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Loja Centro" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs font-medium text-slate-600">Nome do negócio</span>
              <input v-model="form.businessName" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Padaria Sol" />
            </label>
          </div>
        </section>

        <!-- Chaves gerais -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Comportamento</h2>
          <div class="mt-4 flex flex-wrap gap-6">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Bot ativo
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.aiEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Responder com IA (quando não casar no menu)
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.menuEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Usar menu de opções
            </label>
          </div>
          <div class="mt-4">
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Palavra-chave para falar com atendente</span>
              <input v-model="form.handoffKeyword" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64" />
            </label>
          </div>
        </section>

        <!-- Mensagens -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Mensagens</h2>
          <div class="mt-4 space-y-4">
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Saudação (primeiro contato)</span>
              <textarea v-model="form.greeting" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Fora do horário</span>
              <textarea v-model="form.awayMessage" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Ao transferir para atendente</span>
              <textarea v-model="form.handoffMessage" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Mensagem padrão (fallback)</span>
              <textarea v-model="form.fallbackMessage" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
        </section>

        <!-- Menu de opções -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-800">Menu de opções</h2>
            <button type="button" class="text-sm font-medium text-brand-700 hover:underline" @click="addOption">
              + Adicionar opção
            </button>
          </div>
          <label class="mt-4 block">
            <span class="text-xs font-medium text-slate-600">Cabeçalho do menu</span>
            <input v-model="form.menuHeader" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div v-if="!options.length" class="mt-4 text-sm text-slate-400">
            Sem opções. As mensagens caem direto na IA (se ativa) ou no fallback.
          </div>
          <div v-for="(o, i) in options" :key="i" class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
              <label class="block">
                <span class="text-xs font-medium text-slate-600">Nº</span>
                <input v-model="o.key" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label class="block">
                <span class="text-xs font-medium text-slate-600">Título</span>
                <input v-model="o.label" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Horário de funcionamento" />
              </label>
            </div>
            <label class="mt-3 block">
              <span class="text-xs font-medium text-slate-600">Palavras-chave (separadas por vírgula)</span>
              <input v-model="o.keywordsText" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="horario, abre, funciona" />
            </label>
            <label class="mt-3 block">
              <span class="text-xs font-medium text-slate-600">Resposta</span>
              <textarea v-model="o.response" rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <div class="mt-3 flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm">
                <input v-model="o.handoff" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
                Transferir para atendente
              </label>
              <button type="button" class="text-sm text-red-600 hover:underline" @click="removeOption(i)">Remover</button>
            </div>
          </div>
        </section>

        <!-- Horário de atendimento -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">Horário de atendimento</h2>
          <label class="mt-4 flex items-center gap-2 text-sm">
            <input v-model="hoursEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            Responder "fora do horário" quando estiver fechado
          </label>
          <div v-if="hoursEnabled" class="mt-4 space-y-2">
            <div v-for="d in days" :key="d.key" class="flex flex-wrap items-center gap-3 text-sm">
              <label class="flex w-32 items-center gap-2">
                <input v-model="d.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
                {{ d.label }}
              </label>
              <template v-if="d.enabled">
                <input v-model="d.open" type="time" class="rounded-lg border border-slate-300 px-2 py-1" />
                <span class="text-slate-400">até</span>
                <input v-model="d.close" type="time" class="rounded-lg border border-slate-300 px-2 py-1" />
              </template>
              <span v-else class="text-slate-400">Fechado</span>
            </div>
          </div>
        </section>

        <!-- IA / conhecimento -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800">IA & base de conhecimento</h2>
          <div class="mt-4 space-y-4">
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Tom de voz</span>
              <input v-model="form.tone" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Simpático, direto, informal" />
            </label>
            <label class="block">
              <span class="text-xs font-medium text-slate-600">
                Base de conhecimento (a IA só responde com o que estiver aqui — §15)
              </span>
              <textarea
                v-model="form.knowledge"
                rows="6"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Produtos, serviços, endereço, formas de pagamento, entrega, políticas…"
              />
            </label>
          </div>
        </section>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            :disabled="!canSave || mutation.isPending.value"
            class="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {{ mutation.isPending.value ? 'Salvando…' : 'Salvar configuração' }}
          </button>
          <span v-if="saved" class="text-sm font-medium text-emerald-600">✓ Configuração salva</span>
        </div>
      </form>
    </main>
  </div>
</template>
