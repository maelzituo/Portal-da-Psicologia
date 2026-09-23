/**
 * PORTAL DA PSICOLOGIA - HYBRID VIDEO CONTROLLER
 * Arquitetura Híbrida de Vídeo de Altíssimo Desempenho (Desktop + Mobile).
 * 
 * - DESKTOP: Renderização 2D/Canvas GPU com sequência de 240 quadros WebP,
 *   sincronização viscosa e controle quadro a quadro por scroll.
 * 
 * - MOBILE: Vídeo nativo em loop contínuo em background (Muted + Playsinline + Autoplay).
 *   ZERO controle de currentTime por scroll.
 *   ZERO requestAnimationFrame para sincronizar vídeo com a rolagem.
 *   Pausa inteligente fora da tela (Zero CPU/Bateria em outras seções).
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const FRAME_PREFIX = 'public/frames-webp/f_';
  const FRAME_EXT = '.webp';

  class VideoController {
    constructor() {
      this.canvas = null;
      this.video = null;
      this.loadingState = null;
      this.ctx = null;
      
      // Estado do motor Desktop
      this.images = new Array(TOTAL_FRAMES + 1);
      this.loadedStatus = new Uint8Array(TOTAL_FRAMES + 1);
      this.lastRenderedIndex = -1;
      this.targetProgress = 0;
      this.smoothProgress = 0;
      this.velocity = 0;
      this.rafId = null;
      this.lastTime = performance.now();
      this.isDesktopPreloaded = false;

      // Estado do motor Mobile
      this.isPlayingMobile = false;
      this.mobileObserver = null;
      this.lastTriggeredSectionIndex = -1;

      this.init();
    }

    init() {
      this.canvas = document.getElementById('hero-canvas');
      this.video = document.getElementById('hero-video');
      this.loadingState = document.getElementById('video-loading');

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
        this.teardownDesktopEngine();
        this.setupMobileEngine();
      } else {
        this.teardownMobileEngine();
        this.setupDesktopEngine();
      }
    }

    /* =========================================================================
       1. MOTOR MOBILE (Background Loop Contínuo & Zero-CPU)
       ========================================================================= */
    setupMobileEngine() {
      if (!this.video) this.video = document.getElementById('hero-video');
      if (!this.video) return;

      // Configurações essenciais para iOS/Android executarem vídeo sem interferência
      this.video.muted = true;
      this.video.defaultMuted = true;
      this.video.playsInline = true;
      this.video.loop = true;
      this.video.autoplay = true;
      this.video.setAttribute('playsinline', '');
      this.video.setAttribute('webkit-playsinline', '');
      this.video.setAttribute('muted', '');
      this.video.setAttribute('autoplay', '');
      this.video.setAttribute('loop', '');
      this.video.style.display = 'block';

      if (this.canvas) {
        this.canvas.style.display = 'none';
      }

      this.attemptMobilePlay();

      // Observer para pausar o vídeo quando a seção Hero estiver fora da tela
      const heroSection = document.getElementById('hero-scroll-section');
      if (heroSection && 'IntersectionObserver' in window) {
        if (this.mobileObserver) this.mobileObserver.disconnect();

        this.mobileObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (this.video && this.video.paused) {
                this.video.play().catch(() => {});
              }
            } else {
              if (this.video && !this.video.paused) {
                this.video.pause();
              }
            }
          });
        }, { threshold: 0.05 });

        this.mobileObserver.observe(heroSection);
      }
    }

    attemptMobilePlay() {
      if (!this.video) return;

      const removeSpinner = () => {
        if (this.loadingState && !this.loadingState.classList.contains('loaded')) {
          this.loadingState.classList.add('loaded');
        }
      };

      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlayingMobile = true;
            removeSpinner();
          })
          .catch(() => {
            // Em caso de bloqueio por modo de economia de energia, desbloqueia no primeiro toque/interação
            const unlockHandler = () => {
              if (this.video) {
                this.video.play().then(removeSpinner).catch(() => {});
              }
              ['touchstart', 'touchend', 'click', 'scroll', 'pointerdown'].forEach((evt) => {
                window.removeEventListener(evt, unlockHandler);
              });
            };

            ['touchstart', 'touchend', 'click', 'scroll', 'pointerdown'].forEach((evt) => {
              window.addEventListener(evt, unlockHandler, { once: true, passive: true });
            });
          });
      }

      this.video.addEventListener('playing', removeSpinner, { once: true });
      this.video.addEventListener('canplay', removeSpinner, { once: true });
      setTimeout(removeSpinner, 600);
    }

    /**
     * Ajuste discreto opcional na entrada de uma nova seção (máximo 1 vez por seção)
     */
    nudgeSectionTime(sectionIndex) {
      if (sectionIndex === this.lastTriggeredSectionIndex || !this.video) return;
      this.lastTriggeredSectionIndex = sectionIndex;

      // Não interrompe o fluxo contínuo do vídeo a menos que seja um salto expressivo
      // e realiza apenas se o vídeo estiver carregado
      if (this.video.duration && isFinite(this.video.duration)) {
        const targetOffsets = [0, 1.8, 3.8, 5.5];
        const targetSec = targetOffsets[sectionIndex - 1];
        if (targetSec !== undefined) {
          const current = this.video.currentTime;
          // Só ajusta se a diferença for muito grande, sem forçar repaint brusco
          if (Math.abs(current - targetSec) > 3.0) {
            try {
              this.video.currentTime = targetSec;
            } catch (e) {}
          }
        }
      }
    }

    teardownMobileEngine() {
      if (this.mobileObserver) {
        this.mobileObserver.disconnect();
        this.mobileObserver = null;
      }
      if (this.video && !this.video.paused) {
        this.video.pause();
      }
    }

    /* =========================================================================
       2. MOTOR DESKTOP (Sequência WebP 240 frames + Canvas 2D Retina)
       ========================================================================= */
    setupDesktopEngine() {
      if (!this.canvas) this.canvas = document.getElementById('hero-canvas');
      if (!this.canvas) return;

      this.canvas.style.display = 'block';
      if (this.video) {
        this.video.style.display = 'none';
        this.video.pause();
      }

      if (!this.isDesktopPreloaded) {
        this.preloadDesktopFrames();
        this.isDesktopPreloaded = true;
      }

      this.fitCanvasDimensions();
      this.lastRenderedIndex = -1;
      this.drawFrame(1);

      if (!this.rafId) {
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.smoothRenderLoop.bind(this));
      }
    }

    get2DContext() {
      if (!this.ctx && this.canvas) {
        this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
      }
      return this.ctx;
    }

    fitCanvasDimensions() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      const width = Math.round(rect.width * dpr) || 1280;
      const height = Math.round(rect.height * dpr) || 720;

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.lastRenderedIndex > 0) {
          this.drawFrame(this.lastRenderedIndex);
        }
      }
    }

    formatFrameNumber(num) {
      return String(num).padStart(4, '0');
    }

    preloadDesktopFrames() {
      for (let i = 1; i <= Math.min(15, TOTAL_FRAMES); i++) {
        this.loadSingleFrame(i, i === 1);
      }

      setTimeout(() => {
        for (let i = 16; i <= TOTAL_FRAMES; i += 4) {
          this.loadSingleFrame(i);
        }

        setTimeout(() => {
          let currentFrame = 1;
          const loadBatch = () => {
            const batchLimit = Math.min(currentFrame + 12, TOTAL_FRAMES);
            for (; currentFrame <= batchLimit; currentFrame++) {
              if (!this.loadedStatus[currentFrame]) {
                this.loadSingleFrame(currentFrame);
              }
            }
            if (currentFrame <= TOTAL_FRAMES) {
              if (window.requestIdleCallback) {
                requestIdleCallback(loadBatch, { timeout: 200 });
              } else {
                setTimeout(loadBatch, 16);
              }
            }
          };
          loadBatch();
        }, 150);
      }, 50);
    }

    loadSingleFrame(index, isFirstFrame = false) {
      if (this.images[index]) return;

      const img = new Image();
      img.src = `${FRAME_PREFIX}${this.formatFrameNumber(index)}${FRAME_EXT}`;
      this.images[index] = img;

      const onLoaded = () => {
        this.loadedStatus[index] = 1;
        if (isFirstFrame) {
          if (this.loadingState) this.loadingState.classList.add('loaded');
          this.fitCanvasDimensions();
          this.drawFrame(1);
        }
      };

      if (img.decode) {
        img.decode().then(onLoaded).catch(() => {
          img.onload = onLoaded;
        });
      } else {
        img.onload = onLoaded;
      }
    }

    drawFrame(frameIndex) {
      const img = this.images[frameIndex];
      if (!img || !this.loadedStatus[frameIndex]) {
        for (let offset = 1; offset < 30; offset++) {
          if (frameIndex - offset >= 1 && this.loadedStatus[frameIndex - offset]) {
            this.drawActualImage(this.images[frameIndex - offset]);
            return;
          }
          if (frameIndex + offset <= TOTAL_FRAMES && this.loadedStatus[frameIndex + offset]) {
            this.drawActualImage(this.images[frameIndex + offset]);
            return;
          }
        }
        return;
      }

      this.drawActualImage(img);
      this.lastRenderedIndex = frameIndex;
    }

    drawActualImage(img) {
      const context = this.get2DContext();
      if (!context || !this.canvas || !img) return;

      const cw = this.canvas.width;
      const ch = this.canvas.height;
      const nw = img.naturalWidth || 1280;
      const nh = img.naturalHeight || 720;

      const imgRatio = nw / nh;
      const canvasRatio = cw / ch;

      let drawWidth, drawHeight, drawX, drawY;

      if (canvasRatio > imgRatio) {
        drawWidth = cw;
        drawHeight = cw / imgRatio;
        drawX = 0;
        drawY = (ch - drawHeight) * 0.46;
      } else {
        drawHeight = ch;
        drawWidth = ch * imgRatio;
        drawX = (cw - drawWidth) * 0.5;
        drawY = 0;
      }

      context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    smoothRenderLoop(time) {
      if (window.DeviceDetector && window.DeviceDetector.isMobile) {
        this.rafId = null;
        return;
      }

      const deltaMs = Math.min(time - this.lastTime, 40);
      const dt = deltaMs / 1000;
      this.lastTime = time;

      const diff = this.targetProgress - this.smoothProgress;
      const absDiff = Math.abs(diff);

      const springTension = 26.0;
      const damping = 9.8;

      const force = diff * springTension - this.velocity * damping;
      this.velocity += force * dt;
      this.smoothProgress += this.velocity * dt;

      if (absDiff < 0.00002 && Math.abs(this.velocity) < 0.0001) {
        this.smoothProgress = this.targetProgress;
        this.velocity = 0;
      }

      const boundedProgress = Math.max(0, Math.min(1, this.smoothProgress));
      const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(boundedProgress * (TOTAL_FRAMES - 1)) + 1));
      
      if (targetFrame !== this.lastRenderedIndex) {
        this.drawFrame(targetFrame);
      }

      this.rafId = requestAnimationFrame(this.smoothRenderLoop.bind(this));
    }

    updateDesktopScrollProgress(progress) {
      this.targetProgress = progress;
    }

    teardownDesktopEngine() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  // Exportação Global Singleton
  window.VideoController = new VideoController();
})();
