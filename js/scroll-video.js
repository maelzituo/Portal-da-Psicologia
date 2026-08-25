/**
 * PORTAL DA PSICOLOGIA - ULTRA-SMOOTH GSAP SCROLL ENGINE
 * Motor de Interpolação Contínua em 60/120 FPS
 * - Kinetic Inertia via GSAP ScrollTrigger
 * - Damped Exponential Lerp para video.currentTime
 * - Transições Visuais Aveludadas sem quebras de frame
 */

(function () {
  'use strict';

  // 1. Verificação do GSAP e ScrollTrigger
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('[Portal da Psicologia] GSAP ou ScrollTrigger não carregados no documento.');
    return;
  }

  // 2. Registro do Plugin
  gsap.registerPlugin(ScrollTrigger);

  // Elementos do DOM
  const section = document.getElementById('hero-scroll-section');
  const video = document.getElementById('hero-video');
  const loadingState = document.getElementById('video-loading');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const header = document.querySelector('.site-header');

  const phase1 = document.getElementById('phase-1-text');
  const phase2 = document.getElementById('phase-2-text');
  const moment1 = document.getElementById('moment-1');
  const moment2 = document.getElementById('moment-2');
  const moment3 = document.getElementById('moment-3');
  const moment4 = document.getElementById('moment-4');
  const ctaStage = document.getElementById('hero-cta-stage');

  if (!section || !video) return;

  // Estado inicial rigoroso do vídeo
  video.pause();
  video.currentTime = 0;
  video.muted = true;
  video.playsInline = true;

  let isInitialized = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let targetTime = 0;
  let smoothTime = 0;
  let isSeeking = false;
  let lastActiveLayer = null;
  let rafId = null;
  let lastVideoState = -1;
  let lastVisualsProgress = -1;

  // Render Loop contínuo a 60/120 FPS
  function smoothRenderLoop() {
    if (!video || !video.duration) {
      rafId = requestAnimationFrame(smoothRenderLoop);
      return;
    }

    const duration = video.duration;

    // 1. Interpolação suave do progresso (Lerp Damping)
    const progressDiff = targetProgress - currentProgress;
    if (Math.abs(progressDiff) > 0.0001) {
      currentProgress += progressDiff * 0.16;
    } else {
      currentProgress = targetProgress;
    }

    // Se o progresso da tela mal mudou, podemos evitar atualizar o DOM (somente seek do video ainda pode rodar)
    const isVisualProgressChanged = Math.abs(currentProgress - lastVisualsProgress) > 0.001;
    if (isVisualProgressChanged) {
       lastVisualsProgress = currentProgress;
    }

    // 2. Cálculo do tempo alvo do vídeo
    targetTime = Math.max(0, Math.min(duration - 0.04, currentProgress * duration));

    // 3. Interpolação suave do tempo do vídeo
    const timeDiff = targetTime - smoothTime;
    if (Math.abs(timeDiff) > 0.002) {
      smoothTime += timeDiff * 0.22;
    } else {
      smoothTime = targetTime;
    }

    // 4. Seek não-bloqueante no pipeline de mídia
    // Eco Mode: Aumenta o limite de busca (seek) no mobile para poupar o decodificador
    const seekThreshold = window.innerWidth <= 768 ? 0.08 : 0.015;
    if (!isSeeking && Math.abs(video.currentTime - smoothTime) > seekThreshold) {
      isSeeking = true;
      video.currentTime = smoothTime;
    }

    // 5. Atualização visual fluida das camadas
    if (isVisualProgressChanged) {
       updateVisuals(currentProgress);
    }

    rafId = requestAnimationFrame(smoothRenderLoop);
  }

  video.addEventListener('seeked', () => {
    isSeeking = false;
  });

  function updateVisuals(p) {
    // Indicador de Scroll
    if (scrollIndicator) {
      if (p > 0.02) {
        scrollIndicator.classList.add('hidden');
      } else {
        scrollIndicator.classList.remove('hidden');
      }
    }

    // A lógica de ocultação do header foi removida para uma transição suave

    // FASE 1: Introdução (0% a 20%)
    if (p < 0.20) {
      setActiveLayer(phase1);
      if (lastVideoState !== 1) {
        video.style.opacity = '0.35';
        video.style.transform = 'translate3d(0,0,0) scale(1.02)';
        lastVideoState = 1;
      }
      hideMoments();
    }
    // FASE 2: Posicionamento (20% a 36%)
    else if (p >= 0.20 && p < 0.36) {
      setActiveLayer(phase2);
      if (lastVideoState !== 2) {
        video.style.opacity = '0.75';
        video.style.transform = 'translate3d(0,0,0) scale(1.01)';
        lastVideoState = 2;
      }
      hideMoments();
    }
    // FASE 3 & 4: Protagonismo do Vídeo + Momentos Sutis (36% a 86%)
    else if (p >= 0.36 && p < 0.86) {
      setActiveLayer(null);
      if (lastVideoState !== 3) {
        video.style.opacity = '1';
        video.style.transform = 'translate3d(0,0,0) scale(1)';
        lastVideoState = 3;
      }

      toggleMoment(moment1, p >= 0.39 && p < 0.50);
      toggleMoment(moment2, p >= 0.51 && p < 0.62);
      toggleMoment(moment3, p >= 0.63 && p < 0.74);
      toggleMoment(moment4, p >= 0.75 && p < 0.85);
    }
    // FASE 5: Encerramento do Hero & CTA (86% a 100%)
    else if (p >= 0.86) {
      setActiveLayer(ctaStage);
      hideMoments();
      if (lastVideoState !== 4) {
        video.style.opacity = '0.25';
        video.style.transform = 'translate3d(0,0,0) scale(0.98)';
        lastVideoState = 4;
      }
    }
  }

  function setActiveLayer(active) {
    if (lastActiveLayer === active) return;
    lastActiveLayer = active;

    [phase1, phase2, ctaStage].forEach(layer => {
      if (!layer) return;
      if (layer === active) {
        layer.classList.add('active');
      } else {
        layer.classList.remove('active');
      }
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

  function initUnifiedHeroScroll() {
    if (isInitialized) return;

    const duration = video.duration;
    if (!duration || isNaN(duration) || duration <= 0) {
      return;
    }

    isInitialized = true;

    // Remove loading state
    if (loadingState) {
      loadingState.classList.add('loaded');
    }

    video.currentTime = 0;

    // Distância confortável de scroll para suavidade cinematográfica
    const scrollDistance = window.innerWidth <= 768 ? "+=3000" : "+=4200";

    // ScrollTrigger com Scrub Suavizado
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: scrollDistance,
      pin: true,
      pinSpacing: true,
      scrub: 1.0, // Kinetic inertia natural e fluida
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        targetProgress = self.progress;
      }
    });

    // Inicia o render loop a 60/120 FPS
    if (!rafId) {
      rafId = requestAnimationFrame(smoothRenderLoop);
    }

    ScrollTrigger.refresh();
  }

  // Inicialização Segura
  if (video.readyState >= 1 && video.duration > 0) {
    initUnifiedHeroScroll();
  } else {
    video.addEventListener('loadedmetadata', initUnifiedHeroScroll, { once: true });
    video.addEventListener('loadeddata', initUnifiedHeroScroll, { once: true });
    video.addEventListener('canplay', initUnifiedHeroScroll, { once: true });

    try {
      video.load();
    } catch (e) {}

    setTimeout(() => {
      if (!isInitialized && video.duration > 0) {
        initUnifiedHeroScroll();
      }
    }, 300);
  }

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
})();
