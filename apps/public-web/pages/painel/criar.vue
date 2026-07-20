<script setup lang="ts">
import { ref } from 'vue';
import { usePortal } from '~/composables/usePortal';

useHead({
  title: 'Informatizou · Criar conta',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const { register, loginWithGoogle } = usePortal();
const router = useRouter();
const config = useRuntimeConfig();
const googleClientId = config.public.googleClientId as string;

const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  if (password.value.length < 8) {
    error.value = 'A senha precisa ter ao menos 8 caracteres.';
    return;
  }
  loading.value = true;
  try {
    await register(name.value.trim(), email.value.trim(), password.value);
    await router.replace('/painel');
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    error.value =
      status === 409 ? 'Já existe uma conta com este e-mail.' : 'Não foi possível criar a conta. Tente novamente.';
  } finally {
    loading.value = false;
  }
}

async function onGoogle(credential: string) {
  error.value = '';
  loading.value = true;
  try {
    await loginWithGoogle(credential);
    await router.replace('/painel');
  } catch {
    error.value = 'Não foi possível entrar com o Google.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <PortalAuthShell title="Informatizou — Criar conta">
    <div class="intro">
      <img src="/logo-mark.png" alt="Informatizou" width="40" height="40" />
      <p>Crie sua conta para acessar o <b>Painel do Cliente</b> e configurar seu chatbot, acompanhar conversas e ver seus sites.</p>
    </div>

    <form class="form" @submit.prevent="submit">
      <label class="win-label" for="nome">Nome / Empresa</label>
      <input id="nome" v-model="name" class="win-input" required minlength="2" />

      <label class="win-label" for="email">E-mail</label>
      <input id="email" v-model="email" type="email" class="win-input" autocomplete="username" required />

      <label class="win-label" for="senha">Senha</label>
      <input id="senha" v-model="password" type="password" class="win-input" autocomplete="new-password" required minlength="8" placeholder="mín. 8 caracteres" />

      <p v-if="error" class="err bevel-in">⚠ {{ error }}</p>

      <div class="actions">
        <button type="submit" class="btn95" :disabled="loading">{{ loading ? 'Criando…' : 'Criar conta' }}</button>
      </div>
    </form>

    <template v-if="googleClientId">
      <div class="sep"><span>ou</span></div>
      <PortalGoogleSignInButton :client-id="googleClientId" @credential="onGoogle" />
    </template>

    <p class="hint">Já tem conta? <NuxtLink to="/painel/login">Entrar</NuxtLink>.</p>
  </PortalAuthShell>
</template>

<style scoped>
.intro {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}
.intro img {
  image-rendering: pixelated;
  flex: none;
}
.intro p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.form {
  display: grid;
  gap: 5px;
}
.form .win-input {
  margin-bottom: 6px;
}
.actions {
  margin-top: 6px;
}
.err {
  background: #fff;
  color: #a00000;
  font-size: 12px;
  padding: 6px 8px;
  margin: 2px 0 4px;
}
.sep {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0;
  color: #505050;
  font-size: 11px;
}
.sep::before,
.sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--w-shadow);
}
.hint {
  margin-top: 14px;
  font-size: 11px;
  color: #202020;
}
</style>
