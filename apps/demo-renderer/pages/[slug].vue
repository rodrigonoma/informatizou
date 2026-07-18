<script setup lang="ts">
import { ROBOTS_DIRECTIVE, DEMO_UNAVAILABLE } from '~/utils/demo-notices';

interface DemoResponse {
  available: boolean;
  slug: string;
  template: string;
  content: Record<string, unknown>;
  designTokens: Record<string, unknown>;
  expiresAt: string | null;
}

const route = useRoute();
const config = useRuntimeConfig();
const slug = computed(() => String(route.params.slug ?? ''));

// Busca SSR do conteúdo público da demo (publicada e não expirada).
const { data: demo } = await useFetch<DemoResponse>(
  () => `${config.apiBase}/public/demos/${slug.value}`,
  { server: true, key: () => `demo-${slug.value}`, default: () => null, ignoreResponseError: true },
);

const available = computed(() => demo.value?.available === true);

// Compliance sempre (§20).
useHead({
  title: available.value
    ? `${(demo.value?.content?.businessName as string) ?? 'Demonstração'} · Demonstração`
    : 'Demonstração indisponível · Informatizou',
  meta: [{ name: 'robots', content: ROBOTS_DIRECTIVE }],
});

// Registra visualização (analytics §23) no cliente.
onMounted(() => {
  if (available.value) {
    void $fetch(`${config.apiBase}/public/demos/${slug.value}/event`, {
      method: 'POST',
      body: { type: 'view', device: 'web', referrer: document.referrer || undefined },
    }).catch(() => {});
  }
});
</script>

<template>
  <div>
    <template v-if="available && demo">
      <DemoNoticeBanner />
      <DemoTemplate :content="demo.content as any" :tokens="demo.designTokens as any" />
      <DemoNoticeFooter />
    </template>

    <main v-else class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
        I
      </div>
      <h1 class="mt-6 max-w-lg text-2xl font-semibold tracking-tight">{{ DEMO_UNAVAILABLE.title }}</h1>
      <p class="mt-3 max-w-md text-slate-500">{{ DEMO_UNAVAILABLE.body }}</p>
      <p class="mt-4 font-medium text-slate-700">{{ DEMO_UNAVAILABLE.question }}</p>
      <a
        href="https://www.informatizou.com.br"
        class="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        {{ DEMO_UNAVAILABLE.cta }}
      </a>
    </main>
  </div>
</template>
