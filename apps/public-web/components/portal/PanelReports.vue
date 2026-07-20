<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePortal } from '~/composables/usePortal';

const emit = defineEmits<{ go: [section: 'chatbot' | 'conversas' | 'sites'] }>();

interface Report {
  conversations: { total: number; bot: number; human: number; closed: number };
  messages30d: { inbound: number; outbound: number };
  sites: number;
}

const { api } = usePortal();
const data = ref<Report | null>(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    data.value = await api<Report>('/portal/reports');
  } catch {
    error.value = 'Não foi possível carregar os relatórios.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h2 class="ph">Visão geral</h2>
    <p v-if="loading" class="muted">Carregando…</p>
    <p v-else-if="error" class="muted">{{ error }}</p>
    <template v-else-if="data">
      <div class="grid">
        <div class="stat win-well">
          <span class="num">{{ data.conversations.total }}</span>
          <span class="cap">Conversas no total</span>
        </div>
        <div class="stat win-well">
          <span class="num">{{ data.messages30d.inbound }}</span>
          <span class="cap">Mensagens recebidas (30d)</span>
        </div>
        <div class="stat win-well">
          <span class="num">{{ data.messages30d.outbound }}</span>
          <span class="cap">Mensagens enviadas (30d)</span>
        </div>
        <div class="stat win-well">
          <span class="num">{{ data.sites }}</span>
          <span class="cap">Sites do seu negócio</span>
        </div>
      </div>

      <fieldset class="win-fieldset mt">
        <legend class="win-legend">Situação das conversas</legend>
        <div class="bars">
          <div class="barrow">
            <span class="blabel">🤖 Atendidas pelo bot</span>
            <span class="bval bevel-in">{{ data.conversations.bot }}</span>
          </div>
          <div class="barrow">
            <span class="blabel">🙋 Com atendente humano</span>
            <span class="bval bevel-in">{{ data.conversations.human }}</span>
          </div>
          <div class="barrow">
            <span class="blabel">✔ Encerradas</span>
            <span class="bval bevel-in">{{ data.conversations.closed }}</span>
          </div>
        </div>
      </fieldset>

      <div class="cta">
        <button class="btn95" @click="emit('go', 'conversas')">Ver conversas →</button>
        <button class="btn95" @click="emit('go', 'chatbot')">Configurar chatbot →</button>
        <button class="btn95" @click="emit('go', 'sites')">Meus sites →</button>
      </div>
    </template>
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.stat {
  background: #fff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.num {
  font-size: 26px;
  font-weight: 700;
  color: var(--w-navy);
}
.cap {
  font-size: 11px;
  color: #303030;
}
.mt {
  margin-top: 16px;
}
.bars {
  display: grid;
  gap: 8px;
}
.barrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}
.bval {
  background: #fff;
  min-width: 44px;
  text-align: center;
  padding: 2px 8px;
  font-weight: 700;
}
.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
</style>
