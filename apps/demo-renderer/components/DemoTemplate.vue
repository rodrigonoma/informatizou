<script setup lang="ts">
interface DesignTokens {
  primary: string;
  primaryDark: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  fontHeading: string;
  fontBody: string;
  radius: string;
  mood: string;
  heroStyle: string;
}
interface DemoContent {
  businessName: string;
  title: string;
  subtitle: string;
  intro: string;
  about: string;
  differentials: string[];
  gallery: string[];
  location: { address?: string; city?: string; neighborhood?: string };
  contact: { phone?: string; whatsapp?: string; email?: string; instagram?: string };
  callToAction: string;
}

const props = defineProps<{ content: DemoContent; tokens: DesignTokens }>();

const styleVars = computed(() => ({
  '--c-primary': props.tokens.primary,
  '--c-primary-dark': props.tokens.primaryDark,
  '--c-accent': props.tokens.accent,
  '--c-bg': props.tokens.bg,
  '--c-surface': props.tokens.surface,
  '--c-text': props.tokens.text,
  '--c-muted': props.tokens.muted,
  '--f-heading': props.tokens.fontHeading,
  '--f-body': props.tokens.fontBody,
  '--radius': props.tokens.radius,
}));

const isDark = computed(() => props.tokens.mood === 'dark');
</script>

<template>
  <div class="demo-root" :style="styleVars" :class="{ dark: isDark }">
    <!-- Hero -->
    <section class="hero" :class="`hero--${tokens.heroStyle}`">
      <div class="hero__inner">
        <p class="hero__eyebrow">{{ content.subtitle }}</p>
        <h1 class="hero__title">{{ content.title }}</h1>
        <p class="hero__lead">{{ content.about }}</p>
        <div class="hero__actions">
          <a v-if="content.contact.phone" :href="`tel:${content.contact.phone}`" class="btn btn--primary">
            Ligar agora
          </a>
          <a v-if="content.contact.whatsapp" :href="`https://wa.me/${content.contact.whatsapp.replace(/\D/g, '')}`" class="btn btn--ghost">
            WhatsApp
          </a>
        </div>
      </div>
    </section>

    <!-- Diferenciais -->
    <section v-if="content.differentials.length" class="section">
      <div class="grid grid--3">
        <div v-for="(d, i) in content.differentials" :key="i" class="card">
          <div class="card__dot" />
          <p class="card__text">{{ d }}</p>
        </div>
      </div>
    </section>

    <!-- Galeria -->
    <section v-if="content.gallery.length" class="section">
      <h2 class="section__title">Galeria</h2>
      <div class="gallery">
        <img v-for="(src, i) in content.gallery" :key="i" :src="src" alt="" loading="lazy" />
      </div>
    </section>

    <!-- Localização + contato -->
    <section class="section section--split">
      <div class="panel">
        <h2 class="section__title">Onde estamos</h2>
        <p class="muted">{{ content.location.address }}</p>
        <p class="muted">
          {{ [content.location.neighborhood, content.location.city].filter(Boolean).join(' · ') }}
        </p>
      </div>
      <div class="panel">
        <h2 class="section__title">Contato</h2>
        <ul class="contact">
          <li v-if="content.contact.phone">📞 {{ content.contact.phone }}</li>
          <li v-if="content.contact.email">✉️ {{ content.contact.email }}</li>
          <li v-if="content.contact.instagram">📸 Instagram</li>
        </ul>
      </div>
    </section>

    <!-- CTA final -->
    <section class="cta">
      <h2>{{ content.callToAction }}</h2>
      <a v-if="content.contact.phone" :href="`tel:${content.contact.phone}`" class="btn btn--primary btn--lg">
        Falar com {{ content.businessName }}
      </a>
    </section>
  </div>
</template>

<style scoped>
.demo-root {
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--f-body);
}
.demo-root :is(h1, h2) {
  font-family: var(--f-heading);
  letter-spacing: -0.02em;
}
.hero {
  position: relative;
  padding: 6rem 1.5rem 5rem;
  overflow: hidden;
}
.hero__inner {
  max-width: 60rem;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}
.hero--gradient {
  background: radial-gradient(120% 120% at 50% 0%, var(--c-accent) 0%, var(--c-primary) 45%, var(--c-primary-dark) 100%);
  color: #fff;
}
.hero--image-overlay {
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
  color: #fff;
}
.hero--split {
  background: var(--c-surface);
  border-bottom: 4px solid var(--c-primary);
}
.hero--centered {
  background: var(--c-surface);
}
.hero__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.85;
}
.hero__title {
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 800;
  margin: 0.75rem 0;
}
.hero__lead {
  font-size: 1.15rem;
  max-width: 40rem;
  margin: 0 auto;
  opacity: 0.92;
}
.hero__actions {
  margin-top: 2rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  padding: 0.8rem 1.6rem;
  border-radius: var(--radius);
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn:hover { transform: translateY(-2px); }
.btn--primary { background: var(--c-primary); color: #fff; box-shadow: 0 10px 30px -10px var(--c-primary); }
.btn--ghost { background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255, 255, 255, 0.5); }
.hero--split .btn--ghost, .hero--centered .btn--ghost { color: var(--c-primary); border-color: var(--c-primary); background: transparent; }
.btn--lg { padding: 1rem 2.2rem; font-size: 1.05rem; }
.section {
  max-width: 66rem;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}
.section--split { display: grid; gap: 2rem; grid-template-columns: 1fr; }
@media (min-width: 720px) { .section--split { grid-template-columns: 1fr 1fr; } }
.section__title { font-size: 1.8rem; font-weight: 800; margin-bottom: 1.5rem; }
.grid { display: grid; gap: 1.25rem; }
.grid--3 { grid-template-columns: 1fr; }
@media (min-width: 720px) { .grid--3 { grid-template-columns: repeat(3, 1fr); } }
.card {
  background: var(--c-surface);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: 0 12px 40px -20px rgba(0, 0, 0, 0.35);
}
.card__dot { width: 2.5rem; height: 0.35rem; border-radius: 99px; background: var(--c-accent); margin-bottom: 1rem; }
.card__text { font-weight: 600; }
.gallery { display: grid; gap: 0.75rem; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 720px) { .gallery { grid-template-columns: repeat(3, 1fr); } }
.gallery img { width: 100%; height: 220px; object-fit: cover; border-radius: var(--radius); }
.panel { background: var(--c-surface); border-radius: var(--radius); padding: 2rem; box-shadow: 0 12px 40px -24px rgba(0, 0, 0, 0.3); }
.muted { color: var(--c-muted); }
.contact { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.cta {
  text-align: center;
  padding: 5rem 1.5rem;
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
  color: #fff;
}
.cta h2 { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; margin-bottom: 1.5rem; }
.dark .card, .dark .panel { border: 1px solid rgba(255, 255, 255, 0.08); }
</style>
