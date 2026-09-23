/**
 * PORTAL DA PSICOLOGIA - UNIFIED HYBRID ENGINE (DESKTOP + MOBILE)
 * Script unificado de alta performance que elimina qualquer conflito de dependências.
 * 
 * - DESKTOP (>= 768px): Sequência Apple-Style de 240 quadros WebP renderizados em Canvas 2D Retina
 *   com amortecimento viscoso e GSAP ScrollTrigger Pinning integrado.
 * 
 * - MOBILE (< 768px): Vídeo nativo em loop contínuo e suave (60 FPS contínuos)
 *   com narrativa adaptada e pausamento automático fora da tela para poupar 100% de CPU.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const FRAME_PREFIX = 'public/frames-webp/f_';
  const FRAME_EXT = '.webp';

  function isDesktopScreen() {
    return window.innerWidth >= 768;
  }

  function formatFrameNumber(num) {
    return String(num).padStart(4, '0');
  }

  function initApp() {
    const section = document.getElementById('hero-scroll-section');
    const canvas = document.getElementById('hero-canvas');
    const video = document.getElementById('hero-video');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const phase1 = document.getElementById('phase-1-text');
    const phase2 = document.getElementById('phase-2-text');
    const phase3 = document.getElementById('phase-3-text');
    const ctaStage = document.getElementById('hero-cta-stage');
    const loadingState = document.getElementById('video-loading');

    const moment1 = document.getElementById('moment-1');
    const moment2 = document.getElementById('moment-2');
    const moment3 = document.getElementById('moment-3');
    const moment4 = document.getElementById('moment-4');
    const moments = [moment1, moment2, moment3, moment4].filter(Boolean);

    const allLayers = [phase1, phase2, phase3, ctaStage].filter(Boolean);

    if (!section) return;

    /* =========================================================================
       1. CONTROLE DE CAMADAS NARRATIVAS (GPU ACCELERATED & ZERO-JANK)
       ========================================================================= */
    let currentActiveLayer = null;

    function activateLayer(targetLayer) {
      if (currentActiveLayer === targetLayer) return;
      currentActiveLayer = targetLayer;

      allLayers.forEach((layer) => {
        if (!layer) return;
        if (layer === targetLayer) {
          layer.classList.add('active');
          layer.style.opacity = '1';
          layer.style.visibility = 'visible';
          layer.style.pointerEvents = 'auto';
          layer.style.transform = 'translate3d(0, 0, 0)';
        } else {
          layer.classList.remove('active');
          layer.style.opacity = '0';
          layer.style.visibility = 'hidden';
          layer.style.pointerEvents = 'none';
          layer.style.transform = 'translate3d(0, -10px, 0)';
        }
      });
    }

    function toggleMoment(element, show) {
      if (!element) return;
      if (show) {
        if (!element.classList.contains('active')) {
          element.classList.add('active');
          element.style.opacity = '1';
          element.style.transform = 'translate3d(0, 0, 0)';
        }
      } else {
        if (element.classList.contains('active')) {
          element.classList.remove('active');
          element.style.opacity = '0';
          element.style.transform = 'translate3d(0, 10px, 0)';
        }
      }
    }

    function hideAllMoments() {
      moments.forEach((m) => toggleMoment(m, false));
    }

    function setCanvasOpacity(val) {
      if (canvas && canvas.style.opacity !== String(val)) {
        canvas.style.opacity = String(val);
      }
    }

    /* =========================================================================
       2. MOTOR DESKTOP: CANVAS 2D + 240 QUADROS WEBP + GSAP PINNING
       ========================================================================= */
    const images = new Array(TOTAL_FRAMES + 1);
    const loadedStatus = new Uint8Array(TOTAL_FRAMES + 1);
    let lastRenderedIndex = -1;
    let ctx = null;
    let isDesktopInitialized = false;

    let targetProgress = 0;
    let smoothProgress = 0;
    let velocity = 0;
    let rafId = null;
    let lastTime = performance.now();
    let desktopScrollTrigger = null;

    function get2DContext() {
      if (!ctx && canvas) {
        ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      }
      return ctx;
    }

    function fitCanvasDimensions() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr) || 1280;
      const height = Math.round(rect.height * dpr) || 720;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (lastRenderedIndex > 0) {
          drawDesktopFrame(lastRenderedIndex);
        }
      }
    }

    function preloadDesktopFrames() {
      // 1. Primeiros 15 quadros imediatamente
      for (let i = 1; i <= Math.min(15, TOTAL_FRAMES); i++) {
        loadDesktopFrame(i, i === 1);
      }

      // 2. Quadros chave a cada 4 frames
      setTimeout(() => {
        for (let i = 16; i <= TOTAL_FRAMES; i += 4) {
          loadDesktopFrame(i);
        }

        // 3. Demais quadros em batches ociosos
        setTimeout(() => {
          let current = 1;
          const loadBatch = () => {
            const limit = Math.min(current + 12, TOTAL_FRAMES);
            for (; current <= limit; current++) {
              if (!loadedStatus[current]) {
                loadDesktopFrame(current);
              }
            }
            if (current <= TOTAL_FRAMES) {
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

    function loadDesktopFrame(index, isFirstFrame = false) {
      if (images[index]) return;

      const img = new Image();
      img.src = `${FRAME_PREFIX}${formatFrameNumber(index)}${FRAME_EXT}`;
      images[index] = img;

      const onLoaded = () => {
        loadedStatus[index] = 1;
        if (isFirstFrame) {
          if (loadingState) loadingState.classList.add('loaded');
          fitCanvasDimensions();
          drawDesktopFrame(1);
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

    function drawDesktopFrame(frameIndex) {
      const img = images[frameIndex];
      if (!img || !loadedStatus[frameIndex]) {
        for (let offset = 1; offset < 30; offset++) {
          if (frameIndex - offset >= 1 && loadedStatus[frameIndex - offset]) {
            drawActualImage(images[frameIndex - offset]);
            return;
          }
          if (frameIndex + offset <= TOTAL_FRAMES && loadedStatus[frameIndex + offset]) {
            drawActualImage(images[frameIndex + offset]);
            return;
          }
        }
        return;
      }

      drawActualImage(img);
      lastRenderedIndex = frameIndex;
    }

    function drawActualImage(img) {
      const context = get2DContext();
      if (!context || !canvas || !img) return;

      const cw = canvas.width;
      const ch = canvas.height;
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

    function smoothRenderLoop(time) {
      if (!isDesktopScreen()) {
        rafId = null;
        return;
      }

      const deltaMs = Math.min(time - lastTime, 40);
      const dt = deltaMs / 1000;
      lastTime = time;

      const diff = targetProgress - smoothProgress;
      const absDiff = Math.abs(diff);

      const springTension = 26.0;
      const damping = 9.8;

      const force = diff * springTension - velocity * damping;
      velocity += force * dt;
      smoothProgress += velocity * dt;

      if (absDiff < 0.00002 && Math.abs(velocity) < 0.0001) {
        smoothProgress = targetProgress;
        velocity = 0;
      }

      const boundedProgress = Math.max(0, Math.min(1, smoothProgress));
      const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(boundedProgress * (TOTAL_FRAMES - 1)) + 1));

      if (targetFrame !== lastRenderedIndex) {
        drawDesktopFrame(targetFrame);
      }

      updateDesktopVisuals(boundedProgress);

      rafId = requestAnimationFrame(smoothRenderLoop);
    }

    function updateDesktopVisuals(p) {
      if (scrollIndicator) {
        if (p > 0.015) scrollIndicator.classList.add('hidden');
        else scrollIndicator.classList.remove('hidden');
      }

      // FASE 1: Introdução Poética (0% a 20%)
      if (p < 0.20) {
        activateLayer(phase1);
        setCanvasOpacity(0.35);
        hideAllMoments();
      }
      // FASE 2: Posicionamento e Acolhimento (20% a 38%)
      else if (p >= 0.20 && p < 0.38) {
        activateLayer(phase2);
        setCanvasOpacity(0.75);
        hideAllMoments();
      }
      // FASE 3: Ambiente e Saúde Mental + Momentos Sincronizados (38% a 84%)
      else if (p >= 0.38 && p < 0.84) {
        activateLayer(phase3 || phase2);
        setCanvasOpacity(1.0);

        toggleMoment(moments[0], p >= 0.42 && p < 0.54);
        toggleMoment(moments[1], p >= 0.54 && p < 0.65);
        toggleMoment(moments[2], p >= 0.65 && p < 0.75);
        toggleMoment(moments[3], p >= 0.75 && p < 0.84);
      }
      // FASE 4: Chamada para Ação Final (84% a 100%)
      else if (p >= 0.84) {
        activateLayer(ctaStage);
        setCanvasOpacity(0.28);
        hideAllMoments();
      }
    }

    function setupDesktopMode() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        setTimeout(setupDesktopMode, 50);
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      if (canvas) canvas.style.display = 'block';
      if (video) {
        video.style.display = 'none';
        if (!video.paused) video.pause();
      }

      preloadDesktopFrames();
      fitCanvasDimensions();
      drawDesktopFrame(1);

      const existingTrigger = ScrollTrigger.getById('desktop-hero-scroll');
      if (existingTrigger) existingTrigger.kill(true);

      desktopScrollTrigger = ScrollTrigger.create({
        id: 'desktop-hero-scroll',
        trigger: section,
        start: 'top top',
        end: '+=3600',
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetProgress = self.progress;

          // Sincronização do Header
          const header = document.querySelector('.site-header');
          if (header) {
            if (self.progress < 0.98) {
              if (header.classList.contains('scrolled')) header.classList.remove('scrolled');
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

      updateDesktopVisuals(0);

      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(smoothRenderLoop);
      }

      isDesktopInitialized = true;
      ScrollTrigger.refresh();
    }

    /* =========================================================================
       3. MOTOR MOBILE: VÍDEO LOOP CONTÍNUO + HERO LIMPO E RÁPIDO
       ========================================================================= */
    let mobileObserver = null;

    function setupMobileMode() {
      if (desktopScrollTrigger) {
        desktopScrollTrigger.kill(true);
        desktopScrollTrigger = null;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (canvas) canvas.style.display = 'none';
      if (video) {
        video.style.display = 'block';
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.autoplay = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');

        const removeSpinner = () => {
          if (loadingState) loadingState.classList.add('loaded');
        };

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(removeSpinner).catch(() => {
            const unlock = () => {
              if (video) video.play().then(removeSpinner).catch(() => {});
              ['touchstart', 'touchend', 'click', 'scroll'].forEach((evt) => {
                window.removeEventListener(evt, unlock);
              });
            };
            ['touchstart', 'touchend', 'click', 'scroll'].forEach((evt) => {
              window.addEventListener(evt, unlock, { once: true, passive: true });
            });
          });
        }

        video.addEventListener('playing', removeSpinner, { once: true });
        setTimeout(removeSpinner, 600);
      }

      // No mobile, apresenta a fase 1 com excelência visual
      activateLayer(phase1);
      hideAllMoments();

      // Observer para pausar o vídeo fora da tela
      if ('IntersectionObserver' in window) {
        if (mobileObserver) mobileObserver.disconnect();
        mobileObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (video && video.paused) video.play().catch(() => {});
            } else {
              if (video && !video.paused) video.pause();
            }
          });
        }, { threshold: 0.05 });
        mobileObserver.observe(section);
      }
    }

    /* =========================================================================
       4. INICIALIZAÇÃO RESPONSIVA E RESIZE HANDLER
       ========================================================================= */
    function checkAndSwitch() {
      if (isDesktopScreen()) {
        setupDesktopMode();
      } else {
        setupMobileMode();
      }
    }

    checkAndSwitch();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (isDesktopScreen()) {
          fitCanvasDimensions();
          if (!isDesktopInitialized) {
            setupDesktopMode();
          } else if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        } else {
          isDesktopInitialized = false;
          setupMobileMode();
        }
      }, 150);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
