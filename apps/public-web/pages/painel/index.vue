<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePortal } from '~/composables/usePortal';

definePageMeta({ middleware: 'portal' });
useHead({
  title: 'Informatizou · Painel do Cliente',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const { customer, fetchMe, logout } = usePortal();
const router = useRouter();

type Section = 'reports' | 'chatbot' | 'conversas' | 'sites';
const section = ref<Section>('reports');
const ready = ref(false);

const tabs: { key: Section; label: string; icon: string }[] = [
  { key: 'reports', label: 'Visão geral', icon: '📊' },
  { key: 'chatbot', label: 'Chatbot', icon: '💬' },
  { key: 'conversas', label: 'Conversas', icon: '📨' },
  { key: 'sites', label: 'Meus sites', icon: '🌐' },
];

onMounted(async () => {
  const ok = await fetchMe();
  if (!ok) {
    await router.replace('/painel/login');
    return;
  }
  ready.value = true;
});

async function sair() {
  await logout();
  await router.replace('/painel/login');
}
</script>

<template>
  <div class="desk os-scroll">
    <div class="win bevel-out">
      <div class="win-title">
        <span class="flex items-center gap-2">
          <img src="/logo-mark.png" alt="" width="16" height="16" style="image-rendering: pixelated" />
          Painel do Cliente — {{ customer?.name ?? '…' }}
        </span>
        <button class="tb-x bevel-out" title="Sair" @click="sair">×</button>
      </div>

      <!-- Barra de menu / abas -->
      <div class="menubar bevel-thin">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab btn95"
          :class="{ active: section === t.key }"
          @click="section = t.key"
        >
          <span aria-hidden="true">{{ t.icon }}</span> {{ t.label }}
        </button>
        <span class="spacer" />
        <button class="tab btn95" @click="sair">Sair</button>
      </div>

      <!-- Conteúdo -->
      <div class="content win-well os-scroll">
        <div v-if="!ready" class="loading">Carregando o painel…</div>
        <template v-else>
          <PortalPanelReports v-if="section === 'reports'" @go="section = $event" />
          <PortalPanelChatbot v-else-if="section === 'chatbot'" />
          <PortalPanelConversas v-else-if="section === 'conversas'" />
          <PortalPanelSites v-else-if="section === 'sites'" />
        </template>
      </div>

      <!-- Rodapé estilo barra de status -->
      <div class="statusbar">
        <span class="cell bevel-in">{{ customer?.portalEmail }}</span>
        <span class="cell bevel-in grow">InformatizouOS · Painel do Cliente</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.desk {
  min-height: 100vh;
  height: 100vh;
  padding: 14px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: auto;
}
.win {
  width: 100%;
  max-width: 900px;
  background: var(--w-face);
  padding: 3px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 28px);
}
.tb-x {
  width: 20px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--w-face);
  color: #000;
  font-size: 12px;
  padding-bottom: 2px;
}
.menubar {
  display: flex;
  gap: 4px;
  padding: 4px;
  align-items: center;
  background: var(--w-face);
  flex-wrap: wrap;
}
.tab {
  min-height: 24px;
  padding: 3px 10px;
  font-size: 12px;
}
.tab.active {
  box-shadow:
    inset 1px 1px 0 var(--w-dark),
    inset -1px -1px 0 var(--w-hi),
    inset 2px 2px 0 var(--w-shadow),
    inset -2px -2px 0 var(--w-light);
  font-weight: 700;
}
.spacer {
  flex: 1;
}
.content {
  flex: 1;
  overflow: auto;
  margin: 0 4px;
  padding: 14px;
  background: var(--w-face);
}
.loading {
  padding: 24px;
  text-align: center;
  color: #303030;
}
.statusbar {
  display: flex;
  gap: 3px;
  padding: 4px;
}
.statusbar .cell {
  background: var(--w-face);
  font-size: 11px;
  padding: 2px 8px;
}
.statusbar .grow {
  flex: 1;
}
</style>
