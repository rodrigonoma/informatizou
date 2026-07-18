<script setup lang="ts">
const services = [
  {
    title: 'Criação de sites',
    desc: 'Sites institucionais rápidos, responsivos e profissionais, feitos sob medida para o seu negócio.',
    icon: '🎨',
  },
  {
    title: 'Hospedagem gerenciada',
    desc: 'Infraestrutura segura com certificado SSL, backups automáticos e monitoramento contínuo.',
    icon: '🛡️',
  },
  {
    title: 'Manutenção mensal',
    desc: 'Atualizações, pequenas alterações, suporte e relatórios — seu site sempre no ar e atualizado.',
    icon: '🔧',
  },
  {
    title: 'WhatsApp e contato',
    desc: 'Botões de contato, formulário, mapa e integração com WhatsApp para converter visitantes em clientes.',
    icon: '💬',
  },
];

const steps = [
  { n: '01', title: 'Conheça sua empresa', desc: 'Pesquisamos informações públicas do seu negócio.' },
  { n: '02', title: 'Criamos uma demonstração', desc: 'Você recebe uma prévia visual do seu site, sem compromisso.' },
  { n: '03', title: 'Ajustamos com você', desc: 'Refinamos textos, fotos, domínio e informações.' },
  { n: '04', title: 'Publicamos e cuidamos', desc: 'Colocamos no ar e mantemos com plano mensal.' },
];

const plans = [
  {
    name: 'Implantação',
    price: 'Sob consulta',
    period: 'pagamento único',
    features: ['Criação do site', 'Domínio e configuração', 'Formulário e WhatsApp', 'Mapa e SEO básico', 'Publicação'],
    highlight: false,
  },
  {
    name: 'Manutenção Essencial',
    price: 'Sob consulta',
    period: 'por mês',
    features: ['Hospedagem e SSL', 'Backups automáticos', 'Pequenas alterações', 'Monitoramento', 'Suporte'],
    highlight: true,
  },
  {
    name: 'Manutenção Plus',
    price: 'Sob consulta',
    period: 'por mês',
    features: ['Tudo do Essencial', 'Atualizações prioritárias', 'Relatórios mensais', 'Segurança reforçada', 'Suporte estendido'],
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Preciso entender de tecnologia?',
    a: 'Não. Cuidamos de tudo — criação, domínio, hospedagem e manutenção. Você foca no seu negócio.',
  },
  {
    q: 'Como funciona a demonstração?',
    a: 'Preparamos uma prévia visual do seu site sem compromisso, disponível por alguns dias para você avaliar.',
  },
  {
    q: 'Posso usar meu próprio domínio?',
    a: 'Sim. Configuramos o seu domínio próprio ou ajudamos você a registrar um novo.',
  },
  {
    q: 'Existe fidelidade?',
    a: 'O plano mensal é opcional e flexível. Você pode ajustar conforme a necessidade do seu negócio.',
  },
];
</script>

<template>
  <div>
    <!-- Navbar -->
    <header class="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" class="flex items-center gap-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">I</span>
          <span class="text-lg font-semibold tracking-tight">Informatizou</span>
        </a>
        <div class="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#servicos" class="hover:text-slate-900">Serviços</a>
          <a href="#como-funciona" class="hover:text-slate-900">Como funciona</a>
          <a href="#planos" class="hover:text-slate-900">Planos</a>
          <a href="#faq" class="hover:text-slate-900">Dúvidas</a>
        </div>
        <a
          href="#contato"
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Fale conosco
        </a>
      </nav>
    </header>

    <!-- Hero -->
    <section id="top" class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white" />
      <div class="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div class="max-w-3xl">
          <span class="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
            Sites profissionais · hospedagem · manutenção
          </span>
          <h1 class="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            O site que o seu negócio
            <span class="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">merece</span>.
          </h1>
          <p class="mt-6 text-lg text-slate-600">
            Criamos, hospedamos e mantemos sites institucionais profissionais para pequenos e médios
            negócios. Você recebe uma demonstração personalizada antes de decidir.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="#contato" class="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Quero meu site
            </a>
            <a href="#como-funciona" class="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Como funciona
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Serviços -->
    <section id="servicos" class="mx-auto max-w-6xl px-6 py-20">
      <h2 class="text-3xl font-bold tracking-tight">O que fazemos</h2>
      <p class="mt-2 max-w-2xl text-slate-600">Uma solução completa para a presença digital do seu negócio.</p>
      <div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="s in services" :key="s.title" class="rounded-2xl border border-slate-200 p-6 transition hover:shadow-md">
          <div class="text-3xl">{{ s.icon }}</div>
          <h3 class="mt-4 font-semibold">{{ s.title }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ s.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Como funciona -->
    <section id="como-funciona" class="bg-slate-50 py-20">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-3xl font-bold tracking-tight">Como funciona</h2>
        <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div v-for="step in steps" :key="step.n" class="rounded-2xl bg-white p-6 shadow-sm">
            <div class="text-sm font-bold text-brand-500">{{ step.n }}</div>
            <h3 class="mt-2 font-semibold">{{ step.title }}</h3>
            <p class="mt-1 text-sm text-slate-600">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Planos -->
    <section id="planos" class="mx-auto max-w-6xl px-6 py-20">
      <h2 class="text-3xl font-bold tracking-tight">Planos</h2>
      <p class="mt-2 text-slate-600">Implantação única e manutenção mensal opcional.</p>
      <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          v-for="p in plans"
          :key="p.name"
          :class="[
            'rounded-2xl border p-8',
            p.highlight ? 'border-brand-500 shadow-lg ring-1 ring-brand-500' : 'border-slate-200',
          ]"
        >
          <div v-if="p.highlight" class="mb-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Mais popular
          </div>
          <h3 class="text-lg font-semibold">{{ p.name }}</h3>
          <p class="mt-2 text-3xl font-bold">{{ p.price }}</p>
          <p class="text-sm text-slate-500">{{ p.period }}</p>
          <ul class="mt-6 space-y-2 text-sm text-slate-600">
            <li v-for="f in p.features" :key="f" class="flex items-center gap-2">
              <span class="text-brand-600">✓</span> {{ f }}
            </li>
          </ul>
          <a href="#contato" class="mt-8 block rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700">
            Solicitar proposta
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="bg-slate-50 py-20">
      <div class="mx-auto max-w-3xl px-6">
        <h2 class="text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
        <div class="mt-8 divide-y divide-slate-200">
          <details v-for="f in faqs" :key="f.q" class="group py-4">
            <summary class="flex cursor-pointer list-none items-center justify-between font-medium">
              {{ f.q }}
              <span class="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p class="mt-2 text-sm text-slate-600">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- Contato -->
    <section id="contato" class="mx-auto max-w-6xl px-6 py-20">
      <div class="rounded-3xl bg-brand-600 px-8 py-14 text-center text-white md:px-16">
        <h2 class="text-3xl font-bold tracking-tight">Pronto para colocar seu negócio online?</h2>
        <p class="mx-auto mt-3 max-w-xl text-brand-100">
          Fale com a Informatizou e receba uma demonstração personalizada do seu site.
        </p>
        <a
          href="mailto:contato@informatizou.com.br"
          class="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          contato@informatizou.com.br
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">I</span>
          <span>© {{ new Date().getFullYear() }} Informatizou</span>
        </div>
        <div class="flex items-center gap-6">
          <NuxtLink to="/politica-privacidade" class="hover:text-slate-900">Política de privacidade</NuxtLink>
          <NuxtLink to="/termos" class="hover:text-slate-900">Termos de uso</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
