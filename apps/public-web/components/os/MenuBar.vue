<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const { open } = useDesktop();

const clock = ref('');
const dateStr = ref('');
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  const d = new Date();
  clock.value = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const raw = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  dateStr.value = raw.charAt(0).toUpperCase() + raw.slice(1); // só a 1ª letra maiúscula
}

onMounted(() => {
  tick();
  timer = setInterval(tick, 15000);
});
onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<template>
  <header class="bar">
    <div class="bar-left">
      <img src="/logo-mark.png" alt="" class="bar-logo" width="18" height="18" />
      <strong class="bar-os">InformatizouOS</strong>
      <button class="bar-menu" @click="open('bem-vindo', { w: 560, h: 440 })">Produtos</button>
      <button class="bar-menu" @click="open('contato', { w: 480, h: 380 })">Contato</button>
    </div>
    <div class="bar-right">
      <span class="bar-status"><i />online</span>
      <span class="bar-date">{{ dateStr }}</span>
      <span class="bar-clock">{{ clock }}</span>
    </div>
  </header>
</template>

<style scoped>
.bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 36px;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: var(--bar-bg);
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
  border-bottom: 1px solid var(--glass-line);
  color: var(--bar-ink);
  font-size: 0.82rem;
}
.bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.bar-logo {
  width: 18px;
  height: 18px;
  display: block;
}
.bar-os {
  font-weight: 700;
  letter-spacing: -0.01em;
}
.bar-menu {
  color: rgba(242, 242, 245, 0.85);
  font-size: 0.82rem;
  transition: color 0.15s;
}
.bar-menu:hover {
  color: #fff;
}
.bar-right {
  display: flex;
  align-items: center;
  gap: 14px;
  font-variant-numeric: tabular-nums;
}
.bar-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(242, 242, 245, 0.75);
}
.bar-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--n-green);
  box-shadow: 0 0 8px var(--n-green);
}
.bar-date {
  color: rgba(242, 242, 245, 0.8);
}
.bar-clock {
  font-weight: 600;
}

@media (max-width: 620px) {
  .bar-menu,
  .bar-date,
  .bar-status {
    display: none;
  }
}
</style>
