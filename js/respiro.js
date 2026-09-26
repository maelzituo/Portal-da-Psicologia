/**
 * ============================================================================
 * PORTAL DA PSICOLOGIA — EXPERIÊNCIA CINEMATOGRÁFICA "O RESPIRO"
 * Arquitetura: Vídeo Abstrato Orgânico + Sincronização via Scroll Suave
 * REGRAS CRÍTICAS:
 *  1. Zero Scroll Hijacking: Scroll 100% nativo do navegador (sem preventDefault)
 *  2. IntersectionObserver: Ativa cálculos apenas quando #respiro está visível
 *  3. requestAnimationFrame: Interpolação suave do tempo do vídeo (#respiro-video)
 *  4. Transição de texto suave centralizada exatamente nos 50% de progresso
 * ============================================================================
 */

(function() {
  'use strict';

  class RespiroExperience {
    constructor() {
      // Elementos Principais do DOM
      this.section = document.getElementById('respiro');
      if (!this.section) return;

      this.video = document.getElementById('respiro-video');
      this.poster = document.getElementById('respiro-poster');
      this.mediaWrapper = this.section.querySelector('.respiro-media-wrapper');
      this.titleInitial = this.section.querySelector('.respiro-title-initial');
      this.titleReflection = this.section.querySelector('.respiro-title-reflection');

      // Estado e Variáveis de Controle
      this.isActive = false;
      this.isTicking = false;
      this.hasVideoMetadata = false;
      this.targetProgress = 0;
      this.currentProgress = 0;
      this.lerpFactor = 0.12; // Fator de amortecimento suave para eliminar trepidações
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.init();
    }

    init() {
      // Acessibilidade: se o usuário prefere movimento reduzido, desativa scrubbing
      if (this.isReducedMotion) {
        if (this.mediaWrapper) {
          this.mediaWrapper.classList.add('fallback-mode');
        }
        return;
      }

      this.setupVideoEvents();
      this.setupObserver();
      this.setupResizeListener();
    }

    setupVideoEvents() {
      if (!this.video) return;

      const onVideoReady = () => {
        if (!this.hasVideoMetadata && this.video.duration) {
          this.hasVideoMetadata = true;
          this.video.classList.add('is-ready');
          if (this.mediaWrapper) {
            this.mediaWrapper.classList.remove('fallback-mode');
          }
        }
      };

      this.video.addEventListener('loadedmetadata', onVideoReady);
      this.video.addEventListener('canplay', onVideoReady);

      // Tratamento de contingência para arquivo inexistente ou erro de decodificação
      this.video.addEventListener('error', () => {
        this.hasVideoMetadata = false;
        if (this.mediaWrapper) {
          this.mediaWrapper.classList.add('fallback-mode');
        }
      });

      // Tenta pré-carregar os metadados discretamente
      try {
        if (this.video.readyState >= 1) {
          onVideoReady();
        } else {
          this.video.load();
        }
      } catch (e) {
        // Fallback silencioso mantendo o poster estático visível
      }
    }

    setupObserver() {
      // IntersectionObserver para detectar quando #respiro entra e sai da viewport
      if (!('IntersectionObserver' in window)) {
        this.bindScroll();
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.isActive = true;
            this.bindScroll();
            this.onScroll(); // Atualização imediata da posição
            this.requestLoop();
          } else {
            this.isActive = false;
            this.unbindScroll();
          }
        });
      }, {
        rootMargin: '100px 0px 100px 0px',
        threshold: 0
      });

      observer.observe(this.section);
    }

    bindScroll() {
      if (!this.scrollHandler) {
        // NUNCA usar preventDefault — Scroll 100% nativo com passive: true
        this.scrollHandler = this.onScroll.bind(this);
      }
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    unbindScroll() {
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler);
      }
    }

    setupResizeListener() {
      window.addEventListener('resize', () => {
        if (this.isActive) this.onScroll();
      }, { passive: true });
    }

    onScroll() {
      if (!this.isActive) return;

      const rect = this.section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollableDistance = rect.height - windowHeight;

      if (scrollableDistance <= 0) {
        // Mobile ou seções menores em fluxo padrão
        const viewportCenter = windowHeight / 2;
        const sectionCenter = rect.top + (rect.height / 2);
        const distance = (viewportCenter - sectionCenter) / (windowHeight * 0.8);
        this.targetProgress = Math.max(0, Math.min(1, 0.5 + distance * 0.5));
      } else {
        // Desktop com trilha de scroll contínuo
        const currentScrolled = -rect.top;
        const rawProgress = currentScrolled / scrollableDistance;
        this.targetProgress = Math.max(0, Math.min(1, rawProgress));
      }

      this.requestLoop();
    }

    requestLoop() {
      if (!this.isTicking) {
        this.isTicking = true;
        window.requestAnimationFrame(() => this.tick());
      }
    }

    tick() {
      if (!this.isActive) {
        this.isTicking = false;
        return;
      }

      // Interpolação Linear (LERP) entre progresso atual e progresso alvo
      const delta = this.targetProgress - this.currentProgress;
      if (Math.abs(delta) > 0.001) {
        this.currentProgress += delta * this.lerpFactor;
      } else {
        this.currentProgress = this.targetProgress;
      }

      this.render();

      // Continua executando enquanto houver movimento pendente
      if (Math.abs(this.targetProgress - this.currentProgress) > 0.001) {
        window.requestAnimationFrame(() => this.tick());
      } else {
        this.isTicking = false;
      }
    }

    render() {
      const p = this.currentProgress;

      // 1. Sincronização do Tempo de Reprodução do Vídeo com o Scroll
      if (this.video && this.hasVideoMetadata && this.video.duration) {
        const targetTime = p * this.video.duration;
        // Atualiza apenas se a discrepância de tempo for perceptível para evitar jitter
        if (!this.video.seeking && Math.abs(this.video.currentTime - targetTime) > 0.035) {
          this.video.currentTime = targetTime;
        }
      }

      // 2. Transição Suave de Texto (Centrada exatamente nos 50% de Progresso)
      // Janela de transição: 42% a 58% (cruzamento com opacidade mútua suave aos 50%)
      if (this.titleInitial && this.titleReflection) {
        let initialOpacity = 0;
        let reflectionOpacity = 0;
        let initialY = 0;
        let reflectionY = 12;

        if (p < 0.42) {
          // Fase 1 Plena: "RESPIRA."
          initialOpacity = Math.min(1, p * 4); // Fade in rápido na entrada
          initialY = 0;
          reflectionOpacity = 0;
          reflectionY = 12;
        } else if (p >= 0.42 && p <= 0.58) {
          // Transição simétrica aos 50% (fade out de um e fade in do outro)
          const t = (p - 0.42) / (0.58 - 0.42); // de 0.0 a 1.0 (0.5 exatamente nos 50%)
          initialOpacity = 1 - t;
          initialY = -t * 10;

          reflectionOpacity = t;
          reflectionY = (1 - t) * 12;
        } else if (p > 0.58 && p < 0.85) {
          // Fase 2 Plena: "Olhar para dentro também é um começo."
          initialOpacity = 0;
          initialY = -10;
          reflectionOpacity = 1;
          reflectionY = 0;
        } else {
          // Saída suave no final da seção (> 85%)
          const t = Math.min(1, (p - 0.85) / 0.15);
          initialOpacity = 0;
          reflectionOpacity = 1 - t;
          reflectionY = -t * 8;
        }

        this.titleInitial.style.opacity = initialOpacity.toFixed(2);
        this.titleInitial.style.transform = `translate3d(0, ${initialY.toFixed(1)}px, 0)`;

        this.titleReflection.style.opacity = reflectionOpacity.toFixed(2);
        this.titleReflection.style.transform = `translate3d(0, ${reflectionY.toFixed(1)}px, 0)`;
      }

      // 3. Suavização sutil da moldura na saída final
      if (this.mediaWrapper) {
        if (p > 0.90) {
          const fadeOut = 1 - ((p - 0.90) / 0.10);
          this.mediaWrapper.style.opacity = Math.max(0, fadeOut).toFixed(2);
        } else {
          this.mediaWrapper.style.opacity = '1';
        }
      }
    }
  }

  // Inicialização segura no ciclo de vida da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.RespiroInstance = new RespiroExperience();
    });
  } else {
    window.RespiroInstance = new RespiroExperience();
  }
})();
