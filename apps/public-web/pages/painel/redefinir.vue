<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePortal } from '~/composables/usePortal';

useHead({
  title: 'Informatizou · Redefinir senha',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const { resetPassword } = usePortal();
const route = useRoute();
const token = computed(() => String(route.query.token ?? ''));

const password = ref('');
const confirm = ref('');
const loading = ref(false);
const error = ref('');
const done = ref(false);

async function submit() {
  error.value = '';
  if (!token.value) {
    error.value = 'Link inválido — token ausente.';
    return;
  }
  if (password.value.length < 8) {
    error.value = 'A senha precisa ter ao menos 8 caracteres.';
    return;
  }
  if (password.value !== confirm.value) {
    error.value = 'As senhas não coincidem.';
    return;
  }
  loading.value = true;
  try {
    await resetPassword(token.value, password.value);
    done.value = true;
  } catch {
    error.value = 'Link inválido ou expirado. Solicite um novo.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <PortalAuthShell title="Informatizou — Nova senha">
    <div class="intro">
      <img src="/logo-mark.png" alt="Informatizou" width="40" height="40" />
      <p>Crie uma nova senha para acessar o seu painel.</p>
    </div>

    <template v-if="!done">
      <form class="form" @submit.prevent="submit">
        <label class="win-label" for="senha">Nova senha</label>
        <input id="senha" v-model="password" type="password" class="win-input" autocomplete="new-password" required minlength="8" placeholder="mín. 8 caracteres" />

        <label class="win-label" for="conf">Confirmar senha</label>
        <input id="conf" v-model="confirm" type="password" class="win-input" autocomplete="new-password" required />

        <p v-if="error" class="err bevel-in">⚠ {{ error }}</p>

        <div class="actions">
          <button type="submit" class="btn95" :disabled="loading">{{ loading ? 'Salvando…' : 'Redefinir senha' }}</button>
        </div>
      </form>
    </template>

    <template v-else>
      <p class="ok bevel-in">✓ Senha redefinida com sucesso! Agora você já pode entrar.</p>
      <div class="actions">
        <NuxtLink to="/painel/login" class="btn95" style="text-decoration: none; display: inline-flex; align-items: center">
          Ir para o login
        </NuxtLink>
      </div>
    </template>

    <p v-if="!done" class="hint"><NuxtLink to="/painel/esqueci">Solicitar novo link</NuxtLink></p>
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
  margin-top: 8px;
}
.err {
  background: #fff;
  color: #a00000;
  font-size: 12px;
  padding: 6px 8px;
  margin: 2px 0 4px;
}
.ok {
  background: #fff;
  color: #006000;
  font-size: 12px;
  padding: 8px;
  line-height: 1.4;
  margin-bottom: 12px;
}
.hint {
  margin-top: 14px;
  font-size: 11px;
}
</style>
