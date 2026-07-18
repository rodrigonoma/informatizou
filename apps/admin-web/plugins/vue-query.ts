import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

/** Instala o TanStack Vue Query (spec §4 — data fetching do painel). */
export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  });
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });
});
