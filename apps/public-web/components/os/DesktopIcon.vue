<script setup lang="ts">
import type { OsApp } from '~/composables/useApps';

const props = defineProps<{ app: OsApp }>();
const { open } = useDesktop();

function launch() {
  open(props.app.id, { w: props.app.w, h: props.app.h });
}
function onClick() {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) launch();
}
</script>

<template>
  <button class="ic" @dblclick="launch" @click="onClick" :aria-label="`Abrir ${app.name}`">
    <span class="ic-tile" :style="{ background: app.accent }" v-html="app.glyph" />
    <span class="ic-label">{{ app.name }}</span>
  </button>
</template>

<style scoped>
.ic {
  width: 78px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
}
.ic-tile {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.4), inset 1px 1px 0 rgba(255, 255, 255, 0.45);
}
.ic-tile :deep(svg) {
  width: 22px;
  height: 22px;
}
.ic-label {
  font-size: 12px;
  color: #fff;
  text-align: center;
  line-height: 1.15;
  padding: 1px 3px;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
}
.ic:focus {
  outline: none;
}
.ic:focus .ic-label {
  background: var(--w-navy);
  outline: 1px dotted #fff;
  text-shadow: none;
}
.ic:focus .ic-tile {
  filter: brightness(0.85);
}
</style>
