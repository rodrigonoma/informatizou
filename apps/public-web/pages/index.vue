<script setup lang="ts">
import { ref, onMounted } from 'vue';

// InformatizouOS — o portfólio como um sistema operacional.
const { desktopApps } = useApps();
const { windows, open } = useDesktop();

const booting = ref(true);

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Abre a janela de boas-vindas ao iniciar o "sistema".
  open('bem-vindo', { w: 560, h: 440 });
  if (reduce) {
    booting.value = false;
  } else {
    setTimeout(() => (booting.value = false), 1150);
  }
});
</script>

<template>
  <div class="desk">
    <!-- Papel de parede -->
    <div class="wall" aria-hidden="true">
      <div class="wall-glow g1" />
      <div class="wall-glow g2" />
      <div class="wall-glow g3" />
      <div class="wall-grid" />
    </div>

    <OsMenuBar />

    <!-- Ícones da área de trabalho -->
    <div class="icons">
      <OsDesktopIcon v-for="a in desktopApps" :key="a.id" :app="a" />
    </div>

    <!-- Janelas abertas -->
    <template v-for="w in windows" :key="w.id">
      <OsAppWindow v-if="!w.minimized" :win="w" />
    </template>

    <OsDock />

    <!-- Boot splash -->
    <Transition name="boot">
      <div v-if="booting" class="boot" @click="booting = false">
        <img src="/logo-mark.png" alt="Informatizou" class="boot-logo" width="84" height="84" />
        <div class="boot-name">InformatizouOS</div>
        <div class="boot-bar"><span /></div>
      </div>
    </Transition>

    <!-- Conteúdo indexável (acessível a leitores/crawlers) -->
    <div class="sr-only">
      <h1>Informatizou — sistema completo para digitalizar o seu negócio</h1>
      <p>
        A Informatizou cria, hospeda e mantém a presença digital de pequenos e médios negócios.
        Conheça nossos produtos:
      </p>
      <section v-for="a in desktopApps.filter((x) => x.kind === 'product')" :key="a.id">
        <h2>{{ a.name }}</h2>
        <p>{{ a.tagline }}</p>
        <p>{{ a.intro }}</p>
        <ul>
          <li v-for="f in a.features" :key="f.t">{{ f.t }}: {{ f.d }}</li>
        </ul>
      </section>
      <p>Fale conosco: <a href="mailto:contato@informatizou.com.br">contato@informatizou.com.br</a></p>
    </div>
  </div>
</template>

<style scoped>
.desk {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

/* Papel de parede: escuro com auroras neon da marca */
.wall {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(120% 90% at 50% -10%, #1a1730 0%, transparent 55%),
    linear-gradient(160deg, var(--desk-2), var(--desk-1));
}
.wall-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
}
.g1 {
  width: 46vmax;
  height: 46vmax;
  left: -12vmax;
  top: -10vmax;
  background: radial-gradient(circle, rgba(255, 106, 61, 0.5), transparent 62%);
}
.g2 {
  width: 40vmax;
  height: 40vmax;
  right: -10vmax;
  top: 4vmax;
  background: radial-gradient(circle, rgba(59, 157, 255, 0.5), transparent 62%);
}
.g3 {
  width: 52vmax;
  height: 52vmax;
  left: 30vmax;
  bottom: -26vmax;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.42), transparent 62%);
}
.wall-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(120% 120% at 50% 40%, #000 30%, transparent 78%);
}

/* Ícones */
.icons {
  position: absolute;
  top: 50px;
  left: 14px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 6px;
  max-height: calc(100vh - 120px);
}

/* Boot splash */
.boot {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: linear-gradient(160deg, var(--desk-2), var(--desk-1));
}
.boot-logo {
  width: 84px;
  height: 84px;
  filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.5));
  animation: boot-pulse 1.4s var(--ease) infinite;
}
.boot-name {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f2f2f5;
}
.boot-bar {
  width: 180px;
  height: 3px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
.boot-bar span {
  display: block;
  height: 100%;
  width: 40%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--n-orange), var(--n-purple), var(--n-blue));
  animation: boot-load 1.1s var(--ease) forwards;
}
@keyframes boot-pulse {
  50% {
    transform: scale(1.06);
  }
}
@keyframes boot-load {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(260%);
  }
}
.boot-leave-active {
  transition: opacity 0.4s var(--ease);
}
.boot-leave-to {
  opacity: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 620px) {
  .icons {
    top: 44px;
    left: 0;
    right: 0;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    gap: 2px;
    max-height: none;
    padding: 6px;
  }
}
</style>
