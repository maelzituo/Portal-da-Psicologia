/**
 * PORTAL DA PSICOLOGIA — COMPONENTE: "A MATÉRIA SE TRANSFORMA"
 * Módulo de transição artística contemplativa entre o Hero e a Seção Clínica (#sobre).
 * 
 * Arquitetura de alta performance:
 * - Zero Layout Thrashing: Elimina getBoundingClientRect() no mousemove contínuo.
 * - Variáveis CSS para Parallax: Preserva composição nativa e scale da GPU.
 * - Gerenciamento de ciclo de vida seguro: Nunca deixa a tela vazia ao revisitar.
 * - Desconexão do IntersectionObserver após conclusão da animação para poupar CPU.
 * - Respeito pleno e reativo a prefers-reduced-motion.
 */

(function () {
  'use strict';

  const TransformationTransitionConfig = {
    totalDurationMs: 3400,
    thresholds: {
      enter: 0.15, // Inicia suavemente quando 15% entra na viewport
      exit: 0.02
    },
    mouseInteraction: {
      enabled: true,
      maxOffsetViewport: 6, // Deslocamento suave máximo em pixels para a matéria
      maxOffsetHalo: 10,    // Deslocamento máximo em pixels para o halo
      lerpFactor: 0.08      // Coeficiente de amortecimento viscoso
    }
  };

  class TransformationTransition {
    constructor() {
      this.section = document.getElementById('transicao-transformacao');
      if (!this.section) return;

      this.viewport = document.getElementById('trans-materia-viewport');
      this.halo = document.getElementById('trans-materia-halo');

      this.isRunning = false;
      this.hasPlayed = false;
      this.completionTimer = null;
      this.observer = null;
      this.sectionRect = null;

      // Mouse Parallax localizado (apenas desktop com ponteiro fino)
      this.isMouseSupported = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      this.targetX = 0;
      this.targetY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.rafId = null;
      this.boundAnimateMousePresence = this.animateMousePresence.bind(this);

      this.init();
    }

    init() {
      this.section.classList.add('js-enabled');

      // 1. Verificação de Acessibilidade (prefers-reduced-motion)
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        this.section.setAttribute('data-state', 'concluded');
        this.hasPlayed = true;
        this.setupReducedMotionObserver(motionQuery);
        return;
      }

      this.setupReducedMotionObserver(motionQuery);

      this.section.setAttribute('data-state', 'idle');

      // 2. Observer de Visibilidade com threshold calibrado
      this.setupObserver();

      // 3. Interação Sutil com Mouse (Localizada estritamente na seção, com cache de retângulos)
      if (this.isMouseSupported && TransformationTransitionConfig.mouseInteraction.enabled) {
        this.setupMousePresence();
      }

      // 4. Pausamento em Aba Oculta
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }, { passive: true });
    }

    setupReducedMotionObserver(motionQuery) {
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', (e) => {
          if (e.matches) {
            this.section.setAttribute('data-state', 'concluded');
            this.hasPlayed = true;
            if (this.observer) {
              this.observer.disconnect();
              this.observer = null;
            }
            if (this.rafId) {
              cancelAnimationFrame(this.rafId);
              this.rafId = null;
            }
          }
        });
      }
    }

    setupObserver() {
      if (!('IntersectionObserver' in window)) {
        this.start();
        return;
      }

      const options = {
        threshold: [0.0, TransformationTransitionConfig.thresholds.exit, TransformationTransitionConfig.thresholds.enter, 0.35]
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= TransformationTransitionConfig.thresholds.enter) {
            this.start();
          } else if (!entry.isIntersecting || entry.intersectionRatio <= TransformationTransitionConfig.thresholds.exit) {
            this.handleExit();
          }
        });
      }, options);

      this.observer.observe(this.section);
    }

    start() {
      if (this.isRunning || this.hasPlayed || document.hidden) return;

      this.isRunning = true;
      this.hasPlayed = true;
      this.section.setAttribute('data-state', 'animating');

      if (this.completionTimer) {
        clearTimeout(this.completionTimer);
      }

      this.completionTimer = setTimeout(() => {
        this.section.setAttribute('data-state', 'concluded');
        this.isRunning = false;
        // Desconecta o observer uma vez concluído para poupar 100% de CPU no scroll futuro
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
      }, TransformationTransitionConfig.totalDurationMs);
    }

    handleExit() {
      // Se ainda estava rodando antes de concluir, pausa o rAF
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      // IMPORTANTE: Se já tocou ou concluiu, NUNCA reseta para idle nem esvazia a tela!
      // Mantém a experiência visualmente rica, preenchida e harmoniosa.
    }

    setupMousePresence() {
      const updateRect = () => {
        if (this.section) {
          this.sectionRect = this.section.getBoundingClientRect();
        }
      };

      // Atualiza coordenadas no hover e resize (elimina layout thrashing contínuo)
      this.section.addEventListener('mouseenter', updateRect, { passive: true });
      window.addEventListener('resize', updateRect, { passive: true });

      const onMouseMove = (e) => {
        if (document.hidden) return;
        if (!this.sectionRect) updateRect();

        const rect = this.sectionRect;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.targetX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
        this.targetY = Math.max(-1, Math.min(1, (y - centerY) / centerY));

        if (!this.rafId) {
          this.rafId = requestAnimationFrame(this.boundAnimateMousePresence);
        }
      };

      const onMouseLeave = () => {
        this.targetX = 0;
        this.targetY = 0;
        this.sectionRect = null;
      };

      this.section.addEventListener('mousemove', onMouseMove, { passive: true });
      this.section.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }

    animateMousePresence() {
      if (document.hidden) {
        this.rafId = null;
        return;
      }

      const { maxOffsetViewport, maxOffsetHalo, lerpFactor } = TransformationTransitionConfig.mouseInteraction;

      this.currentX += (this.targetX - this.currentX) * lerpFactor;
      this.currentY += (this.targetY - this.currentY) * lerpFactor;

      const vx = (this.currentX * maxOffsetViewport).toFixed(2);
      const vy = (this.currentY * maxOffsetViewport).toFixed(2);
      const hx = (this.currentX * maxOffsetHalo).toFixed(2);
      const hy = (this.currentY * maxOffsetHalo).toFixed(2);

      // Usa propriedades CSS dedicadas para não sobrescrever escalas e transformações de layout
      this.section.style.setProperty('--mouse-vx', `${vx}px`);
      this.section.style.setProperty('--mouse-vy', `${vy}px`);
      this.section.style.setProperty('--mouse-hx', `${hx}px`);
      this.section.style.setProperty('--mouse-hy', `${hy}px`);

      if (Math.abs(this.targetX - this.currentX) > 0.001 || Math.abs(this.targetY - this.currentY) > 0.001) {
        this.rafId = requestAnimationFrame(this.boundAnimateMousePresence);
      } else {
        this.rafId = null;
      }
    }
  }

  // Inicialização segura no DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TransformationTransition());
  } else {
    new TransformationTransition();
  }
})();
