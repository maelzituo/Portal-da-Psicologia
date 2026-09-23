/**
 * PORTAL DA PSICOLOGIA - STORY CONTROLLER MODULE
 * Orquestrador central da narrativa cinematográfica em "Story Sections".
 * 
 * - MOBILE: Story Sections orientadas por rolagem natural e IntersectionObserver.
 *   Identifica a seção ativa com precisão, ativa animações GPU leves e descarta as inativas.
 *   O vídeo em background flui livremente em 60 FPS sem overhead.
 * 
 * - DESKTOP: Sincronização integrada com GSAP ScrollTrigger Pinning.
 */

(function () {
  'use strict';

  class StoryController {
    constructor() {
      this.section = null;
      this.phase1 = null;
      this.phase2 = null;
      this.phase3 = null;
      this.ctaStage = null;
      this.allPhases = [];
      this.moments = [];
      this.scrollIndicator = null;
      
      this.activeStepIndex = 1;
      this.mobileObserver = null;
      this.desktopTrigger = null;

      this.init();
    }

    init() {
      this.section = document.getElementById('hero-scroll-section');
      this.phase1 = document.getElementById('phase-1-text');
      this.phase2 = document.getElementById('phase-2-text');
      this.phase3 = document.getElementById('phase-3-text');
      this.ctaStage = document.getElementById('hero-cta-stage');
      this.scrollIndicator = document.getElementById('scroll-indicator');

      this.allPhases = [this.phase1, this.phase2, this.phase3, this.ctaStage].filter(Boolean);

      const moment1 = document.getElementById('moment-1');
      const moment2 = document.getElementById('moment-2');
      const moment3 = document.getElementById('moment-3');
      const moment4 = document.getElementById('moment-4');
      this.moments = [moment1, moment2, moment3, moment4].filter(Boolean);

      if (window.DeviceDetector) {
        window.DeviceDetector.onModeChange((newMode) => {
          this.switchMode(newMode);
        });
      }

      const initialMode = (window.DeviceDetector && window.DeviceDetector.isMobile) ? 'mobile' : 'desktop';
      this.switchMode(initialMode);
    }

    switchMode(mode) {
      if (mode === 'mobile') {
        this.teardownDesktopStory();
        this.setupMobileStory();
      } else {
        this.teardownMobileStory();
        this.setupDesktopStory();
      }
    }

    /* =========================================================================
       1. NARRATIVA MOBILE (Story Sections & IntersectionObserver)
       ========================================================================= */
    setupMobileStory() {
      this.hideMoments();
      
      const triggers = document.querySelectorAll('.story-trigger');
      if (!triggers.length) {
        // Fallback: se os triggers não estiverem no DOM, ativa fase 1 por padrão
        this.activateStep(1);
        return;
      }

      if ('IntersectionObserver' in window) {
        if (this.mobileObserver) this.mobileObserver.disconnect();

        // Configuração de threshold e margem para detecção fluida de cada capítulo
        const observerOptions = {
          root: null,
          rootMargin: '-15% 0px -30% 0px',
          threshold: [0, 0.25, 0.5, 0.75]
        };

        this.mobileObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const stepIndex = parseInt(entry.target.getAttribute('data-story-index'), 10);
              if (stepIndex && !isNaN(stepIndex)) {
                this.activateStep(stepIndex);
              }
            }
          });
        }, observerOptions);

        triggers.forEach((trigger) => {
          this.mobileObserver.observe(trigger);
        });
      }

      // Oculta o indicador de scroll ao primeiro movimento
      const onFirstScroll = () => {
        if (this.scrollIndicator) this.scrollIndicator.classList.add('hidden');
        window.removeEventListener('scroll', onFirstScroll);
      };
      window.addEventListener('scroll', onFirstScroll, { passive: true, once: true });

      // Ativa o primeiro passo inicialmente
      this.activateStep(1);
    }

    activateStep(stepIndex) {
      if (this.activeStepIndex === stepIndex && this.hasInitializedStep) return;
      this.activeStepIndex = stepIndex;
      this.hasInitializedStep = true;

      let targetPhase = null;
      if (stepIndex === 1) targetPhase = this.phase1;
      else if (stepIndex === 2) targetPhase = this.phase2;
      else if (stepIndex === 3) targetPhase = this.phase3;
      else if (stepIndex === 4) targetPhase = this.ctaStage;

      if (window.AnimationController) {
        window.AnimationController.activateStoryStep(targetPhase, this.allPhases);
      } else {
        this.allPhases.forEach((p) => {
          if (p === targetPhase) {
            p.classList.add('active');
            p.style.opacity = '1';
          } else {
            p.classList.remove('active');
            p.style.opacity = '0';
          }
        });
      }

      // Comunica ao VideoController para um possível ajuste sutil (opcional)
      if (window.VideoController && typeof window.VideoController.nudgeSectionTime === 'function') {
        window.VideoController.nudgeSectionTime(stepIndex);
      }
    }

    teardownMobileStory() {
      if (this.mobileObserver) {
        this.mobileObserver.disconnect();
        this.mobileObserver = null;
      }
    }

    /* =========================================================================
       2. NARRATIVA DESKTOP (GSAP ScrollTrigger Pinning Integrado)
       ========================================================================= */
    setupDesktopStory() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        setTimeout(() => this.setupDesktopStory(), 50);
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      if (!this.section) return;

      const existingTrigger = ScrollTrigger.getById('desktop-hero-scroll');
      if (existingTrigger) existingTrigger.kill(true);

      const scrollDistance = '+=3600';

      this.desktopTrigger = ScrollTrigger.create({
        id: 'desktop-hero-scroll',
        trigger: this.section,
        start: 'top top',
        end: scrollDistance,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Atualiza o motor visual do Canvas
          if (window.VideoController) {
            window.VideoController.updateDesktopScrollProgress(progress);
          }

          // Atualiza as camadas narrativas no desktop
          this.updateDesktopNarrative(progress);

          // Header visibility sync
          if (progress < 0.98) {
            const header = document.querySelector('.site-header');
            if (header && header.classList.contains('scrolled')) {
              header.classList.remove('scrolled');
            }
          }
        },
        onLeave: () => {
          const header = document.querySelector('.site-header');
          if (header) header.classList.add('scrolled');
        },
        onEnterBack: () => {
          const header = document.querySelector('.site-header');
          if (header) header.classList.remove('scrolled');
        }
      });

      this.updateDesktopNarrative(0);
      ScrollTrigger.refresh();
    }

    updateDesktopNarrative(p) {
      if (this.scrollIndicator) {
        if (p > 0.015) this.scrollIndicator.classList.add('hidden');
        else this.scrollIndicator.classList.remove('hidden');
      }

      const anim = window.AnimationController;

      // FASE 1: Introdução Poética (0% a 20%)
      if (p < 0.20) {
        if (anim) anim.activateStoryStep(this.phase1, this.allPhases);
        this.hideMoments();
        this.setCanvasOpacity(0.35);
      }
      // FASE 2: Posicionamento e Acolhimento (20% a 38%)
      else if (p >= 0.20 && p < 0.38) {
        if (anim) anim.activateStoryStep(this.phase2, this.allPhases);
        this.hideMoments();
        this.setCanvasOpacity(0.75);
      }
      // FASE 3: Ambiente e Saúde Mental + Momentos Sincronizados (38% a 84%)
      else if (p >= 0.38 && p < 0.84) {
        if (anim) anim.activateStoryStep(this.phase3, this.allPhases);
        this.setCanvasOpacity(1.0);

        if (anim) {
          anim.toggleMoment(this.moments[0], p >= 0.42 && p < 0.54);
          anim.toggleMoment(this.moments[1], p >= 0.54 && p < 0.65);
          anim.toggleMoment(this.moments[2], p >= 0.65 && p < 0.75);
          anim.toggleMoment(this.moments[3], p >= 0.75 && p < 0.84);
        }
      }
      // FASE 4: Chamada para Ação Final (84% a 100%)
      else if (p >= 0.84) {
        if (anim) anim.activateStoryStep(this.ctaStage, this.allPhases);
        this.hideMoments();
        this.setCanvasOpacity(0.28);
      }
    }

    setCanvasOpacity(val) {
      const canvas = document.getElementById('hero-canvas');
      if (canvas && canvas.style.opacity !== String(val)) {
        canvas.style.opacity = String(val);
      }
    }

    hideMoments() {
      if (window.AnimationController) {
        this.moments.forEach((m) => {
          window.AnimationController.toggleMoment(m, false);
        });
      } else {
        this.moments.forEach((m) => {
          if (m) m.classList.remove('active');
        });
      }
    }

    teardownDesktopStory() {
      if (this.desktopTrigger) {
        this.desktopTrigger.kill(true);
        this.desktopTrigger = null;
      }
    }
  }

  // Exportação Global Singleton
  window.StoryController = new StoryController();
})();
