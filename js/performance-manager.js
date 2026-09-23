/**
 * PORTAL DA PSICOLOGIA - PERFORMANCE & ECO MANAGER
 * Arquitetura de telemetria adaptativa para hardware móvel e baixo consumo de energia.
 * - Monitoramento de taxa de quadros (FPS) e frame budget de 16.6ms.
 * - Detecção heurística de hardware (RAM, CPU Cores, GPU, Bateria, Conexão).
 * - Degradação graciosa e eliminação de repaints desnecessários em dispositivos modestos.
 */

(function () {
  'use strict';

  class PerformanceManager {
    constructor() {
      this.fps = 60;
      this.frameCount = 0;
      this.lastFrameTime = performance.now();
      this.lowFpsCounter = 0;
      this.tier = 'high'; // 'high' | 'medium' | 'low'
      this.isEcoMode = false;
      this.isMonitoring = true;
      this.callbacks = new Set();

      this.initHardwareDetection();
      this.startFpsMonitoring();
      this.setupPowerAndNetworkListeners();
    }

    /**
     * 1. DETECÇÃO HEURÍSTICA DE HARDWARE & SISTEMA
     */
    initHardwareDetection() {
      const root = document.documentElement;
      let isLowEnd = false;

      // 1.1 CPU Concurrency (Cores)
      const cores = navigator.hardwareConcurrency || 4;
      if (cores <= 4) {
        isLowEnd = true;
      }

      // 1.2 Device Memory (RAM em GB)
      const memory = navigator.deviceMemory || 4;
      if (memory <= 3) {
        isLowEnd = true;
      }

      // 1.3 Conexão Lenta ou Economia de Dados
      if (navigator.connection) {
        const conn = navigator.connection;
        if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.effectiveType === '3g') {
          isLowEnd = true;
        }
      }

      // 1.4 Preferência de Movimento Reduzido
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        isLowEnd = true;
      }

      // 1.5 Viewport Mobile (< 768px) com pouca RAM
      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);

      if (isLowEnd || (isMobile && memory <= 4)) {
        this.setTier('low');
      } else if (memory <= 4 || cores <= 6) {
        this.setTier('medium');
      } else {
        this.setTier('high');
      }

      // Aplica classes de otimização CSS imediatas
      root.classList.add(`perf-tier-${this.tier}`);
      if (this.tier === 'low') {
        root.classList.add('perf-eco-active');
        this.isEcoMode = true;
      }
    }

    /**
     * 2. MONITORAMENTO DE FPS EM TEMPO REAL
     */
    startFpsMonitoring() {
      let frames = 0;
      let startTime = performance.now();

      const checkFpsLoop = (now) => {
        if (!this.isMonitoring) return;

        frames++;
        const delta = now - startTime;

        if (delta >= 1000) {
          this.fps = Math.round((frames * 1000) / delta);
          frames = 0;
          startTime = now;

          // Se detectar FPS persistentemente baixo (< 36 FPS por 3 amostragens consecutivas)
          if (this.fps < 36) {
            this.lowFpsCounter++;
            if (this.lowFpsCounter >= 3 && this.tier !== 'low') {
              this.setTier('low');
              document.documentElement.classList.add('perf-eco-active');
              this.isEcoMode = true;
            }
          } else if (this.fps >= 50) {
            this.lowFpsCounter = Math.max(0, this.lowFpsCounter - 1);
          }

          this.notifySubscribers();
        }

        requestAnimationFrame(checkFpsLoop);
      };

      requestAnimationFrame(checkFpsLoop);
    }

    /**
     * 3. MONITORAMENTO DE BATERIA E ECONOMIA DE ENERGIA
     */
    setupPowerAndNetworkListeners() {
      if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
          const checkBattery = () => {
            if (battery.level <= 0.20 && !battery.charging) {
              this.setTier('low');
              document.documentElement.classList.add('perf-eco-active');
              this.isEcoMode = true;
            }
          };

          checkBattery();
          battery.addEventListener('levelchange', checkBattery);
          battery.addEventListener('chargingchange', checkBattery);
        }).catch(() => {});
      }
    }

    setTier(newTier) {
      if (this.tier === newTier) return;
      const root = document.documentElement;
      root.classList.remove(`perf-tier-${this.tier}`);
      this.tier = newTier;
      root.classList.add(`perf-tier-${this.tier}`);
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
    cleanupWillChange(element, delayMs = 600) {
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
