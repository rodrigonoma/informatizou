<script setup lang="ts">
defineProps<{ title: string }>();
const router = useRouter();
function close() {
  router.push('/');
}
</script>

<template>
  <div class="desk">
    <div class="win bevel-out">
      <div class="win-title">
        <span class="flex items-center gap-2">
          <img src="/logo-mark.png" alt="" width="16" height="16" style="image-rendering: pixelated" />
          {{ title }}
        </span>
        <button type="button" class="tb-x bevel-out" title="Voltar ao site" @click="close">×</button>
      </div>
      <div class="win-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.desk {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: auto;
}
.win {
  width: 100%;
  max-width: 380px;
  background: var(--w-face);
  padding: 3px;
}
.tb-x {
  width: 20px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--w-face);
  color: #000;
  font-size: 12px;
  line-height: 1;
  padding-bottom: 2px;
}
.win-body {
  padding: 16px;
}
</style>
