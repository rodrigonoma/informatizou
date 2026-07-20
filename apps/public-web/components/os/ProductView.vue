<script setup lang="ts">
import type { OsApp } from '~/composables/useApps';

defineProps<{ app: OsApp }>();

const { desktopApps } = useApps();
const { open } = useDesktop();
const produtos = desktopApps.filter((a) => a.kind === 'product');
</script>

<template>
  <div class="pv">
    <!-- Cabeçalho comum -->
    <div class="pv-hero">
      <span
        class="pv-tile"
        :style="{ background: `linear-gradient(150deg, ${app.accent}, ${app.accent2})` }"
        v-html="app.glyph"
      />
      <div>
        <h1 class="pv-name">{{ app.name }}</h1>
        <p v-if="app.tagline" class="pv-tag">{{ app.tagline }}</p>
      </div>
    </div>

    <!-- README / Bem-vindo -->
    <template v-if="app.kind === 'readme'">
      <p class="pv-lead">
        Bem-vindo ao <strong>InformatizouOS</strong> — a Informatizou apresentada como um sistema
        operacional. Cada ícone da área de trabalho é um serviço que colocamos para funcionar no seu
        negócio.
      </p>
      <p class="pv-p">Dê um duplo clique nos ícones (ou toque, no celular) para abrir cada produto:</p>
      <div class="pv-grid">
        <button v-for="p in produtos" :key="p.id" class="pv-chip" @click="open(p.id, { w: p.w, h: p.h })">
          <span class="pv-chip-ico" :style="{ background: `linear-gradient(150deg, ${p.accent}, ${p.accent2})` }" v-html="p.glyph" />
          {{ p.name }}
        </button>
      </div>
      <a class="pv-cta" href="mailto:contato@informatizou.com.br">Falar com a gente</a>
    </template>

    <!-- Contato -->
    <template v-else-if="app.kind === 'contact'">
      <p class="pv-lead">Vamos conversar sobre o seu negócio.</p>
      <ul class="pv-contact">
        <li><span>E-mail</span><a href="mailto:contato@informatizou.com.br">contato@informatizou.com.br</a></li>
        <li><span>Site</span><a href="https://www.informatizou.com.br">www.informatizou.com.br</a></li>
      </ul>
      <p class="pv-p">Conte o que você precisa — respondemos com uma demonstração, sem compromisso.</p>
      <a v-if="app.cta" class="pv-cta" :href="app.cta.href">{{ app.cta.label }}</a>
    </template>

    <!-- Produto -->
    <template v-else>
      <p v-if="app.intro" class="pv-lead">{{ app.intro }}</p>
      <div class="pv-features">
        <div v-for="f in app.features" :key="f.t" class="pv-feat">
          <span class="pv-dot" :style="{ background: app.accent }" />
          <div>
            <h3>{{ f.t }}</h3>
            <p>{{ f.d }}</p>
          </div>
        </div>
      </div>
      <a v-if="app.cta" class="pv-cta" :href="app.cta.href" :style="{ background: app.accent }">
        {{ app.cta.label }}
      </a>
    </template>
  </div>
</template>

<style scoped>
.pv {
  padding: 22px 24px 26px;
}
.pv-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.pv-tile {
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}
.pv-tile :deep(svg) {
  width: 30px;
  height: 30px;
}
.pv-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.pv-tag {
  margin: 3px 0 0;
  font-size: 0.98rem;
  color: var(--win-ink-2);
}
.pv-lead {
  margin: 0 0 16px;
  font-size: 1.05rem;
  line-height: 1.55;
  color: #3a3a40;
}
.pv-p {
  margin: 0 0 12px;
  color: var(--win-ink-2);
  line-height: 1.5;
}
.pv-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
  margin-bottom: 22px;
}
.pv-feat {
  display: flex;
  gap: 10px;
}
.pv-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 6px;
  flex: none;
}
.pv-feat h3 {
  margin: 0 0 2px;
  font-size: 0.95rem;
  font-weight: 600;
}
.pv-feat p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--win-ink-2);
}
.pv-cta {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.3rem;
  border-radius: 980px;
  background: #1d1d1f;
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  transition: transform 0.2s var(--ease), filter 0.2s var(--ease);
}
.pv-cta:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.pv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 14px 0 20px;
}
.pv-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--win-ink);
  text-align: left;
  transition: background 0.18s;
}
.pv-chip:hover {
  background: rgba(0, 0, 0, 0.08);
}
.pv-chip-ico {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #fff;
  flex: none;
}
.pv-chip-ico :deep(svg) {
  width: 17px;
  height: 17px;
}
.pv-contact {
  list-style: none;
  margin: 0 0 18px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pv-contact li {
  display: flex;
  gap: 12px;
  align-items: baseline;
  border-bottom: 1px solid var(--win-hair);
  padding-bottom: 10px;
}
.pv-contact span {
  width: 56px;
  font-size: 0.8rem;
  color: var(--win-ink-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pv-contact a {
  color: var(--n-blue);
  font-weight: 500;
}

@media (max-width: 620px) {
  .pv-features,
  .pv-grid {
    grid-template-columns: 1fr;
  }
}
</style>
