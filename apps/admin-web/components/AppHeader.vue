<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  await router.push('/login');
}

const nav = [
  { to: '/dashboard', label: 'Visão geral' },
  { to: '/campaigns', label: 'Campanhas' },
  { to: '/leads', label: 'Leads' },
];
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <div class="flex items-center gap-6">
        <NuxtLink to="/dashboard" class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">I</span>
          <span class="font-semibold">Informatizou</span>
        </NuxtLink>
        <nav class="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
          <NuxtLink
            v-for="n in nav"
            :key="n.to"
            :to="n.to"
            class="hover:text-slate-900"
            active-class="text-brand-700"
          >
            {{ n.label }}
          </NuxtLink>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-600">
          {{ auth.user?.name }}
          <span class="ml-1 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">{{ auth.user?.role }}</span>
        </span>
        <button
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          @click="logout"
        >
          Sair
        </button>
      </div>
    </div>
  </header>
</template>
