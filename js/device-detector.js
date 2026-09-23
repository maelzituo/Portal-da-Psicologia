/**
 * PORTAL DA PSICOLOGIA - DEVICE DETECTOR MODULE
 * Detecção inteligente e adaptativa de dispositivos móveis vs. desktop.
 * Utiliza múltiplos fatores heurísticos: viewport, pointer (coarse/fine),
 * touch capabilities, hover support e preferências de acessibilidade.
 */

(function () {
  'use strict';

  class DeviceDetector {
    constructor() {
      this.listeners = new Set();
      this.mode = null;
      this.isMobile = false;
      this.isDesktop = false;
      this.isTouch = false;
      this.isCoarsePointer = false;
      this.hasHover = true;
      this.prefersReducedMotion = false;

      this.evaluateDevice();
      this.setupEventListeners();
    }

    /**
     * Avaliação multifatorial do dispositivo atual
     */
    evaluateDevice() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Touch e Pointer Capabilities
      this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
      
      const coarseMedia = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
      const hoverNoneMedia = window.matchMedia ? window.matchMedia('(hover: none)').matches : false;
      
      this.isCoarsePointer = coarseMedia || (this.isTouch && width < 1024);
      this.hasHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : !this.isTouch;

      // 2. Preferência de Movimento Reduzido (Acessibilidade)
      this.prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

      // 3. Classificação de Modo (Mobile vs Desktop)
      // Dispositivo Móvel: Viewport < 768px OU tela touch/coarse < 992px
      const isMobileViewport = width < 768;
      const isTouchTabletOrPhone = this.isCoarsePointer && width < 992 && hoverNoneMedia;

      const previousMode = this.mode;
      this.isMobile = isMobileViewport || isTouchTabletOrPhone;
      this.isDesktop = !this.isMobile;
      this.mode = this.isMobile ? 'mobile' : 'desktop';

      // Atualiza classes semânticas no elemento raiz (HTML)
      const root = document.documentElement;
      if (this.isMobile) {
        root.classList.add('device-mobile');
        root.classList.remove('device-desktop');
      } else {
        root.classList.add('device-desktop');
        root.classList.remove('device-mobile');
      }

      if (this.isTouch) {
        root.classList.add('device-touch');
      }

      // Notifica inscritos se houver transição de modo
      if (previousMode && previousMode !== this.mode) {
        this.notifyChange(this.mode, previousMode);
      }
    }

    /**
     * Listeners de resize e media query com debounce para zero sobrecarga de CPU
     */
    setupEventListeners() {
      let resizeDebounce = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
          this.evaluateDevice();
        }, 120);
      }, { passive: true });

      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.evaluateDevice();
        }, 150);
      }, { passive: true });

      if (window.matchMedia) {
        const mediaQueryMobile = window.matchMedia('(max-width: 767.98px)');
        if (mediaQueryMobile.addEventListener) {
          mediaQueryMobile.addEventListener('change', () => this.evaluateDevice());
        } else if (mediaQueryMobile.addListener) {
          mediaQueryMobile.addListener(() => this.evaluateDevice());
        }

        const mediaQueryPointer = window.matchMedia('(pointer: coarse)');
        if (mediaQueryPointer.addEventListener) {
          mediaQueryPointer.addEventListener('change', () => this.evaluateDevice());
        }
      }
    }

    /**
     * Inscreve um callback para ser executado quando o modo do dispositivo mudar
     */
    onModeChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.add(callback);
      }
      return () => this.listeners.delete(callback);
    }

    notifyChange(newMode, oldMode) {
      this.listeners.forEach((callback) => {
        try {
          callback(newMode, oldMode);
        } catch (e) {
          console.error('[DeviceDetector] Callback error:', e);
        }
      });
    }
  }

  // Exportação Global Singleton
  window.DeviceDetector = new DeviceDetector();
})();
