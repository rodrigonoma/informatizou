import { defineStore } from 'pinia';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface LoginResponse {
  accessToken: string;
  user: PublicUser;
}

const TOKEN_KEY = 'informatizou.accessToken';
const USER_KEY = 'informatizou.user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as PublicUser | null,
  }),
  getters: {
    isAuthenticated: (state): boolean => Boolean(state.accessToken),
  },
  actions: {
    hydrate() {
      if (import.meta.client) {
        this.accessToken = localStorage.getItem(TOKEN_KEY);
        const raw = localStorage.getItem(USER_KEY);
        this.user = raw ? (JSON.parse(raw) as PublicUser) : null;
      }
    },
    persist() {
      if (import.meta.client) {
        if (this.accessToken) localStorage.setItem(TOKEN_KEY, this.accessToken);
        else localStorage.removeItem(TOKEN_KEY);
        if (this.user) localStorage.setItem(USER_KEY, JSON.stringify(this.user));
        else localStorage.removeItem(USER_KEY);
      }
    },
    async login(email: string, password: string) {
      const config = useRuntimeConfig();
      const res = await $fetch<LoginResponse>('/auth/login', {
        baseURL: config.public.apiBase,
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      });
      this.accessToken = res.accessToken;
      this.user = res.user;
      this.persist();
    },
    async fetchMe() {
      if (!this.accessToken) return;
      const config = useRuntimeConfig();
      this.user = await $fetch<PublicUser>('/auth/me', {
        baseURL: config.public.apiBase,
        headers: { Authorization: `Bearer ${this.accessToken}` },
        credentials: 'include',
      });
      this.persist();
    },
    async logout() {
      const config = useRuntimeConfig();
      try {
        await $fetch('/auth/logout', {
          baseURL: config.public.apiBase,
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // ignora falha de logout no servidor; limpa localmente de qualquer forma
      }
      this.accessToken = null;
      this.user = null;
      this.persist();
    },
  },
});
