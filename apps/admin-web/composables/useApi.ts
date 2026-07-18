import { useAuthStore } from '~/stores/auth';

/** Cliente HTTP autenticado contra a API (injeta Bearer + baseURL). */
export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  return async function api<T>(path: string, opts: Record<string, unknown> = {}): Promise<T> {
    const headers = {
      ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
      ...((opts.headers as Record<string, string>) ?? {}),
    };
    return $fetch<T>(path, {
      baseURL: config.public.apiBase,
      credentials: 'include',
      ...opts,
      headers,
    });
  };
}
