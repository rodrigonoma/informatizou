<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePortal } from '~/composables/usePortal';

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
  phoneNumberId: string;
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

const { api } = usePortal();
const loading = ref(true);
const phoneNumberId = ref('');
const missing = ref(false);
const saved = ref(false);
const saving = ref(false);
const error = ref('');

const form = ref({
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
const days = ref<DayRow[]>(WEEKDAYS.map((d) => ({ ...d, enabled: false, open: '09:00', close: '18:00' })));
const options = ref<OptionRow[]>([]);

function loadInto(c: BotConfig) {
  phoneNumberId.value = c.phoneNumberId;
  form.value = {
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
    const r = c.businessHours?.days?.[d.key]?.[0];
    return { ...d, enabled: Boolean(r), open: r?.[0] ?? '09:00', close: r?.[1] ?? '18:00' };
  });
  options.value = (c.options ?? []).map((o) => ({ ...o, keywordsText: (o.keywords ?? []).join(', ') }));
}

onMounted(async () => {
  try {
    const configs = await api<BotConfig[]>('/portal/whatsapp/config');
    if (!configs.length) missing.value = true;
    else loadInto(configs[0]!);
  } catch {
    error.value = 'Não foi possível carregar a configuração.';
  } finally {
    loading.value = false;
  }
});

function addOption() {
  options.value.push({ key: String(options.value.length + 1), label: '', keywordsText: '', response: '', handoff: false });
}
function removeOption(i: number) {
  options.value.splice(i, 1);
}

async function save() {
  saved.value = false;
  error.value = '';
  saving.value = true;
  try {
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
        keywords: o.keywordsText.split(',').map((k) => k.trim()).filter(Boolean),
        response: o.response.trim(),
        handoff: Boolean(o.handoff),
      }));
    await api(`/portal/whatsapp/config/${phoneNumberId.value}`, {
      method: 'PUT',
      body: {
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
      },
    });
    saved.value = true;
  } catch {
    error.value = 'Não foi possível salvar. Verifique os campos e tente novamente.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <h2 class="ph">Chatbot do WhatsApp</h2>
    <p v-if="loading" class="muted">Carregando…</p>
    <p v-else-if="missing" class="muted box win-well">
      📞 Seu número de WhatsApp ainda está sendo configurado pela Informatizou. Assim que estiver pronto,
      você poderá ajustar o fluxo de atendimento por aqui.
    </p>
    <form v-else class="form" @submit.prevent="save">
      <p class="pn">Número: <b>{{ phoneNumberId }}</b></p>

      <fieldset class="win-fieldset">
        <legend class="win-legend">Comportamento</legend>
        <label class="chk"><input v-model="form.enabled" type="checkbox" /> Chatbot ativo</label>
        <label class="chk"><input v-model="form.aiEnabled" type="checkbox" /> Responder com IA quando não casar no menu</label>
        <label class="chk"><input v-model="form.menuEnabled" type="checkbox" /> Usar menu de opções</label>
        <label class="fld">
          <span class="win-label">Nome do negócio</span>
          <input v-model="form.businessName" class="win-input" required />
        </label>
        <label class="fld">
          <span class="win-label">Palavra-chave para falar com atendente</span>
          <input v-model="form.handoffKeyword" class="win-input" />
        </label>
      </fieldset>

      <fieldset class="win-fieldset">
        <legend class="win-legend">Mensagens</legend>
        <label class="fld"><span class="win-label">Saudação (primeiro contato)</span>
          <textarea v-model="form.greeting" class="win-textarea" rows="2" /></label>
        <label class="fld"><span class="win-label">Fora do horário</span>
          <textarea v-model="form.awayMessage" class="win-textarea" rows="2" /></label>
        <label class="fld"><span class="win-label">Ao transferir para atendente</span>
          <textarea v-model="form.handoffMessage" class="win-textarea" rows="2" /></label>
        <label class="fld"><span class="win-label">Mensagem padrão (fallback)</span>
          <textarea v-model="form.fallbackMessage" class="win-textarea" rows="2" /></label>
      </fieldset>

      <fieldset class="win-fieldset">
        <legend class="win-legend">Menu de opções</legend>
        <label class="fld"><span class="win-label">Cabeçalho do menu</span>
          <input v-model="form.menuHeader" class="win-input" /></label>
        <p v-if="!options.length" class="muted sm">Sem opções — as mensagens caem na IA (se ativa) ou no fallback.</p>
        <div v-for="(o, i) in options" :key="i" class="opt win-well">
          <div class="orow">
            <label class="fld nkey"><span class="win-label">Nº</span><input v-model="o.key" class="win-input" /></label>
            <label class="fld grow"><span class="win-label">Título</span><input v-model="o.label" class="win-input" /></label>
          </div>
          <label class="fld"><span class="win-label">Palavras-chave (vírgula)</span>
            <input v-model="o.keywordsText" class="win-input" placeholder="horario, abre, funciona" /></label>
          <label class="fld"><span class="win-label">Resposta</span>
            <textarea v-model="o.response" class="win-textarea" rows="2" /></label>
          <div class="obot">
            <label class="chk"><input v-model="o.handoff" type="checkbox" /> Transferir para atendente</label>
            <button type="button" class="btn95 sm" @click="removeOption(i)">Remover</button>
          </div>
        </div>
        <button type="button" class="btn95 sm mt" @click="addOption">+ Adicionar opção</button>
      </fieldset>

      <fieldset class="win-fieldset">
        <legend class="win-legend">Horário de atendimento</legend>
        <label class="chk"><input v-model="hoursEnabled" type="checkbox" /> Responder "fora do horário" quando fechado</label>
        <div v-if="hoursEnabled" class="days">
          <div v-for="d in days" :key="d.key" class="dayrow">
            <label class="dchk"><input v-model="d.enabled" type="checkbox" /> {{ d.label }}</label>
            <template v-if="d.enabled">
              <input v-model="d.open" type="time" class="win-input tinp" />
              <span class="ate">até</span>
              <input v-model="d.close" type="time" class="win-input tinp" />
            </template>
            <span v-else class="muted sm">Fechado</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="win-fieldset">
        <legend class="win-legend">IA & base de conhecimento</legend>
        <label class="fld"><span class="win-label">Tom de voz</span>
          <input v-model="form.tone" class="win-input" placeholder="Simpático, direto, informal" /></label>
        <label class="fld"><span class="win-label">Base de conhecimento (a IA só responde com o que estiver aqui)</span>
          <textarea v-model="form.knowledge" class="win-textarea" rows="6"
            placeholder="Produtos, serviços, endereço, pagamento, entrega, políticas…" /></label>
      </fieldset>

      <div class="save">
        <button type="submit" class="btn95" :disabled="saving">{{ saving ? 'Salvando…' : 'Salvar configuração' }}</button>
        <span v-if="saved" class="ok">✓ Salvo</span>
        <span v-if="error" class="er">{{ error }}</span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.ph { font-size: 15px; margin: 0 0 12px; }
.muted { color: #303030; font-size: 12px; line-height: 1.5; }
.sm { font-size: 11px; }
.box { background: #fff; padding: 14px; }
.form { display: grid; gap: 14px; }
.pn { font-size: 12px; margin: 0; }
.win-fieldset { display: grid; gap: 8px; }
.chk, .dchk { display: flex; align-items: center; gap: 7px; font-size: 12px; }
.fld { display: grid; gap: 3px; }
.grow { flex: 1; }
.orow { display: flex; gap: 8px; }
.nkey { width: 70px; }
.opt { background: #fff; padding: 10px; display: grid; gap: 7px; }
.obot { display: flex; justify-content: space-between; align-items: center; }
.mt { margin-top: 2px; justify-self: start; }
.sm.mt { min-height: 22px; padding: 2px 10px; }
.btn95.sm { min-height: 22px; padding: 2px 10px; font-size: 11px; }
.days { display: grid; gap: 6px; }
.dayrow { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.dchk { width: 130px; }
.tinp { width: auto; }
.ate { color: #303030; }
.save { display: flex; align-items: center; gap: 12px; }
.ok { color: #006000; font-weight: 700; font-size: 12px; }
.er { color: #a00000; font-size: 12px; }
</style>
