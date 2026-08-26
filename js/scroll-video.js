/**
 * PORTAL DA PSICOLOGIA - CINEMATIC HIGH-PERFORMANCE VIDEO SCROLL ENGINE
 * Arquitetura de Interpolação Exponencial Independente de FPS + Fila de Decodificação Hardware
 * Fluidez de 60/120Hz com zero travamento do decodificador de vídeo.
 */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('[Portal da Psicologia] GSAP ou ScrollTrigger não carregados.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const section = document.getElementById('hero-scroll-section');
  const video = document.getElementById('hero-video');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const phase1 = document.getElementById('phase-1-text');
  const phase2 = document.getElementById('phase-2-text');
  const moment1 = document.getElementById('moment-1');
  const moment2 = document.getElementById('moment-2');
  const moment3 = document.getElementById('moment-3');
  const moment4 = document.getElementById('moment-4');
  const ctaStage = document.getElementById('hero-cta-stage');

  if (!section || !video) return;

  // Configuração inicial do elemento de mídia para performance máxima
  video.pause();
  video.currentTime = 0;
  video.muted = true;
  video.playsInline = true;

  let isInitialized = false;
  let targetProgress = 0;
  let smoothProgress = 0;
  let velocity = 0; // Velocidade inercial contínua (momentum líquido)
  
  // Pipeline de decodificação de hardware não bloqueante
  let isDecoderSeeking = false;
  let pendingTargetTime = null;
  let lastSeekTimestamp = 0;
  
  let rafId = null;
  let lastTime = performance.now();
  let lastVisualsProgress = -1;
  let lastVideoState = -1;
  let lastActiveLayer = null;

  // Epsilon para seeks insignificantes (evita sobrecarga no demuxer)
  const MIN_SEEK_DELTA = 0.002;

  /**
   * Envia o comando de seek para a GPU/decodificador sem sobrecarregar a fila
   */
  function dispatchVideoSeek(targetTime) {
    if (!video || isNaN(video.duration)) return;

    // Se o decodificador já estiver processando um frame, armazena como pendente
    if (isDecoderSeeking || video.seeking) {
      pendingTargetTime = targetTime;
      return;
    }

    const current = video.currentTime;
    const delta = Math.abs(current - targetTime);

    if (delta > MIN_SEEK_DELTA) {
      isDecoderSeeking = true;
      lastSeekTimestamp = performance.now();
      
      // Se houver suporte a fastSeek para saltos muito grandes, utiliza-o; caso contrário, busca de alta precisão
      if (typeof video.fastSeek === 'function' && delta > 0.5) {
        video.fastSeek(targetTime);
      } else {
        video.currentTime = targetTime;
      }
    }
  }

  // Notificação do navegador assim que o frame foi decodificado e renderizado
  video.addEventListener('seeked', () => {
    isDecoderSeeking = false;
    if (pendingTargetTime !== null) {
      const nextTime = pendingTargetTime;
      pendingTargetTime = null;
      if (Math.abs(video.currentTime - nextTime) > MIN_SEEK_DELTA) {
        dispatchVideoSeek(nextTime);
      }
    }
  }, { passive: true });

  /**
   * Loop Principal de Renderização Hidrodinâmica (Liquid Physics Engine)
   * Simula a mecânica de fluidos: Força de Tensão Superficial + Arrasto Viscoso Crítico
   * Proporciona sensação aveludada e orgânica de "água em movimento".
   */
  function smoothRenderLoop(time) {
    if (!video || !video.duration) {
      rafId = requestAnimationFrame(smoothRenderLoop);
      return;
    }

    // 1. Delta Time preciso (em segundos) com teto seguro de 50ms
    const deltaMs = Math.min(time - lastTime, 50);
    const dt = deltaMs / 1000;
    lastTime = time;

    // 2. Modelo Físico de Fluido (Viscous Liquid Inertia)
    // - Tensão elástica suave (atrai para o ponto de rolagem)
    // - Coeficiente de viscosidade líquida (dissipa energia sem paradas bruscas)
    const displacement = targetProgress - smoothProgress;
    const absDisplacement = Math.abs(displacement);

    // Parâmetros de viscosidade hidrodinâmica calibrados para maciez extrema
    const liquidTension = 32.0;    // Força de atração fluida
    const liquidViscosity = 11.2;  // Arrasto viscoso amortecido

    // Equação diferencial de 2ª ordem: m*x'' + c*x' + k*x = 0
    const springForce = displacement * liquidTension;
    const dampingForce = -velocity * liquidViscosity;
    const acceleration = springForce + dampingForce;

    velocity += acceleration * dt;
    smoothProgress += velocity * dt;

    // Estabilização de repouso em equilíbrio estático
    if (absDisplacement < 0.00002 && Math.abs(velocity) < 0.0001) {
      smoothProgress = targetProgress;
      velocity = 0;
    }

    // 3. Watchdog de Decodificação de Hardware
    // Caso o evento `seeked` atrase por mais de 50ms, libera a fila
    if (isDecoderSeeking && (time - lastSeekTimestamp > 50)) {
      isDecoderSeeking = false;
      if (pendingTargetTime !== null) {
        const nextTime = pendingTargetTime;
        pendingTargetTime = null;
        dispatchVideoSeek(nextTime);
      }
    }

    // 4. Cálculo do Tempo do Vídeo e Envio ao Decodificador
    const duration = video.duration;
    const boundedProgress = Math.max(0, Math.min(1, smoothProgress));
    const targetTime = Math.max(0, Math.min(duration - 0.005, boundedProgress * duration));
    
    dispatchVideoSeek(targetTime);

    // 5. Atualização Otimizada dos Estados Visuais
    if (Math.abs(smoothProgress - lastVisualsProgress) > 0.0006) {
      lastVisualsProgress = smoothProgress;
      updateVisuals(smoothProgress);
    }

    rafId = requestAnimationFrame(smoothRenderLoop);
  }

  /**
   * Atualização das Camadas de Texto e Opacidade com Transições Suaves
   */
  function updateVisuals(p) {
    // Oculta o indicador de rolagem após os primeiros momentos
    if (scrollIndicator) {
      if (p > 0.015) scrollIndicator.classList.add('hidden');
      else scrollIndicator.classList.remove('hidden');
    }

    // FASE 1: Introdução (0% a 20%)
    if (p < 0.20) {
      setActiveLayer(phase1);
      if (lastVideoState !== 1) {
        video.style.opacity = '0.35';
        lastVideoState = 1;
      }
      hideMoments();
    }
    // FASE 2: Posicionamento e Reflexão (20% a 36%)
    else if (p >= 0.20 && p < 0.36) {
      setActiveLayer(phase2);
      if (lastVideoState !== 2) {
        video.style.opacity = '0.75';
        lastVideoState = 2;
      }
      hideMoments();
    }
    // FASE 3 & 4: Protagonismo Total do Vídeo & Momentos (36% a 86%)
    else if (p >= 0.36 && p < 0.86) {
      setActiveLayer(null);
      if (lastVideoState !== 3) {
        video.style.opacity = '1';
        lastVideoState = 3;
      }
      toggleMoment(moment1, p >= 0.38 && p < 0.50);
      toggleMoment(moment2, p >= 0.50 && p < 0.62);
      toggleMoment(moment3, p >= 0.62 && p < 0.74);
      toggleMoment(moment4, p >= 0.74 && p < 0.85);
    }
    // FASE 5: Conclusão & Chamada para Ação (86% a 100%)
    else if (p >= 0.86) {
      setActiveLayer(ctaStage);
      hideMoments();
      if (lastVideoState !== 4) {
        video.style.opacity = '0.25';
        lastVideoState = 4;
      }
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

  // Verifica se estamos em tela desktop
  function isDesktopScreen() {
    return window.innerWidth >= 768;
  }

  /**
   * Inicialização Integrada com o ScrollTrigger (Exclusivo Desktop >= 768px)
   */
  function initUnifiedHeroScroll() {
    if (!isDesktopScreen()) {
      // No mobile (< 768px), o scroll-video.js não interfere: o mobile-experience.js assume o controle
      return;
    }

    if (isInitialized) return;
    
    const duration = video.duration;
    if (!duration || isNaN(duration) || duration <= 0) return;
    
    isInitialized = true;
    const loadingState = document.getElementById('video-loading');
    if (loadingState) loadingState.classList.add('loaded');
    
    video.pause();
    video.currentTime = 0;

    // Distância de rolagem cinematográfica no desktop
    const scrollDistance = "+=3800";

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
      }
    });

    if (!rafId) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(smoothRenderLoop);
    }
    
    ScrollTrigger.refresh();
  }

  // Eventos para garantir que o vídeo esteja pronto antes de ativar o pinning no desktop
  if (isDesktopScreen()) {
    if (video.readyState >= 1 && video.duration > 0) {
      initUnifiedHeroScroll();
    } else {
      video.addEventListener('loadedmetadata', initUnifiedHeroScroll, { once: true });
      video.addEventListener('loadeddata', initUnifiedHeroScroll, { once: true });
      video.addEventListener('canplay', initUnifiedHeroScroll, { once: true });
      
      try { video.load(); } catch (e) {}
      
      setTimeout(() => {
        if (!isInitialized && video.duration > 0 && isDesktopScreen()) initUnifiedHeroScroll();
      }, 250);
    }
  }

  let resizeDebounce = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      if (isDesktopScreen()) {
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
    }, 150);
  }, { passive: true });

})();
