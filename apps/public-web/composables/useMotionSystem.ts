import { onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from '#imports';

/**
 * Movimento (Apple HIG): contido e deferente.
 * - Revelações por scroll (fade + subida).
 * - Estado condensado da barra de navegação (vidro fosco) ao rolar.
 * - Parallax muito sutil em [data-parallax].
 * Respeita prefers-reduced-motion. Chamado uma vez no app.vue.
 */
export function useMotionSystem() {
  if (import.meta.server) return;

  const router = useRouter();
  const cleanups: Array<() => void> = [];

  onMounted(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Barra: adiciona .is-scrolled após um pequeno deslocamento ----------
    const nav = document.querySelector<HTMLElement>('.nav');
    const onNav = () => {
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onNav, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onNav));
    onNav();

    // --- Revelações --------------------------------------------------------
    let io: IntersectionObserver | null = null;
    const observeReveals = () => {
      if (reduce) {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
        return;
      }
      if (!io) {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
        );
      }
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => io?.observe(el));
    };
    cleanups.push(() => io?.disconnect());

    // --- Parallax sutil ----------------------------------------------------
    let parallaxEls: HTMLElement[] = [];
    const collectParallax = () => {
      parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    };
    const onScroll = () => {
      if (reduce || !parallaxEls.length) return;
      const vh = window.innerHeight;
      for (const el of parallaxEls) {
        const speed = Number(el.dataset.parallax) || 0.05;
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    };
    if (!reduce) {
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', onScroll));
    }

    const scan = () => {
      observeReveals();
      collectParallax();
      onScroll();
    };
    scan();

    const off = router.afterEach(() => {
      nextTick(() => requestAnimationFrame(scan));
    });
    cleanups.push(off);
  });

  onBeforeUnmount(() => cleanups.forEach((fn) => fn()));
}
