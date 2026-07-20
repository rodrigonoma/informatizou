import { reactive, computed } from 'vue';

export interface WindowState {
  id: string;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  w: number;
  h: number;
}

interface DesktopStore {
  windows: WindowState[];
  zTop: number;
  off: boolean;
}

// Estado compartilhado (singleton de módulo) — todos os componentes do SO usam.
const store = reactive<DesktopStore>({ windows: [], zTop: 10, off: false });

let openCount = 0;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 760;
}

/** Gerenciador de janelas do InformatizouOS. */
export function useDesktop() {
  const find = (id: string) => store.windows.find((w) => w.id === id);

  function focus(id: string) {
    const w = find(id);
    if (!w) return;
    store.zTop += 1;
    w.z = store.zTop;
    w.minimized = false;
  }

  function open(id: string, size?: { w?: number; h?: number }) {
    const existing = find(id);
    if (existing) {
      focus(id);
      return;
    }
    const w = Math.min(size?.w ?? 620, 640);
    const h = Math.min(size?.h ?? 460, 560);
    // Posição em cascata determinística (evita mismatch de hidratação).
    const step = openCount % 6;
    openCount += 1;
    const baseX = typeof window !== 'undefined' ? Math.max(24, window.innerWidth / 2 - w / 2) : 220;
    const baseY = typeof window !== 'undefined' ? Math.max(52, window.innerHeight / 2 - h / 2 - 20) : 120;
    store.zTop += 1;
    store.windows.push({
      id,
      x: Math.round(baseX + step * 30 - 75),
      y: Math.round(baseY + step * 26 - 60),
      z: store.zTop,
      minimized: false,
      maximized: isMobile(),
      w,
      h,
    });
  }

  function close(id: string) {
    const i = store.windows.findIndex((w) => w.id === id);
    if (i !== -1) store.windows.splice(i, 1);
  }

  function toggleMin(id: string) {
    const w = find(id);
    if (w) w.minimized = !w.minimized;
  }

  function toggleMax(id: string) {
    const w = find(id);
    if (w) {
      w.maximized = !w.maximized;
      focus(id);
    }
  }

  function setPos(id: string, x: number, y: number) {
    const w = find(id);
    if (!w) return;
    w.x = x;
    w.y = y;
  }

  const isOpen = (id: string) => store.windows.some((w) => w.id === id && !w.minimized);
  const hasWindow = (id: string) => store.windows.some((w) => w.id === id);

  function shutdown() {
    store.windows.splice(0, store.windows.length);
    store.off = true;
  }
  function restart() {
    store.off = false;
  }

  return {
    windows: computed(() => store.windows),
    off: computed(() => store.off),
    open,
    close,
    focus,
    toggleMin,
    toggleMax,
    setPos,
    isOpen,
    hasWindow,
    isMobile,
    shutdown,
    restart,
  };
}
