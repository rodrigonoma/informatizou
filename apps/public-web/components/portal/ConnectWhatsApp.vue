<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{ appId: string; configId: string }>();
const emit = defineEmits<{
  connected: [{ code: string; phoneNumberId: string; wabaId: string }];
  error: [string];
}>();

interface FbLoginResponse {
  authResponse?: { code?: string };
  status?: string;
}
interface FacebookSdk {
  init(cfg: { appId: string; autoLogAppEvents?: boolean; xfbml?: boolean; version: string }): void;
  login(cb: (r: FbLoginResponse) => void, opts: Record<string, unknown>): void;
}
interface FbWindow {
  FB?: FacebookSdk;
  fbAsyncInit?: () => void;
}

const loading = ref(false);
const ready = ref(false);
// Guardado do evento postMessage do Embedded Signup (chega antes do callback).
const session = { phoneNumberId: '', wabaId: '' };

function onMessage(e: MessageEvent) {
  if (!/facebook\.com$/.test(new URL(e.origin).host)) return;
  try {
    const data = JSON.parse(e.data);
    if (data?.type === 'WA_EMBEDDED_SIGNUP' && data?.data) {
      if (data.data.phone_number_id) session.phoneNumberId = data.data.phone_number_id;
      if (data.data.waba_id) session.wabaId = data.data.waba_id;
    }
  } catch {
    // mensagens não-JSON do FB — ignora
  }
}

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as FbWindow;
    if (w.FB) return resolve();
    w.fbAsyncInit = () => {
      w.FB!.init({ appId: props.appId, autoLogAppEvents: true, xfbml: false, version: 'v21.0' });
      resolve();
    };
    if (document.getElementById('facebook-jssdk')) return;
    const s = document.createElement('script');
    s.id = 'facebook-jssdk';
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.onerror = () => reject(new Error('sdk'));
    document.body.appendChild(s);
  });
}

onMounted(async () => {
  if (!props.appId || !props.configId) return;
  window.addEventListener('message', onMessage);
  try {
    await loadSdk();
    ready.value = true;
  } catch {
    emit('error', 'Não foi possível carregar o Facebook.');
  }
});
onBeforeUnmount(() => window.removeEventListener('message', onMessage));

function connect() {
  const w = window as unknown as FbWindow;
  if (!w.FB) return;
  loading.value = true;
  session.phoneNumberId = '';
  session.wabaId = '';
  w.FB.login(
    (response) => {
      loading.value = false;
      const code = response.authResponse?.code;
      if (code && session.phoneNumberId && session.wabaId) {
        emit('connected', { code, phoneNumberId: session.phoneNumberId, wabaId: session.wabaId });
      } else if (!code) {
        emit('error', 'Conexão cancelada.');
      } else {
        emit('error', 'Não recebemos os dados do número. Tente novamente.');
      }
    },
    {
      config_id: props.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: { setup: {}, sessionInfoVersion: '3' },
    },
  );
}
</script>

<template>
  <button class="btn95" :disabled="!ready || loading" @click="connect">
    {{ loading ? 'Conectando…' : '📱 Conectar meu WhatsApp' }}
  </button>
</template>
