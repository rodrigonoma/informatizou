<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const { windows, focus, toggleMin } = useDesktop();
const { getApp } = useApps();

const startOpen = ref(false);
const clock = ref('');
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  clock.value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
onMounted(() => {
  tick();
  timer = setInterval(tick, 15000);
});
onBeforeUnmount(() => timer && clearInterval(timer));

const focusedZ = computed(() => Math.max(0, ...windows.value.map((w) => w.z)));

function onTask(id: string, z: number, minimized: boolean) {
  if (z === focusedZ.value && !minimized) toggleMin(id);
  else focus(id);
}
</script>

<template>
  <div class="tb-wrap">
    <Transition name="sm">
      <div v-if="startOpen">
        <div class="sm-back" @click="startOpen = false" />
        <OsStartMenu @close="startOpen = false" />
      </div>
    </Transition>

    <div class="taskbar bevel-thin">
      <button class="start-btn" :class="{ on: startOpen }" @click="startOpen = !startOpen">
        <img src="/logo-mark.png" alt="" class="start-logo" width="18" height="18" />
        <span>Iniciar</span>
      </button>
      <div class="tb-divider" />
      <div class="tasks">
        <button
          v-for="w in windows"
          :key="w.id"
          class="task"
          :class="{ active: w.z === focusedZ && !w.minimized }"
          @click="onTask(w.id, w.z, w.minimized)"
        >
          <span class="task-ico" v-html="getApp(w.id)?.glyph" />
          <span class="task-name">{{ getApp(w.id)?.name }}</span>
        </button>
      </div>
      <div class="tray bevel-in">
        <span class="tray-net">▚</span>
        <span class="tray-clock">{{ clock }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tb-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9000;
}
.sm-back {
  position: fixed;
  inset: 0 0 30px 0;
  z-index: 9500;
}
.taskbar {
  position: relative;
  z-index: 9800;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 3px;
  background: var(--w-face);
}
.start-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 8px 0 4px;
  font-weight: 700;
  font-size: 13px;
  background: var(--w-face);
  box-shadow:
    inset -1px -1px 0 var(--w-dark),
    inset 1px 1px 0 var(--w-hi),
    inset -2px -2px 0 var(--w-shadow),
    inset 2px 2px 0 var(--w-light);
}
.start-btn.on {
  box-shadow:
    inset 1px 1px 0 var(--w-dark),
    inset -1px -1px 0 var(--w-hi),
    inset 2px 2px 0 var(--w-shadow),
    inset -2px -2px 0 var(--w-light);
}
.start-logo {
  width: 18px;
  height: 18px;
  display: block;
}
.tb-divider {
  width: 2px;
  height: 22px;
  border-left: 1px solid var(--w-shadow);
  border-right: 1px solid var(--w-hi);
}
.tasks {
  flex: 1;
  display: flex;
  gap: 3px;
  overflow: hidden;
}
.task {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 130px;
  max-width: 170px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  text-align: left;
  background: var(--w-face);
  box-shadow:
    inset -1px -1px 0 var(--w-dark),
    inset 1px 1px 0 var(--w-hi),
    inset -2px -2px 0 var(--w-shadow),
    inset 2px 2px 0 var(--w-light);
}
.task.active {
  box-shadow:
    inset 1px 1px 0 var(--w-dark),
    inset -1px -1px 0 var(--w-hi),
    inset 2px 2px 0 var(--w-shadow),
    inset -2px -2px 0 var(--w-light);
  background: repeating-conic-gradient(#d7d7d7 0% 25%, #c0c0c0 0% 50%) 0 0 / 3px 3px;
  font-weight: 700;
}
.task-ico {
  width: 16px;
  height: 16px;
  flex: none;
  display: grid;
  place-items: center;
}
.task-ico :deep(svg) {
  width: 15px;
  height: 15px;
  color: #333;
}
.task-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tray {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
}
.tray-net {
  color: #555;
  font-size: 11px;
}
.tray-clock {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 620px) {
  .task-name {
    display: none;
  }
  .task {
    min-width: 34px;
  }
  .start-btn span {
    display: none;
  }
}
</style>
