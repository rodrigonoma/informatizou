import { useState, useCookie, useRuntimeConfig } from '#imports';

export interface PortalCustomer {
  id: string;
  name: string;
  email: string | null;
  portalEmail: string | null;
  lastPortalLoginAt: string | null;
}

interface LoginResponse {
  accessToken: string;
  customer: PortalCustomer;
}

/**
 * Autenticação do painel do cliente (área logada do negócio), no mesmo site
 * institucional (InformatizouOS). Token de acesso em cookie legível pelo JS;
 * refresh token fica em cookie httpOnly (definido pela API).
 */
export function usePortal() {
  const config = useRuntimeConfig();
  const base = config.public.apiBase;
  // Cookie do access token (curta duração) — legível no cliente e no SSR.
  const token = useCookie<string | null>('portal_token', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    default: () => null,
  });
  const customer = useState<PortalCustomer | null>('portal-customer', () => null);

  async function tryRefresh(): Promise<boolean> {
    try {
      const res = await $fetch<{ accessToken: string }>('/portal/auth/refresh', {
        baseURL: base,
        method: 'POST',
        credentials: 'include',
      });
      token.value = res.accessToken;
      return true;
    } catch {
      return false;
    }
  }

  async function api<T>(path: string, opts: Record<string, unknown> = {}, retried = false): Promise<T> {
    try {
      return await $fetch<T>(path, {
        baseURL: base,
        credentials: 'include',
        ...opts,
        headers: {
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
          ...((opts.headers as Record<string, string>) ?? {}),
        },
      });
    } catch (err) {
      const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode ??
        (err as { response?: { status?: number } }).response?.status;
      if (status === 401 && !retried) {
        if (await tryRefresh()) return api<T>(path, opts, true);
        token.value = null;
        customer.value = null;
      }
      throw err;
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const res = await $fetch<LoginResponse>('/portal/auth/login', {
      baseURL: base,
      method: 'POST',
      credentials: 'include',
      body: { email, password },
    });
    token.value = res.accessToken;
    customer.value = res.customer;
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    const res = await $fetch<LoginResponse>('/portal/auth/register', {
      baseURL: base,
      method: 'POST',
      credentials: 'include',
      body: { name, email, password },
    });
    token.value = res.accessToken;
    customer.value = res.customer;
  }

  async function loginWithGoogle(credential: string): Promise<void> {
    const res = await $fetch<LoginResponse>('/portal/auth/google', {
      baseURL: base,
      method: 'POST',
      credentials: 'include',
      body: { credential },
    });
    token.value = res.accessToken;
    customer.value = res.customer;
  }

  function forgot(email: string): Promise<{ ok: boolean; devLink?: string }> {
    return $fetch('/portal/auth/forgot', { baseURL: base, method: 'POST', body: { email } });
  }

  function resetPassword(resetToken: string, password: string): Promise<{ ok: boolean }> {
    return $fetch('/portal/auth/reset', {
      baseURL: base,
      method: 'POST',
      body: { token: resetToken, password },
    });
  }

  async function fetchMe(): Promise<boolean> {
    if (!token.value) {
      if (!(await tryRefresh())) return false;
    }
    try {
      customer.value = await api<PortalCustomer>('/portal/me');
      return true;
    } catch {
      return false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/portal/auth/logout', { baseURL: base, method: 'POST', credentials: 'include' });
    } catch {
      // ignora — limpa o estado local de qualquer forma
    }
    token.value = null;
    customer.value = null;
  }

  return { token, customer, api, login, register, loginWithGoogle, forgot, resetPassword, logout, fetchMe };
}
