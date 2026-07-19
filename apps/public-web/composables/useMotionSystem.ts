import { onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from '#imports';

/**
 * Informatizou Motion System (cliente).
 * Orquestra o sinal que segue o cursor, o cursor personalizado, elementos
 * magnéticos, revelações por scroll e parallax sutil. Respeita
 * prefers-reduced-motion e ponteiros de toque. Chamado uma vez no app.vue.
 */
export function useMotionSystem() {
  if (import.meta.server) return;

  const router = useRouter();
  const cleanups: Array<() => void> = [];
  let raf = 0;

  onMounted(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    const signal = document.querySelector<HTMLElement>('.env-signal');
    const cursor = document.querySelector<HTMLElement>('.env-cursor');

    // --- Sinal + cursor: mola por rAF com inércias diferentes ---------------
    if (!reduce && !coarse && (signal || cursor)) {
      let tx = window.innerWidth / 2;
      let ty = window.innerHeight / 2;
      let sx = tx;
      let sy = ty;
      let cx = tx;
      let cy = ty;

      const onMove = (e: PointerEvent) => {
        tx = e.clientX;
        ty = e.clientY;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => window.removeEventListener('pointermove', onMove));

      const setDown = (d: boolean) => cursor?.classList.toggle('is-down', d);
      const onDown = () => setDown(true);
      const onUp = () => setDown(false);
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      cleanups.push(() => window.removeEventListener('pointerdown', onDown));
      cleanups.push(() => window.removeEventListener('pointerup', onUp));

      const loop = () => {
        sx += (tx - sx) * 0.06;
        sy += (ty - sy) * 0.06;
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        if (signal) signal.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
        if (cursor) cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanups.push(() => cancelAnimationFrame(raf));

      // Estado ativo do cursor sobre elementos interativos.
      const activate = () => cursor?.classList.add('is-active');
      const deactivate = () => cursor?.classList.remove('is-active');
      const bindHover = () => {
        document
          .querySelectorAll<HTMLElement>('a, button, [data-cursor], [data-magnetic]')
          .forEach((el) => {
            el.addEventListener('pointerenter', activate);
            el.addEventListener('pointerleave', deactivate);
          });
      };
      bindHover();
      cleanups.push(() => {
        document
          .querySelectorAll<HTMLElement>('a, button, [data-cursor], [data-magnetic]')
          .forEach((el) => {
            el.removeEventListener('pointerenter', activate);
            el.removeEventListener('pointerleave', deactivate);
          });
      });
    }

    // --- Elementos magnéticos ----------------------------------------------
    const bindMagnetic = () => {
      if (reduce || coarse) return;
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
        if (el.dataset.magBound) return;
        el.dataset.magBound = '1';
        const strength = Number(el.dataset.magnetic) || 0.3;
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        };
        const reset = () => {
          el.style.transform = 'translate(0, 0)';
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', reset);
      });
    };

    // --- Revelações por scroll ---------------------------------------------
    let io: IntersectionObserver | null = null;
    const observeReveals = () => {
      if (reduce) {
        document.querySelectorAll('.reveal, .mask-line').forEach((el) => el.classList.add('in'));
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
          { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
        );
      }
      document.querySelectorAll('.reveal:not(.in), .mask-line:not(.in)').forEach((el) => io?.observe(el));
    };
    cleanups.push(() => io?.disconnect());

    // --- Parallax sutil ligado ao scroll -----------------------------------
    let parallaxEls: HTMLElement[] = [];
    const collectParallax = () => {
      parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    };
    const onScroll = () => {
      if (reduce) return;
      const vh = window.innerHeight;
      for (const el of parallaxEls) {
        const speed = Number(el.dataset.parallax) || 0.08;
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    };
    if (!reduce && !coarse) {
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', onScroll));
    }

    const scan = () => {
      bindMagnetic();
      observeReveals();
      collectParallax();
      onScroll();
    };
    scan();

    // Re-escaneia após navegação (páginas legais compartilham o sistema).
    const off = router.afterEach(() => {
      nextTick(() => requestAnimationFrame(scan));
    });
    cleanups.push(off);
  });

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn());
  });
}
