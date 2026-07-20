<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePortal } from '~/composables/usePortal';

useHead({
  title: 'Informatizou · Painel do Cliente',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const { login, token } = usePortal();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

onMounted(() => {
  // Já autenticado → segue direto para o painel.
  if (token.value) router.replace('/painel');
});

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await login(email.value.trim(), password.value);
    await router.replace('/painel');
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    error.value = status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="desk">
    <div class="win bevel-out" role="dialog" aria-label="Acesso ao painel">
      <div class="win-title">
        <span class="flex items-center gap-2">
          <img src="/logo-mark.png" alt="" width="16" height="16" style="image-rendering: pixelated" />
          Informatizou — Acesso ao Painel
        </span>
        <span class="tb-btns"><span class="tb-x bevel-out">×</span></span>
      </div>

      <div class="win-body">
        <div class="intro">
          <img src="/logo-mark.png" alt="Informatizou" width="40" height="40" />
          <p>
            Bem-vindo ao <b>Painel do Cliente</b>. Entre para configurar seu chatbot,
            acompanhar conversas e relatórios, e ver os sites do seu negócio.
          </p>
        </div>

        <form class="form" @submit.prevent="submit">
          <label class="win-label" for="email">E-mail</label>
          <input id="email" v-model="email" type="email" class="win-input" autocomplete="username" required />

          <label class="win-label" for="senha">Senha</label>
          <input
            id="senha"
            v-model="password"
            type="password"
            class="win-input"
            autocomplete="current-password"
            required
          />

          <p v-if="error" class="err bevel-in">⚠ {{ error }}</p>

          <div class="actions">
            <button type="submit" class="btn95" :disabled="loading">
              {{ loading ? 'Entrando…' : 'Entrar' }}
            </button>
            <NuxtLink to="/" class="btn95" style="text-decoration: none; display: inline-flex; align-items: center">
              Voltar ao site
            </NuxtLink>
          </div>
        </form>

        <p class="hint">
          Ainda não tem acesso? Fale com a Informatizou pelo
          <NuxtLink to="/">site</NuxtLink> para ativar o seu painel.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.desk {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: auto;
}
.win {
  width: 100%;
  max-width: 380px;
  background: var(--w-face);
  padding: 3px;
}
.tb-btns {
  display: flex;
  gap: 2px;
}
.tb-x {
  width: 18px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--w-face);
  color: #000;
  font-size: 12px;
  line-height: 1;
  padding-bottom: 2px;
}
.win-body {
  padding: 14px;
}
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
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.err {
  background: #fff;
  color: #a00000;
  font-size: 12px;
  padding: 6px 8px;
  margin: 2px 0 4px;
}
.hint {
  margin-top: 14px;
  font-size: 11px;
  color: #202020;
  line-height: 1.4;
}
</style>
