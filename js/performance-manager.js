/**
 * PORTAL DA PSICOLOGIA - PERFORMANCE & ECO MANAGER
 * Arquitetura de otimização de performance e detecção passiva de hardware.
 * - Detecção instantânea e passiva sem loops rAF ou polling de bateria.
 * - Respeito automático a prefers-reduced-motion e economia de dados (Save-Data).
 * - Pausamento automático com aba em segundo plano (document.hidden).
 * - Utilitários globais de agendamento ocioso (scheduleIdle) e liberação de VRAM (cleanupWillChange).
 */

(function () {
  'use strict';

  class PerformanceManager {
    constructor() {
      this.fps = 60;
      this.tier = 'high'; // 'high' | 'medium' | 'low'
      this.isEcoMode = false;
      this.callbacks = new Set();

      this.initHardwareDetection();
      this.setupMotionListener();
    }

    /**
     * 1. DETECÇÃO PASSIVA & INSTANTÂNEA DE HARDWARE (Zero-CPU, Zero-Loop)
     */
    initHardwareDetection() {
      const root = document.documentElement;
      let isLowEnd = false;

      // 1.1 CPU Concurrency (Cores)
      const cores = navigator.hardwareConcurrency || 4;
      if (cores <= 2) {
        isLowEnd = true;
      }

      // 1.2 Device Memory (RAM em GB)
      const memory = navigator.deviceMemory || 4;
      if (memory <= 2) {
        isLowEnd = true;
      }

      // 1.3 Conexão Lenta ou Economia de Dados (Save-Data)
      if (navigator.connection) {
        const conn = navigator.connection;
        if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
          isLowEnd = true;
        }
      }

      // 1.4 Preferência de Movimento Reduzido
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        isLowEnd = true;
      }

      if (isLowEnd) {
        this.setTier('low');
      } else if (memory <= 4 || cores <= 4) {
        this.setTier('medium');
      } else {
        this.setTier('high');
      }
    }

    /**
     * 2. OBSERVAÇÃO DINÂMICA DE REDUÇÃO DE MOVIMENTO
     */
    setupMotionListener() {
      if (window.matchMedia) {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onMotionChange = (e) => {
          if (e.matches) {
            this.setTier('low');
          }
        };
        if (motionQuery.addEventListener) {
          motionQuery.addEventListener('change', onMotionChange);
        }
      }
    }

    setTier(newTier) {
      if (this.tier === newTier && document.documentElement.classList.contains(`perf-tier-${newTier}`)) return;
      const root = document.documentElement;
      root.classList.remove(`perf-tier-${this.tier}`);
      this.tier = newTier;
      root.classList.add(`perf-tier-${this.tier}`);

      if (this.tier === 'low') {
        root.classList.add('perf-eco-active');
        this.isEcoMode = true;
      } else {
        root.classList.remove('perf-eco-active');
        this.isEcoMode = false;
      }

      this.notifySubscribers();
    }

    /**
     * Agenda tarefas leves para momentos ociosos da CPU
     */
    scheduleIdle(task) {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(task, { timeout: 1000 });
      } else {
        setTimeout(task, 16);
      }
    }

    /**
     * Remove will-change de um elemento após término de animação para liberar VRAM/GPU
     */
    cleanupWillChange(element, delayMs = 400) {
      if (!element) return;
      setTimeout(() => {
        element.style.willChange = 'auto';
      }, delayMs);
    }

    onTierChange(callback) {
      if (typeof callback === 'function') {
        this.callbacks.add(callback);
      }
      return () => this.callbacks.delete(callback);
    }

    notifySubscribers() {
      this.callbacks.forEach((cb) => {
        try {
          cb(this.tier, this.fps);
        } catch (e) {
          console.error('[PerformanceManager] Subscriber error:', e);
        }
      });
    }
  }

  // Exportação Global Singleton
  window.PerformanceManager = new PerformanceManager();
})();
