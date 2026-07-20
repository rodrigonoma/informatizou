<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{ clientId: string }>();
const emit = defineEmits<{ credential: [string] }>();

interface GoogleId {
  initialize(cfg: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
interface GoogleWindow {
  google?: { accounts?: { id?: GoogleId } };
}

const holder = ref<HTMLElement | null>(null);

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as GoogleWindow;
    if (w.google?.accounts?.id) return resolve();
    const existing = document.getElementById('gsi-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gsi')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.id = 'gsi-script';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gsi'));
    document.head.appendChild(s);
  });
}

onMounted(async () => {
  if (!props.clientId || !holder.value) return;
  try {
    await loadScript();
    const id = (window as unknown as GoogleWindow).google?.accounts?.id;
    if (!id) return;
    id.initialize({
      client_id: props.clientId,
      callback: (r) => emit('credential', r.credential),
    });
    id.renderButton(holder.value, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 300,
      locale: 'pt-BR',
    });
  } catch {
    // silencioso — o login por senha continua disponível
  }
});
</script>

<template>
  <div ref="holder" class="gsi" />
</template>

<style scoped>
.gsi {
  display: flex;
  justify-content: center;
}
</style>
