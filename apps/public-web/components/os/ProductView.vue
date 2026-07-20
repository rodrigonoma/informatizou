<script setup lang="ts">
import type { OsApp } from '~/composables/useApps';

defineProps<{ app: OsApp }>();

const { desktopApps } = useApps();
const { open } = useDesktop();
const produtos = desktopApps.filter((a) => a.kind === 'product');
</script>

<template>
  <div class="pv-well bevel-in os-scroll">
    <div class="pv">
      <!-- Cabeçalho -->
      <div class="pv-hero">
        <span class="pv-ico" v-html="app.glyph" />
        <div>
          <h1 class="pv-name">{{ app.name }}</h1>
          <p v-if="app.tagline" class="pv-tag">{{ app.tagline }}</p>
        </div>
      </div>
      <hr class="pv-rule" />

      <!-- README -->
      <template v-if="app.kind === 'readme'">
        <p class="pv-p">
          Bem-vindo ao <strong>InformatizouOS</strong> — a Informatizou apresentada como um sistema
          operacional. Cada ícone da área de trabalho é um serviço que colocamos para funcionar no seu
          negócio.
        </p>
        <p class="pv-p">Dê um duplo clique nos ícones (ou toque, no celular) para abrir cada produto:</p>
        <div class="pv-list">
          <button v-for="p in produtos" :key="p.id" class="pv-item" @click="open(p.id, { w: p.w, h: p.h })">
            <span class="pv-item-ico" v-html="p.glyph" />
            {{ p.name }}
          </button>
        </div>
        <a class="btn95 pv-cta" href="mailto:contato@informatizou.com.br">Falar com a gente</a>
      </template>

      <!-- Contato -->
      <template v-else-if="app.kind === 'contact'">
        <p class="pv-p">Vamos conversar sobre o seu negócio.</p>
        <div class="pv-fields">
          <label>E-mail</label>
          <a class="pv-field bevel-in" href="mailto:contato@informatizou.com.br">contato@informatizou.com.br</a>
          <label>Site</label>
          <a class="pv-field bevel-in" href="https://www.informatizou.com.br">www.informatizou.com.br</a>
        </div>
        <p class="pv-p">Conte o que você precisa — respondemos com uma demonstração, sem compromisso.</p>
        <a v-if="app.cta" class="btn95 pv-cta" :href="app.cta.href">{{ app.cta.label }}</a>
      </template>

      <!-- Produto -->
      <template v-else>
        <p v-if="app.intro" class="pv-p pv-intro">{{ app.intro }}</p>
        <ul class="pv-feats">
          <li v-for="f in app.features" :key="f.t">
            <span class="pv-bullet" :style="{ background: app.accent }" />
            <strong>{{ f.t }}.</strong> {{ f.d }}
          </li>
        </ul>
        <a v-if="app.cta" class="btn95 pv-cta" :href="app.cta.href">▸ {{ app.cta.label }}</a>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pv-well {
  height: 100%;
  background: #fff;
  overflow-y: auto;
}
.pv {
  padding: 14px 16px 18px;
  color: #000;
  font-size: 13px;
  line-height: 1.5;
}
.pv-hero {
  display: flex;
  align-items: center;
  gap: 11px;
}
.pv-ico {
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
}
.pv-ico :deep(svg) {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}
.pv-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}
.pv-tag {
  margin: 1px 0 0;
  font-size: 0.95rem;
  color: #333;
}
.pv-rule {
  border: none;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #fff;
  margin: 12px 0;
}
.pv-p {
  margin: 0 0 12px;
}
.pv-intro {
  font-size: 0.98rem;
}
.pv-feats {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.pv-feats li {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.pv-bullet {
  width: 8px;
  height: 8px;
  flex: none;
  transform: translateY(1px);
}
.pv-cta {
  display: inline-block;
  margin-top: 4px;
  font-weight: 700;
  text-decoration: none;
  color: #000;
}
.pv-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 4px 0 16px;
}
.pv-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  background: var(--w-face);
  color: #000;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  box-shadow:
    inset -1px -1px 0 var(--w-dark),
    inset 1px 1px 0 var(--w-hi),
    inset -2px -2px 0 var(--w-shadow),
    inset 2px 2px 0 var(--w-light);
}
.pv-item:active {
  box-shadow:
    inset 1px 1px 0 var(--w-dark),
    inset -1px -1px 0 var(--w-hi);
}
.pv-item-ico {
  width: 26px;
  height: 26px;
  flex: none;
  display: grid;
  place-items: center;
}
.pv-item-ico :deep(svg) {
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
}
.pv-fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 10px;
  align-items: center;
  margin: 0 0 14px;
}
.pv-fields label {
  font-weight: 700;
}
.pv-field {
  padding: 4px 8px;
  background: #fff;
  color: #0000cc;
  font-size: 12px;
  text-decoration: none;
}

@media (max-width: 620px) {
  .pv-list {
    grid-template-columns: 1fr;
  }
}
</style>
