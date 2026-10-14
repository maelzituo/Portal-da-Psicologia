/**
 * PORTAL DA PSICOLOGIA — HERO CINEMATOGRÁFICO
 * Composição cinematográfica com vídeo contínuo em alta performance,
 * controle passivo de visibilidade (IntersectionObserver) e consumo zero de CPU/bateria fora da tela.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const heroVideo = document.getElementById('hero-video');
    const heroSection = document.getElementById('hero');

    if (!heroVideo) return;

    // 1. Respeito estrito à preferência do sistema por redução de movimento
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      heroVideo.pause();
      return;
    }

    // 2. Inicialização segura de autoplay (tolerante a políticas de economia de energia e navegadores móveis)
    const startPlayback = () => {
      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Em caso de restrição severa do navegador, o poster WebP permanece ativo de forma elegante
          heroVideo.controls = false;
        });
      }
    };

    // Tentativa inicial de reprodução
    startPlayback();

    // 3. Otimização de Recursos: Pausa automática quando o Hero sair da viewport (Zero CPU no scroll)
    if ('IntersectionObserver' in window && heroSection) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (heroVideo.paused) {
                heroVideo.play().catch(() => {});
              }
            } else {
              if (!heroVideo.paused) {
                heroVideo.pause();
              }
            }
          });
        },
        { threshold: 0.05 }
      );

      heroObserver.observe(heroSection);
    }

    // 4. Pausar vídeo imediatamente quando a aba for minimizada ou estiver em segundo plano
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (!heroVideo.paused) heroVideo.pause();
      } else {
        const rect = heroSection ? heroSection.getBoundingClientRect() : null;
        if (rect && rect.bottom > 0 && rect.top < window.innerHeight) {
          heroVideo.play().catch(() => {});
        }
      }
    });
  });
})();
