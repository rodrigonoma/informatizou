<script setup lang="ts">
const { desktopApps, getApp } = useApps();
const { open, shutdown } = useDesktop();

const produtos = desktopApps.filter((a) => a.kind === 'product');
const emit = defineEmits<{ close: [] }>();

function launch(id: string) {
  const a = getApp(id);
  open(id, { w: a?.w, h: a?.h });
  emit('close');
}
function desligar() {
  shutdown();
  emit('close');
}
</script>

<template>
  <div class="start bevel-out">
    <div class="start-side"><span>Informatizou<b>OS</b></span></div>
    <div class="start-items">
      <button v-for="p in produtos" :key="p.id" class="mi" @click="launch(p.id)">
        <span class="mi-ico" v-html="p.glyph" />
        <span class="mi-label">{{ p.name }}</span>
      </button>
      <div class="mi-sep" />
      <button class="mi" @click="launch('bem-vindo')">
        <span class="mi-ico" v-html="getApp('bem-vindo')?.glyph" />
        <span class="mi-label">Leia-me</span>
      </button>
      <button class="mi" @click="launch('contato')">
        <span class="mi-ico" v-html="getApp('contato')?.glyph" />
        <span class="mi-label">Contato</span>
      </button>
      <div class="mi-sep" />
      <button class="mi" @click="desligar()">
        <span class="mi-ico mi-power">⏻</span>
        <span class="mi-label">Desligar…</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.start {
  position: absolute;
  bottom: 30px;
  left: 2px;
  z-index: 10000;
  display: flex;
  min-width: 250px;
  background: var(--w-face);
  padding: 3px;
}
.start-side {
  width: 30px;
  flex: none;
  background: linear-gradient(180deg, #000080, #1084d0);
  position: relative;
}
.start-side span {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%) rotate(-90deg);
  transform-origin: center;
  white-space: nowrap;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.start-side b {
  color: #c8e6ff;
}
.start-items {
  flex: 1;
  padding: 2px;
}
.mi {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 6px;
  color: #000;
  font-size: 13px;
  text-align: left;
}
.mi:hover {
  background: var(--w-navy);
  color: #fff;
}
.mi-ico {
  width: 26px;
  height: 26px;
  flex: none;
  display: grid;
  place-items: center;
}
.mi-ico :deep(svg) {
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
}
.mi-power {
  background: #b00;
  font-size: 15px;
}
.mi-label {
  font-weight: 500;
}
.mi-sep {
  height: 1px;
  margin: 4px 3px;
  border-top: 1px solid var(--w-shadow);
  border-bottom: 1px solid var(--w-hi);
}
</style>
