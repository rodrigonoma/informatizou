<script setup lang="ts">
import { computed } from 'vue';
import type { WindowState } from '~/composables/useDesktop';

const props = defineProps<{ win: WindowState }>();

const { getApp } = useApps();
const { close, toggleMin, toggleMax, focus, setPos, isMobile } = useDesktop();

const app = computed(() => getApp(props.win.id));

const style = computed(() => {
  if (props.win.maximized) {
    return {
      top: '44px',
      left: '8px',
      right: '8px',
      bottom: '8px',
      width: 'auto',
      height: 'auto',
      zIndex: String(props.win.z),
    } as Record<string, string>;
  }
  return {
    left: props.win.x + 'px',
    top: props.win.y + 'px',
    width: props.win.w + 'px',
    height: props.win.h + 'px',
    zIndex: String(props.win.z),
  } as Record<string, string>;
});

let dragging = false;
let sx = 0;
let sy = 0;
let ox = 0;
let oy = 0;

function onHeaderDown(e: PointerEvent) {
  focus(props.win.id);
  if (props.win.maximized || isMobile()) return;
  if ((e.target as HTMLElement).closest('.traffic')) return;
  dragging = true;
  sx = e.clientX;
  sy = e.clientY;
  ox = props.win.x;
  oy = props.win.y;
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
function onMove(e: PointerEvent) {
  if (!dragging) return;
  const nx = ox + (e.clientX - sx);
  const ny = Math.max(44, oy + (e.clientY - sy)); // não cobre a barra de menu
  setPos(props.win.id, nx, ny);
}
function onUp() {
  dragging = false;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
}
</script>

<template>
  <section
    v-if="app"
    class="win os-scroll-host"
    :class="{ 'is-max': win.maximized }"
    :style="style"
    @pointerdown="focus(win.id)"
  >
    <header class="win-head" @pointerdown="onHeaderDown" @dblclick="toggleMax(win.id)">
      <div class="traffic">
        <button class="tl tl-close" aria-label="Fechar" @click="close(win.id)"><span>×</span></button>
        <button class="tl tl-min" aria-label="Minimizar" @click="toggleMin(win.id)"><span>–</span></button>
        <button class="tl tl-max" aria-label="Maximizar" @click="toggleMax(win.id)"><span>+</span></button>
      </div>
      <div class="win-title">
        <span class="win-ico" :style="{ color: app.accent }" v-html="app.glyph" />
        {{ app.name }}
      </div>
      <div class="win-spacer" />
    </header>
    <div class="win-body os-scroll">
      <OsProductView :app="app" />
    </div>
  </section>
</template>

<style scoped>
.win {
  position: fixed;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: calc(100vw - 16px);
  background: var(--win-bg);
  color: var(--win-ink);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--win-radius);
  box-shadow: var(--win-shadow);
  backdrop-filter: saturate(180%) blur(24px);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  overflow: hidden;
  animation: win-in 0.28s var(--ease) both;
}
.win-head {
  flex: none;
  height: 42px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 12px;
  background: var(--win-head);
  border-bottom: 1px solid var(--win-hair);
  cursor: grab;
  user-select: none;
}
.win-head:active {
  cursor: grabbing;
}
.traffic {
  display: flex;
  gap: 8px;
  justify-self: start;
}
.tl {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: transparent;
  transition: color 0.15s;
}
.tl span {
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
}
.tl-close {
  background: #ff5f57;
}
.tl-min {
  background: #febc2e;
}
.tl-max {
  background: #28c840;
}
.traffic:hover .tl {
  color: rgba(0, 0, 0, 0.5);
}
.win-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--win-ink);
  white-space: nowrap;
}
.win-ico {
  width: 16px;
  height: 16px;
  display: block;
}
.win-ico :deep(svg) {
  width: 16px;
  height: 16px;
  display: block;
}
.win-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 760px) {
  .win-head {
    height: 46px;
  }
}
</style>
