<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { loginSchema } from '@informatizou/shared';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const errorMsg = ref<string | null>(null);
const loading = ref(false);

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(loginSchema),
});
const [email, emailAttrs] = defineField('email');
const [password, passwordAttrs] = defineField('password');

const onSubmit = handleSubmit(async (values) => {
  errorMsg.value = null;
  loading.value = true;
  try {
    await auth.login(values.email, values.password);
    await router.push('/dashboard');
  } catch {
    errorMsg.value = 'Credenciais inválidas. Verifique e tente novamente.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          I
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">Informatizou</h1>
        <p class="text-sm text-slate-500">Painel de prospecção</p>
      </div>

      <form
        class="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        @submit="onSubmit"
      >
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            autocomplete="username"
            placeholder="voce@informatizou.com.br"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700" for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            v-bind="passwordAttrs"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
        </div>

        <p v-if="errorMsg" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-slate-400">
        Ambiente de desenvolvimento · use as credenciais de seed
      </p>
    </div>
  </div>
</template>
