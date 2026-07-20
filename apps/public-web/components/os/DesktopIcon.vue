<script setup lang="ts">
import type { OsApp } from '~/composables/useApps';

const props = defineProps<{ app: OsApp }>();
const { open } = useDesktop();

function launch() {
  open(props.app.id, { w: props.app.w, h: props.app.h });
}
function onClick() {
  // Toque (ponteiro grosseiro): um toque abre. Mouse: só duplo clique abre.
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) launch();
}
</script>

<template>
  <button class="ic" @dblclick="launch" @click="onClick" :aria-label="`Abrir ${app.name}`">
    <span
      class="ic-tile"
      :style="{ background: `linear-gradient(150deg, ${app.accent}, ${app.accent2})` }"
      v-html="app.glyph"
    />
    <span class="ic-label">{{ app.name }}</span>
  </button>
</template>

<style scoped>
.ic {
  width: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 8px 6px;
  border-radius: 12px;
  transition: background 0.15s;
}
.ic:hover,
.ic:focus-visible {
  background: rgba(255, 255, 255, 0.09);
}
.ic-tile {
  width: 58px;
  height: 58px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.ic-tile :deep(svg) {
  width: 30px;
  height: 30px;
}
.ic-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: #f2f2f5;
  text-align: center;
  line-height: 1.2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}
</style>
