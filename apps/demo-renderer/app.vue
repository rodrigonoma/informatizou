<script setup lang="ts">
import { ROBOTS_DIRECTIVE } from '~/utils/demo-notices';

// Reforço do meta robots em nível de app (§20).
useHead({
  meta: [{ name: 'robots', content: ROBOTS_DIRECTIVE }],
});
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 antialiased">
    <NuxtPage />
  </div>
</template>
