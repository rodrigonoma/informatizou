<script setup lang="ts">
import { computed } from 'vue';
import type { WindowState } from '~/composables/useDesktop';

const props = defineProps<{ win: WindowState }>();

const { getApp } = useApps();
const { windows, close, toggleMin, toggleMax, focus, setPos, isMobile } = useDesktop();

const app = computed(() => getApp(props.win.id));
const focused = computed(() => {
  const maxZ = Math.max(...windows.value.map((w) => w.z));
  return props.win.z === maxZ;
});

const style = computed(() => {
  if (props.win.maximized) {
    return { top: '0px', left: '0px', right: '0px', bottom: '30px', width: 'auto', height: 'auto', zIndex: String(props.win.z) } as Record<string, string>;
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
  if ((e.target as HTMLElement).closest('.tb-btns')) return;
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
  setPos(props.win.id, ox + (e.clientX - sx), Math.max(0, oy + (e.clientY - sy)));
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
    class="win bevel-out"
    :class="{ 'is-max': win.maximized }"
    :style="style"
    @pointerdown="focus(win.id)"
  >
    <div class="titlebar" :class="{ off: !focused }" @pointerdown="onHeaderDown" @dblclick="toggleMax(win.id)">
      <span class="tb-ico" v-html="app.glyph" />
      <span class="tb-name">{{ app.name }}</span>
      <span class="tb-btns">
        <button class="tb-btn" aria-label="Minimizar" @click="toggleMin(win.id)"><b class="g-min" /></button>
        <button class="tb-btn" aria-label="Maximizar" @click="toggleMax(win.id)"><b class="g-max" /></button>
        <button class="tb-btn tb-close" aria-label="Fechar" @click="close(win.id)"><b class="g-close" /></button>
      </span>
    </div>
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
  min-width: 260px;
  max-width: calc(100vw - 8px);
  background: var(--w-face);
  color: var(--w-ink);
  padding: 3px;
  overflow: hidden;
}
.titlebar {
  flex: none;
  height: 22px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 3px 0 4px;
  background: linear-gradient(90deg, var(--w-navy), var(--w-blue));
  color: #fff;
  cursor: grab;
  user-select: none;
}
.titlebar.off {
  background: var(--w-navy-off);
}
.titlebar:active {
  cursor: grabbing;
}
.tb-ico {
  width: 15px;
  height: 15px;
  display: block;
  color: #fff;
}
.tb-ico :deep(svg) {
  width: 15px;
  height: 15px;
  display: block;
}
.tb-name {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tb-btns {
  display: flex;
  gap: 2px;
}
.tb-btn {
  width: 18px;
  height: 17px;
  display: grid;
  place-items: center;
  background: var(--w-face);
  box-shadow:
    inset -1px -1px 0 var(--w-dark),
    inset 1px 1px 0 var(--w-hi),
    inset -2px -2px 0 var(--w-shadow),
    inset 2px 2px 0 var(--w-light);
}
.tb-btn:active {
  box-shadow:
    inset 1px 1px 0 var(--w-dark),
    inset -1px -1px 0 var(--w-hi);
}
.tb-btn b {
  display: block;
}
.g-min {
  width: 7px;
  height: 2px;
  background: #000;
  margin-top: 6px;
}
.g-max {
  width: 9px;
  height: 8px;
  border: 1px solid #000;
  border-top-width: 2px;
}
.g-close {
  width: 8px;
  height: 8px;
  position: relative;
}
.g-close::before,
.g-close::after {
  content: '';
  position: absolute;
  top: 3px;
  left: -1px;
  width: 10px;
  height: 2px;
  background: #000;
}
.g-close::before {
  transform: rotate(45deg);
}
.g-close::after {
  transform: rotate(-45deg);
}
.win-body {
  flex: 1;
  margin-top: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--w-face);
}
</style>
