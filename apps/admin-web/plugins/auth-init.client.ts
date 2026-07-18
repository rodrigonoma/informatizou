import { useAuthStore } from '~/stores/auth';

/** Hidrata o estado de autenticação a partir do localStorage no boot (SPA). */
export default defineNuxtPlugin(() => {
  const auth = useAuthStore();
  auth.hydrate();
});
