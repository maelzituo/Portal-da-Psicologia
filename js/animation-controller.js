/**
 * PORTAL DA PSICOLOGIA - ANIMATION CONTROLLER MODULE
 * Orquestrador de microanimações cinematográficas de alta performance (60/120 FPS).
 * - Utiliza estritamente propriedades aceleradas por hardware GPU (transform, opacity).
 * - Isenção total de filtros caros, blurs em tempo real, backdrop-filters dinâmicos ou box-shadows animadas.
 * - Gerenciamento automatizado de will-change para evitar vazamento de memória de vídeo.
 */

(function () {
  'use strict';

  class AnimationController {
    constructor() {
      this.activeAnimations = new Set();
    }

    /**
     * Ativa um elemento narrativo e oculta suavemente os demais elementos irmãos
     * @param {HTMLElement|null} targetElement Elemento a ser ativado
     * @param {Array<HTMLElement>} allElements Coleção completa de elementos da narrativa
     * @param {Object} options Configurações opcionais de transição
     */
    activateStoryStep(targetElement, allElements = [], options = {}) {
      if (!allElements || !allElements.length) return;

      const isMobile = window.DeviceDetector ? window.DeviceDetector.isMobile : (window.innerWidth < 768);
      const isReducedMotion = window.DeviceDetector ? window.DeviceDetector.prefersReducedMotion : false;

      allElements.forEach((el) => {
        if (!el) return;

        if (el === targetElement) {
          this.revealElement(el, isReducedMotion);
        } else {
          this.concealElement(el, isReducedMotion);
        }
      });
    }

    /**
     * Revela suavemente o elemento com GPU translate3d e opacity
     */
    revealElement(element, isReducedMotion = false) {
      if (!element) return;

      if (isReducedMotion) {
        element.classList.add('active');
        element.style.opacity = '1';
        element.style.visibility = 'visible';
        element.style.transform = 'none';
        element.style.pointerEvents = 'auto';
        return;
      }

      // 1. Marca will-change apenas durante a transição
      element.style.willChange = 'opacity, transform';
      element.classList.add('active');
      element.style.visibility = 'visible';
      element.style.pointerEvents = 'auto';

      // 2. Transição com easing aveludado e aceleração por hardware
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translate3d(0, 0, 0) scale(1)';

        // 3. Libera a GPU assim que a transição de 400-600ms termina
        if (window.PerformanceManager) {
          window.PerformanceManager.cleanupWillChange(element, 500);
        } else {
          setTimeout(() => { element.style.willChange = 'auto'; }, 500);
        }
      });
    }

    /**
     * Oculta o elemento sem causar repaints desnecessários
     */
    concealElement(element, isReducedMotion = false) {
      if (!element) return;

      if (!element.classList.contains('active') && element.style.opacity === '0') {
        return; // Já está oculto
      }

      if (isReducedMotion) {
        element.classList.remove('active');
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
        element.style.pointerEvents = 'none';
        return;
      }

      element.style.willChange = 'opacity, transform';
      element.style.opacity = '0';
      element.style.transform = 'translate3d(0, -12px, 0) scale(0.98)';
      element.style.pointerEvents = 'none';

      setTimeout(() => {
        if (!element.classList.contains('active')) {
          element.classList.remove('active');
          element.style.visibility = 'hidden';
          element.style.willChange = 'auto';
        }
      }, 400);
    }

    /**
     * Alterna a visibilidade de tags e badges com zero jank
     */
    toggleMoment(element, show = false) {
      if (!element) return;
      if (show) {
        if (!element.classList.contains('active')) {
          element.classList.add('active');
          element.style.opacity = '1';
          element.style.transform = 'translate3d(0, 0, 0) scale(1)';
        }
      } else {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
          element.style.opacity = '0';
          element.style.transform = 'translate3d(0, 14px, 0) scale(0.96)';
        }
      }
    }
  }

  // Exportação Global Singleton
  window.AnimationController = new AnimationController();
})();
