import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#imports';

/** Protege as páginas do painel do cliente: sem token → volta para o login. */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/painel/login') return;
  const token = useCookie<string | null>('portal_token');
  if (!token.value) {
    return navigateTo('/painel/login');
  }
});
