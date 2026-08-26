/**
 * PORTAL DA PSICOLOGIA - ULTRA-SMOOTH GSAP SCROLL ENGINE
 * Motor de Interpolação Contínua (Cinematic Rendering)
 * Arquitetura reconstruída para fluidez máxima, sem depender do `seeked`.
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

  // Forçar estado de reprodução
  video.pause();
  video.currentTime = 0;
  video.muted = true;
  video.playsInline = true;

  let isInitialized = false;
  let targetProgress = 0;
  let smoothProgress = 0;
  
  let rafId = null;
  let lastTime = performance.now();
  let lastVisualsProgress = -1;
  let lastVideoState = -1;
  let lastActiveLayer = null;

  // O threshold diz o quão pequena a diferença de tempo precisa ser para ignorar o seek
  // Threshold reduzido para alta precisão, mas com margem para evitar processamento inútil
  const seekThreshold = 0.005; 

  function smoothRenderLoop(time) {
    if (!video || !video.duration) {
      rafId = requestAnimationFrame(smoothRenderLoop);
      return;
    }

    // 1. Delta Time (Independência de Frame Rate: 60hz, 120hz, 144hz)
    // Limitado a 50ms para evitar pulos gigantes se o usuário trocar de aba
    const dt = Math.min(time - lastTime, 50); 
    lastTime = time;

    // 2. Interpolação Adaptativa (Lerp Damping)
    const progressDiff = targetProgress - smoothProgress;
    const absDiff = Math.abs(progressDiff);
    
    // Fator de suavização varia com a velocidade: 
    // Movimentos grandes/rápidos convergem mais rápido (evita atraso "borrachudo")
    // Movimentos pequenos/lentos têm mais amortecimento (evita micro-stutter)
    let lerpFactor;
    if (absDiff > 0.05) {
      lerpFactor = 0.08 * (dt / 16.666);
    } else {
      lerpFactor = 0.04 * (dt / 16.666);
    }
    
    // Atualização com proteção contra overshoot/infinitesimal
    if (absDiff > 0.0001) {
      smoothProgress += progressDiff * lerpFactor;
    } else {
      smoothProgress = targetProgress;
    }

    // 3. Atualização do Vídeo (Sem lock de isSeeking)
    // Calculamos o tempo exato com base no smoothProgress
    const duration = video.duration;
    const targetTime = Math.max(0, Math.min(duration - 0.01, smoothProgress * duration));
    
    // Somente envia o comando se a diferença for maior que o threshold
    // Ao removermos o evento `seeked`, deixamos o pipeline nativo do navegador 
    // gerenciar os frames descartados silenciosamente, garantindo a atualização visual sem travar o JS.
    const timeError = Math.abs(targetTime - video.currentTime);
    if (timeError > seekThreshold) {
      video.currentTime = targetTime;
    }

    // 4. Atualização das Camadas Visuais (Apenas quando necessário)
    const isVisualProgressChanged = Math.abs(smoothProgress - lastVisualsProgress) > 0.001;
    if (isVisualProgressChanged) {
       lastVisualsProgress = smoothProgress;
       updateVisuals(smoothProgress);
    }

    rafId = requestAnimationFrame(smoothRenderLoop);
  }

  function updateVisuals(p) {
    // Oculta o indicador de scroll ao descer
    if (scrollIndicator) {
      if (p > 0.02) scrollIndicator.classList.add('hidden');
      else scrollIndicator.classList.remove('hidden');
    }

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
    // FASE 3 & 4: Protagonismo e Momentos (36% a 86%)
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

  function initUnifiedHeroScroll() {
    if (isInitialized) return;
    
    const duration = video.duration;
    if (!duration || isNaN(duration) || duration <= 0) return;
    
    isInitialized = true;
    const loadingState = document.getElementById('video-loading');
    if (loadingState) loadingState.classList.add('loaded');
    
    video.currentTime = 0;

    // Distância de scroll estendida para garantir tempo físico pro vídeo reproduzir
    const scrollDistance = window.innerWidth <= 768 ? "+=3000" : "+=4200";

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: scrollDistance,
      pin: true,
      pinSpacing: true,
      // Usamos scrub: true (sem delay em segundos) para capturar o raw progress do usuário,
      // delegando TODA a suavização matemática para o nosso requestAnimationFrame (dt).
      scrub: true, 
      anticipatePin: 1,
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

  // Bind Seguro de Inicialização
  if (video.readyState >= 1 && video.duration > 0) {
    initUnifiedHeroScroll();
  } else {
    video.addEventListener('loadedmetadata', initUnifiedHeroScroll, { once: true });
    video.addEventListener('loadeddata', initUnifiedHeroScroll, { once: true });
    video.addEventListener('canplay', initUnifiedHeroScroll, { once: true });
    
    try { video.load(); } catch (e) {}
    
    setTimeout(() => {
      if (!isInitialized && video.duration > 0) initUnifiedHeroScroll();
    }, 300);
  }

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  }, { passive: true });

})();
