<script setup lang="ts">
const { dockApps } = useApps();
const { open, hasWindow } = useDesktop();
</script>

<template>
  <nav class="dock" aria-label="Dock de produtos">
    <button
      v-for="a in dockApps"
      :key="a.id"
      class="dock-item"
      :title="a.name"
      :aria-label="a.name"
      @click="open(a.id, { w: a.w, h: a.h })"
    >
      <span
        class="dock-ico"
        :style="{ background: `linear-gradient(150deg, ${a.accent}, ${a.accent2})` }"
        v-html="a.glyph"
      />
      <span class="dock-tip">{{ a.name }}</span>
      <span class="dock-run" :class="{ on: hasWindow(a.id) }" />
    </button>
  </nav>
</template>

<style scoped>
.dock {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 8000;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
}
.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dock-ico {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.22s var(--ease);
}
.dock-ico :deep(svg) {
  width: 25px;
  height: 25px;
}
.dock-item:hover .dock-ico {
  transform: translateY(-8px) scale(1.14);
}
.dock-tip {
  position: absolute;
  bottom: 58px;
  padding: 4px 9px;
  background: rgba(20, 20, 26, 0.92);
  color: #fff;
  font-size: 0.75rem;
  white-space: nowrap;
  border-radius: 7px;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition: opacity 0.15s, transform 0.15s;
}
.dock-item:hover .dock-tip {
  opacity: 1;
  transform: translateY(0);
}
.dock-run {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin-top: 4px;
  background: transparent;
}
.dock-run.on {
  background: rgba(255, 255, 255, 0.85);
}

@media (max-width: 620px) {
  .dock {
    bottom: 8px;
    gap: 4px;
    padding: 6px 8px;
    max-width: calc(100vw - 20px);
    overflow-x: auto;
  }
  .dock-ico {
    width: 40px;
    height: 40px;
  }
  .dock-item:hover .dock-ico {
    transform: none;
  }
}
</style>
