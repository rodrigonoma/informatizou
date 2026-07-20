<script setup lang="ts">
import { ref, onMounted } from 'vue';

// InformatizouOS 95 — o portfólio da Informatizou no visual do Windows 95.
const { desktopApps } = useApps();
const { windows, open, off, restart } = useDesktop();

const booting = ref(true);

function boot() {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  open('bem-vindo', { w: 560, h: 440 });
  booting.value = true;
  if (reduce) booting.value = false;
  else setTimeout(() => (booting.value = false), 1500);
}

function ligarNovamente() {
  restart();
  boot();
}

onMounted(boot);
</script>

<template>
  <div class="desk">
    <!-- Ícones da área de trabalho -->
    <div class="icons">
      <OsDesktopIcon v-for="a in desktopApps" :key="a.id" :app="a" />
    </div>

    <!-- Janelas abertas -->
    <template v-for="w in windows" :key="w.id">
      <OsAppWindow v-if="!w.minimized" :win="w" />
    </template>

    <OsTaskbar />

    <!-- Inicialização -->
    <Transition name="fade">
      <div v-if="booting" class="boot" @click="booting = false">
        <div class="boot-card bevel-out">
          <img src="/logo-mark.png" alt="Informatizou" class="boot-logo" width="64" height="64" />
          <div class="boot-title">Informatizou<span>OS</span></div>
          <div class="boot-sub">Iniciando o sistema…</div>
          <div class="boot-bar bevel-in"><span /></div>
        </div>
      </div>
    </Transition>

    <!-- Tela de desligar (clássica) -->
    <div v-if="off" class="shutdown">
      <p class="sd-text">Agora você pode desligar<br />o computador com segurança.</p>
      <button class="btn95 sd-btn" @click="ligarNovamente">Ligar novamente</button>
    </div>

    <!-- Conteúdo indexável (crawlers/leitores de tela) -->
    <div class="sr-only">
      <h1>Informatizou — tudo para digitalizar o seu negócio</h1>
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
  background: var(--w-teal);
  overflow: hidden;
}
.icons {
  position: absolute;
  top: 8px;
  left: 6px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 2px;
  max-height: calc(100vh - 46px);
}

/* Inicialização */
.boot {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  background: var(--w-teal);
}
.boot-card {
  width: 300px;
  padding: 26px 20px 22px;
  background: var(--w-face);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.boot-logo {
  width: 64px;
  height: 64px;
}
.boot-title {
  font-size: 22px;
  font-weight: 700;
  color: #000;
}
.boot-title span {
  color: var(--w-navy);
}
.boot-sub {
  font-size: 12px;
  color: #333;
}
.boot-bar {
  width: 210px;
  height: 18px;
  padding: 3px;
  background: #fff;
  overflow: hidden;
}
.boot-bar span {
  display: block;
  height: 100%;
  width: 40%;
  background: var(--w-navy);
  animation: boot-load 1.4s steps(20) forwards;
}
@keyframes boot-load {
  from {
    transform: translateX(-105%);
  }
  to {
    transform: translateX(270%);
  }
}

/* Desligar */
.shutdown {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
}
.sd-text {
  color: #ff8c00;
  font-size: clamp(1.4rem, 4vw, 2.4rem);
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
  text-shadow: 0 0 18px rgba(255, 140, 0, 0.4);
}
.sd-btn {
  font-weight: 700;
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
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 620px) {
  .icons {
    flex-direction: row;
    gap: 0;
  }
}
</style>
