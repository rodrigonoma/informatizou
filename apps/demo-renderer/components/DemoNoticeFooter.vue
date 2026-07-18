<script setup lang="ts">
import { DEMO_FOOTER_NOTICE } from '~/utils/demo-notices';
</script>

<template>
  <!-- Aviso obrigatório de demonstração no rodapé (§19). -->
  <footer class="border-t border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
    <p class="font-medium text-slate-600">{{ DEMO_FOOTER_NOTICE.line1 }}</p>
    <p class="mx-auto mt-1 max-w-2xl">{{ DEMO_FOOTER_NOTICE.line2 }}</p>
  </footer>
</template>
