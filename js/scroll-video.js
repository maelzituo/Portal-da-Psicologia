/**
 * PORTAL DA PSICOLOGIA - MOTOR HÍBRIDO UNIFICADO DE VÍDEO & CANVAS (DESKTOP + MOBILE)
 * 
 * - DESKTOP (>= 768px): Sequência Apple-Style de 240 quadros WebP renderizados em Canvas 2D Retina
 *   com amortecimento viscoso (Spring Physics) e GSAP ScrollTrigger Pinning.
 *   Loop RAF auto-pausável: para quando estabilizado, fora da viewport ou com aba em segundo plano.
 * 
 * - MOBILE (< 768px): Vídeo nativo em loop contínuo e suave (60 FPS contínuos)
 *   com poster fallback imediato, recuperação de autoplay bloqueado e pausamento fora da tela.
 * 
 * - ACESSIBILIDADE: Respeito estrito a prefers-reduced-motion com fallback estático instantâneo.
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

    const allLayers = [phase1, phase2, phase3, ctaStage].filter(Boolean);

    if (!section) return;

    let isHeroInView = true;

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

      // 2. Quadros chave com espaçamento
      setTimeout(() => {
        for (let i = 16; i <= TOTAL_FRAMES; i += 4) {
          loadDesktopFrame(i);
        }

        // 3. Demais quadros em batches ociosos sem bloquear a thread principal
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

      if (isFirstFrame) {
        setTimeout(() => {
          if (loadingState && !loadingState.classList.contains('loaded')) {
            loadingState.classList.add('loaded');
          }
        }, 350);
      }

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
        // Fallback para o quadro mais próximo já carregado
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

    /**
     * Loop com amortecimento viscoso (Spring Physics)
     * OTIMIZAÇÃO: Pausa automaticamente assim que o movimento atinge estabilização!
     */
    function smoothRenderLoop(time) {
      if (!isDesktopScreen() || !isHeroInView || document.hidden) {
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

      // Condição de repouso: quando estabilizado, renderiza o quadro final e PAUSA o RAF
      if (absDiff < 0.00003 && Math.abs(velocity) < 0.0001) {
        smoothProgress = targetProgress;
        velocity = 0;

        const boundedProgress = Math.max(0, Math.min(1, smoothProgress));
        const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(boundedProgress * (TOTAL_FRAMES - 1)) + 1));

        if (targetFrame !== lastRenderedIndex) {
          drawDesktopFrame(targetFrame);
        }
        updateDesktopVisuals(boundedProgress);

        rafId = null;
        return; // Fim do loop, economiza 100% de CPU
      }

      const boundedProgress = Math.max(0, Math.min(1, smoothProgress));
      const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(boundedProgress * (TOTAL_FRAMES - 1)) + 1));

      if (targetFrame !== lastRenderedIndex) {
        drawDesktopFrame(targetFrame);
      }

      updateDesktopVisuals(boundedProgress);

      rafId = requestAnimationFrame(smoothRenderLoop);
    }

    function requestDesktopRender() {
      if (!rafId && isHeroInView && !document.hidden && isDesktopScreen()) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(smoothRenderLoop);
      }
    }

    function updateDesktopVisuals(p) {
      if (scrollIndicator) {
        if (p > 0.02) scrollIndicator.classList.add('hidden');
        else scrollIndicator.classList.remove('hidden');
      }

      // FASE 1: Introdução Principal (0% a 25%)
      if (p < 0.25) {
        activateLayer(phase1);
        setCanvasOpacity(0.85);
      }
      // FASE 2: Respiro Poético & Acolhimento (25% a 72%)
      else if (p >= 0.25 && p < 0.72) {
        activateLayer(phase2);
        setCanvasOpacity(1.0);
      }
      // FASE 3: Encerramento Narrativo & CTA Discreto (72% a 100%)
      else if (p >= 0.72) {
        activateLayer(ctaStage);
        setCanvasOpacity(0.50);
      }
    }

    function setupDesktopMode() {
      const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isReducedMotion) {
        if (canvas) canvas.style.display = 'block';
        if (video) {
          video.style.display = 'none';
          if (!video.paused) video.pause();
        }
        fitCanvasDimensions();
        preloadDesktopFrames();
        drawDesktopFrame(1);
        activateLayer(phase1);
        if (loadingState) loadingState.classList.add('loaded');
        return;
      }

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
          requestDesktopRender();
        }
      });

      updateDesktopVisuals(0);
      requestDesktopRender();

      isDesktopInitialized = true;
      ScrollTrigger.refresh();
    }

    /* =========================================================================
       3. MOTOR MOBILE: VÍDEO LOOP CONTÍNUO + FALLBACK IMEDIATO + HERO LEVE
       ========================================================================= */
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

        video.addEventListener('error', () => {
          // Em caso de falha no vídeo, poster atua como fallback e remove o spinner
          removeSpinner();
        }, { once: true });

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(removeSpinner).catch(() => {
            // Autoplay bloqueado pelo navegador/modo economia de bateria
            removeSpinner();
            const unlockPlayback = () => {
              if (video && isHeroInView && !document.hidden) {
                video.play().catch(() => {});
              }
              ['touchstart', 'click', 'scroll'].forEach((evt) => {
                window.removeEventListener(evt, unlockPlayback);
              });
            };
            ['touchstart', 'click', 'scroll'].forEach((evt) => {
              window.addEventListener(evt, unlockPlayback, { once: true, passive: true });
            });
          });
        }

        video.addEventListener('playing', removeSpinner, { once: true });
        setTimeout(removeSpinner, 500);
      }

      activateLayer(phase1);
    }

    /* =========================================================================
       4. INTERSECTION OBSERVER DO HERO & VISIBILIDADE DE ABA
       ========================================================================= */
    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isHeroInView = entry.isIntersecting;
          if (isHeroInView) {
            if (!isDesktopScreen()) {
              if (video && video.paused && !document.hidden) {
                video.play().catch(() => {});
              }
            } else {
              requestDesktopRender();
            }
          } else {
            // Saiu da viewport: pausa vídeo e loop imediatamente
            if (video && !video.paused) {
              video.pause();
            }
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        });
      }, { threshold: [0.0, 0.05, 0.2] });

      heroObserver.observe(section);
    }

    // Monitoramento da visibilidade da aba (document.hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        if (video && !video.paused) {
          video.pause();
        }
      } else {
        if (isHeroInView) {
          if (isDesktopScreen()) {
            requestDesktopRender();
          } else if (video && video.paused) {
            video.play().catch(() => {});
          }
        }
      }
    }, { passive: true });

    /* =========================================================================
       5. INICIALIZAÇÃO RESPONSIVA E RESIZE DEBOUNCED
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
    let prevWidth = window.innerWidth;
    let prevIsDesktop = isDesktopScreen();

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentWidth = window.innerWidth;
        const currentIsDesktop = isDesktopScreen();

        // Evita re-execuções desnecessárias causadas pela barra de navegação retrátil no mobile
        if (currentIsDesktop !== prevIsDesktop || Math.abs(currentWidth - prevWidth) > 20) {
          prevWidth = currentWidth;
          prevIsDesktop = currentIsDesktop;
          checkAndSwitch();
        } else if (currentIsDesktop && isDesktopInitialized) {
          fitCanvasDimensions();
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }
      }, 150);
    }, { passive: true });

    // Observador reativo a prefers-reduced-motion
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleMotion = () => {
        checkAndSwitch();
      };
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotion);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
