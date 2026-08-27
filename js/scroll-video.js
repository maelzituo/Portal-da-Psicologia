/**
 * PORTAL DA PSICOLOGIA - CINEMATIC HIGH-PERFORMANCE CANVAS SCROLL ENGINE (DESKTOP)
 * Arquitetura Apple-Style Frame Sequence com Interpolação Viscosa e Renderização 2D/GPU
 * - 0% de latência de decodificador de vídeo (Zero-Jank em 60/120/240Hz)
 * - Cache progressivo assíncrono com pré-decodificação em background (Image.decode())
 * - Inércia fluida de amortecimento com transição aveludada entre capítulos e textos
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

  function initEngine() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setTimeout(initEngine, 50);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = document.getElementById('hero-scroll-section');
    const canvas = document.getElementById('hero-canvas');
    const video = document.getElementById('hero-video');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const phase1 = document.getElementById('phase-1-text');
    const phase2 = document.getElementById('phase-2-text');
    const moment1 = document.getElementById('moment-1');
    const moment2 = document.getElementById('moment-2');
    const moment3 = document.getElementById('moment-3');
    const moment4 = document.getElementById('moment-4');
    const ctaStage = document.getElementById('hero-cta-stage');
    const loadingState = document.getElementById('video-loading');

    if (!section || !canvas) return;

    // Repositório de imagens em memória e variáveis de estado (sempre inicializadas no topo do escopo)
    const images = new Array(TOTAL_FRAMES + 1);
    const loadedStatus = new Uint8Array(TOTAL_FRAMES + 1);
    let lastRenderedIndex = -1;
    let isInitialized = false;
    let ctx = null;

    let targetProgress = 0;
    let smoothProgress = 0;
    let velocity = 0;
    let rafId = null;
    let lastTime = performance.now();
    let lastActiveLayer = null;
    let lastOpacityValue = -1;

    function get2DContext() {
      if (!ctx && canvas) {
        ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      }
      return ctx;
    }

    /**
     * Ajuste de Resolução Interna do Canvas para Nitidez Retina (HiDPI)
     */
    function fitCanvasDimensions() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap em 2x para equilibrar nitidez e performance
      
      const width = Math.round(rect.width * dpr) || 1280;
      const height = Math.round(rect.height * dpr) || 720;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (lastRenderedIndex > 0) {
          drawFrame(lastRenderedIndex);
        }
      }
    }

    /**
     * Desenho do Frame com aspect ratio "cover" e ancoragem visual idêntica ao design original
     */
    function drawFrame(frameIndex) {
      const img = images[frameIndex];
      if (!img || !loadedStatus[frameIndex]) {
        // Se o frame exato ainda não decodificou, busca o mais próximo disponível
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

      // Cálculo de object-fit: cover com alinhamento vertical a 46%
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
     * Carregador Prioritário Inteligente (Chunked Asynchronous Preloader)
     */
    function preloadFrames() {
      // 1. Carrega imediatamente os primeiros 15 frames para visualização instantânea
      for (let i = 1; i <= Math.min(15, TOTAL_FRAMES); i++) {
        loadSingleFrame(i, i === 1);
      }

      // 2. Carrega frames intercalados essenciais para resposta imediata ao scroll
      setTimeout(() => {
        for (let i = 16; i <= TOTAL_FRAMES; i += 4) {
          loadSingleFrame(i);
        }

        // 3. Preenche todos os frames restantes em lotes não-bloqueantes
        setTimeout(() => {
          let currentFrame = 1;
          function loadBatch() {
            const batchLimit = Math.min(currentFrame + 12, TOTAL_FRAMES);
            for (; currentFrame <= batchLimit; currentFrame++) {
              if (!loadedStatus[currentFrame]) {
                loadSingleFrame(currentFrame);
              }
            }
            if (currentFrame <= TOTAL_FRAMES) {
              if (window.requestIdleCallback) {
                requestIdleCallback(loadBatch, { timeout: 200 });
              } else {
                setTimeout(loadBatch, 16);
              }
            }
          }
          loadBatch();
        }, 150);
      }, 50);
    }

    function loadSingleFrame(index, isFirstFrame = false) {
      if (images[index]) return;

      const img = new Image();
      img.src = `${FRAME_PREFIX}${formatFrameNumber(index)}${FRAME_EXT}`;
      images[index] = img;

      const onLoaded = () => {
        loadedStatus[index] = 1;
        if (isFirstFrame) {
          if (loadingState) loadingState.classList.add('loaded');
          fitCanvasDimensions();
          drawFrame(1);
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

    /**
     * Loop Principal de Interpolação Viscosa em 60/120Hz (Natural & Zero-Jank)
     */
    function smoothRenderLoop(time) {
      const deltaMs = Math.min(time - lastTime, 40);
      const dt = deltaMs / 1000;
      lastTime = time;

      // Amortecimento dinâmico de mola crítica (Critical Damped Spring Lerp)
      const diff = targetProgress - smoothProgress;
      const absDiff = Math.abs(diff);

      // Fatores calibrados para resposta ultra-orgânica sem atraso perceptível
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
      
      // Mapeamento preciso para o frame (1 a 240)
      const targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(boundedProgress * (TOTAL_FRAMES - 1)) + 1));
      
      if (targetFrame !== lastRenderedIndex) {
        drawFrame(targetFrame);
      }

      // Atualização dos estados de texto e opacidades
      updateVisuals(boundedProgress);

      rafId = requestAnimationFrame(smoothRenderLoop);
    }

    /**
     * Atualização das Camadas Narrativas e Opacidades do Canvas
     */
    function updateVisuals(p) {
      if (scrollIndicator) {
        if (p > 0.015) scrollIndicator.classList.add('hidden');
        else scrollIndicator.classList.remove('hidden');
      }

      // FASE 1: Introdução Poética (0% a 20%)
      if (p < 0.20) {
        setActiveLayer(phase1);
        setCanvasOpacity(0.35);
        hideMoments();
      }
      // FASE 2: Posicionamento e Acolhimento (20% a 36%)
      else if (p >= 0.20 && p < 0.36) {
        setActiveLayer(phase2);
        setCanvasOpacity(0.75);
        hideMoments();
      }
      // FASE 3 & 4: Destaque Imersivo do Vídeo & Momentos Clínicos (36% a 86%)
      else if (p >= 0.36 && p < 0.86) {
        setActiveLayer(null);
        setCanvasOpacity(1.0);
        toggleMoment(moment1, p >= 0.38 && p < 0.50);
        toggleMoment(moment2, p >= 0.50 && p < 0.62);
        toggleMoment(moment3, p >= 0.62 && p < 0.74);
        toggleMoment(moment4, p >= 0.74 && p < 0.85);
      }
      // FASE 5: Chamada para Ação Final (86% a 100%)
      else if (p >= 0.86) {
        setActiveLayer(ctaStage);
        hideMoments();
        setCanvasOpacity(0.25);
      }
    }

    function setCanvasOpacity(val) {
      if (lastOpacityValue !== val && canvas) {
        canvas.style.opacity = String(val);
        lastOpacityValue = val;
      }
    }

    function setActiveLayer(active) {
      if (lastActiveLayer === active) return;
      lastActiveLayer = active;
      [phase1, phase2, ctaStage].forEach(layer => {
        if (!layer) return;
        if (layer === active) layer.classList.add('active');
        else layer.classList.remove('active');
      });
    }

    function toggleMoment(el, show) {
      if (!el) return;
      if (show) {
        if (!el.classList.contains('active')) el.classList.add('active');
      } else {
        if (el.classList.contains('active')) el.classList.remove('active');
      }
    }

    function hideMoments() {
      [moment1, moment2, moment3, moment4].forEach(m => {
        if (m && m.classList.contains('active')) m.classList.remove('active');
      });
    }

    /**
     * Inicialização do ScrollTrigger Pinning no Desktop
     */
    function initUnifiedHeroScroll() {
      if (!isDesktopScreen()) return;
      if (isInitialized) return;
      
      isInitialized = true;
      preloadFrames();
      fitCanvasDimensions();

      // Distância de rolagem equilibrada para ritmo de leitura suave
      const scrollDistance = "+=3600";

      // Limpa qualquer instância prévia
      const existingTrigger = ScrollTrigger.getById("desktop-hero-scroll");
      if (existingTrigger) existingTrigger.kill(true);

      ScrollTrigger.create({
        id: "desktop-hero-scroll",
        trigger: section,
        start: "top top",
        end: scrollDistance,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetProgress = self.progress;
          if (self.progress < 0.98) {
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

      updateVisuals(0);

      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(smoothRenderLoop);
      }
      
      ScrollTrigger.refresh();
    }

    function onWindowResize() {
      if (isDesktopScreen()) {
        fitCanvasDimensions();
        if (!isInitialized) {
          initUnifiedHeroScroll();
        } else {
          ScrollTrigger.refresh();
        }
      } else {
        const trigger = ScrollTrigger.getById("desktop-hero-scroll");
        if (trigger) {
          trigger.kill(true);
          isInitialized = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      }
    }

    let resizeDebounce = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(onWindowResize, 100);
    }, { passive: true });

    // Inicia imediatamente no desktop
    initUnifiedHeroScroll();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (isDesktopScreen() && isInitialized) ScrollTrigger.refresh();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
})();
