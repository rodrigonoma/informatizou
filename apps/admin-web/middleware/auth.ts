import { useAuthStore } from '~/stores/auth';

/** Protege rotas: redireciona para /login quando não autenticado. */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login');
  }
});
