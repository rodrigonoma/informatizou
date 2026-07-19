<script setup lang="ts">
// Shell global do "Informatizou Motion System": camadas de ambiente (sinal,
// grão, vinheta), HUD mínimo e cursor personalizado. O conteúdo vive em pages/.
useMotionSystem();

const contato = 'mailto:contato@informatizou.com.br';
</script>

<template>
  <div class="shell">
    <!-- Ambiente vivo -->
    <div class="env-signal" aria-hidden="true" />
    <div class="env-vignette" aria-hidden="true" />
    <div class="env-grain" aria-hidden="true" />
    <div class="env-cursor" aria-hidden="true" />

    <!-- HUD superior (índice, não navbar) -->
    <header class="hud-bar">
      <NuxtLink to="/" class="wordmark" data-cursor aria-label="Informatizou — início">
        INFORMATIZOU
      </NuxtLink>
      <div class="hud-right">
        <span class="hud status"><i class="hud-dot" />sistema vivo</span>
        <a :href="contato" class="hud contact" data-magnetic data-magnetic-strength="0.4">
          conversar<span class="arr">→</span>
        </a>
      </div>
    </header>

    <NuxtPage />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

.hud-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(1rem, 2.6vw, 1.7rem) var(--edge);
  mix-blend-mode: difference;
}

.wordmark {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.42em;
  color: var(--ink);
}

.hud-right {
  display: flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.4rem);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}
.status .hud-dot {
  margin-top: -1px;
}

.contact {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink);
  will-change: transform;
  transition: transform 0.5s var(--ease-spring);
}
.contact .arr {
  display: inline-block;
  transition: transform 0.4s var(--ease-spring);
}
.contact:hover .arr {
  transform: translateX(5px);
}

@media (max-width: 640px) {
  .status {
    display: none;
  }
}
</style>
