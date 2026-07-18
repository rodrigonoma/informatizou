<script setup lang="ts">
import { DEMO_TOP_NOTICE } from '~/utils/demo-notices';
</script>

<template>
  <!-- Aviso obrigatório de demonstração no topo (§19), visível mas discreto. -->
  <div class="w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
    <strong class="font-semibold">{{ DEMO_TOP_NOTICE.title }}</strong>
    <span class="ml-1 hidden sm:inline">— {{ DEMO_TOP_NOTICE.body }}</span>
  </div>
</template>
