<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// Redireciona conforme o estado de autenticação.
const auth = useAuthStore();
onMounted(() => {
  navigateTo(auth.isAuthenticated ? '/dashboard' : '/login');
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center text-slate-400">
    Redirecionando…
  </div>
</template>
