<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePortal } from '~/composables/usePortal';

interface Site {
  id: string;
  domain: string | null;
  temporaryUrl: string | null;
  status: string | null;
  indexingAllowed: boolean;
  createdAt: string;
}

const { api } = usePortal();
const sites = ref<Site[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    sites.value = await api<Site[]>('/portal/sites');
  } catch {
    error.value = 'Não foi possível carregar seus sites.';
  } finally {
    loading.value = false;
  }
});

function link(s: Site): string | null {
  if (s.domain) return s.domain.startsWith('http') ? s.domain : `https://${s.domain}`;
  return s.temporaryUrl;
}
</script>

<template>
  <div>
    <h2 class="ph">Meus sites</h2>
    <p v-if="loading" class="muted">Carregando…</p>
    <p v-else-if="error" class="muted">{{ error }}</p>
    <p v-else-if="!sites.length" class="muted">
      Nenhum site cadastrado ainda. Quando a Informatizou publicar um site para o seu negócio, ele aparece aqui.
    </p>
    <div v-else class="list">
      <div v-for="s in sites" :key="s.id" class="row win-well">
        <div class="info">
          <span class="dom">{{ s.domain || s.temporaryUrl || 'Site em preparação' }}</span>
          <span class="badges">
            <span class="badge bevel-in">{{ s.status || 'em preparação' }}</span>
            <span class="badge bevel-in">{{ s.indexingAllowed ? 'indexável' : 'não indexado' }}</span>
          </span>
        </div>
        <a v-if="link(s)" :href="link(s)!" target="_blank" rel="noopener" class="btn95 open">Abrir ↗</a>
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
  line-height: 1.5;
}
.list {
  display: grid;
  gap: 8px;
}
.row {
  background: #fff;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dom {
  font-weight: 700;
  font-size: 13px;
}
.badges {
  display: flex;
  gap: 6px;
}
.badge {
  background: var(--w-face);
  font-size: 10px;
  padding: 1px 6px;
}
.open {
  text-decoration: none;
  white-space: nowrap;
}
</style>
