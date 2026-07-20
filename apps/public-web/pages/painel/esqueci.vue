<script setup lang="ts">
import { ref } from 'vue';
import { usePortal } from '~/composables/usePortal';

useHead({
  title: 'Informatizou · Esqueci minha senha',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const { forgot } = usePortal();

const email = ref('');
const loading = ref(false);
const sent = ref(false);
const devLink = ref('');

async function submit() {
  loading.value = true;
  try {
    const res = await forgot(email.value.trim());
    devLink.value = res.devLink ?? '';
    sent.value = true;
  } catch {
    // Resposta é neutra por segurança — mostramos sucesso de qualquer forma.
    sent.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <PortalAuthShell title="Informatizou — Recuperar senha">
    <div class="intro">
      <img src="/logo-mark.png" alt="Informatizou" width="40" height="40" />
      <p>Informe o e-mail da sua conta. Se houver um cadastro, enviaremos um link para você criar uma nova senha.</p>
    </div>

    <template v-if="!sent">
      <form class="form" @submit.prevent="submit">
        <label class="win-label" for="email">E-mail</label>
        <input id="email" v-model="email" type="email" class="win-input" autocomplete="username" required />
        <div class="actions">
          <button type="submit" class="btn95" :disabled="loading">{{ loading ? 'Enviando…' : 'Enviar link' }}</button>
        </div>
      </form>
    </template>

    <template v-else>
      <p class="ok bevel-in">✓ Se este e-mail estiver cadastrado, o link de redefinição foi enviado. Confira sua caixa de entrada (e o spam).</p>
      <p v-if="devLink" class="dev bevel-in">
        <b>Ambiente de teste:</b><br />
        <NuxtLink :to="devLink.replace(/^https?:\/\/[^/]+/, '')">{{ devLink }}</NuxtLink>
      </p>
    </template>

    <p class="hint"><NuxtLink to="/painel/login">← Voltar ao login</NuxtLink></p>
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
.actions {
  margin-top: 10px;
}
.ok {
  background: #fff;
  color: #006000;
  font-size: 12px;
  padding: 8px;
  line-height: 1.4;
}
.dev {
  background: #fff;
  font-size: 11px;
  padding: 8px;
  margin-top: 8px;
  word-break: break-all;
}
.hint {
  margin-top: 14px;
  font-size: 11px;
}
</style>
