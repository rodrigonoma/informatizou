import { useAuthStore } from '~/stores/auth';

/** Cliente HTTP autenticado contra a API (injeta Bearer + baseURL).
 *  No 401, renova o token (refresh cookie) e repete a chamada uma vez;
 *  se a renovação falhar, encerra a sessão e volta ao login. */
export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  async function api<T>(path: string, opts: Record<string, unknown> = {}, retried = false): Promise<T> {
    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        credentials: 'include',
        ...opts,
        headers: {
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
          ...((opts.headers as Record<string, string>) ?? {}),
        },
      });
    } catch (err) {
      const status =
        (err as { statusCode?: number }).statusCode ??
        (err as { response?: { status?: number } }).response?.status;
      if (status === 401 && !retried) {
        if (await auth.refresh()) return api<T>(path, opts, true);
        auth.clearLocal();
        if (import.meta.client) await navigateTo('/login');
      }
      throw err;
    }
  }

  return api;
}
