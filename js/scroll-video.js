/**
 * PORTAL DA PSICOLOGIA - UNIFIED GSAP SCROLLTRIGGER VIDEO ENGINE
 * Um único progresso de scroll controla:
 * 1. Entrada e saída dos textos
 * 2. Opacidade e transformações visuais
 * 3. Mapeamento direto de video.currentTime (Avanço e Retrocesso)
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
  let isSeeking = false;
  let targetTime = 0;

  // Fila de seek otimizada para resposta imediata sem engasgos
  function applyVideoSeek() {
    if (!video || !video.duration || isNaN(video.duration)) return;

    if (!isSeeking && Math.abs(video.currentTime - targetTime) > 0.015) {
      isSeeking = true;
      if (typeof video.fastSeek === 'function') {
        try {
          video.fastSeek(targetTime);
        } catch (e) {
          video.currentTime = targetTime;
        }
      } else {
        video.currentTime = targetTime;
      }
    }
  }

  video.addEventListener('seeked', () => {
    isSeeking = false;
    // Se o targetTime mudou enquanto o seek anterior concluía, atualiza imediatamente
    if (Math.abs(video.currentTime - targetTime) > 0.015) {
      applyVideoSeek();
    }
  });

  function initUnifiedHeroScroll() {
    if (isInitialized) return;

    const duration = video.duration;
    if (!duration || isNaN(duration) || duration <= 0) {
      return;
    }

    isInitialized = true;
    console.log(`[Portal da Psicologia] Motor Unificado Iniciado! Duração do vídeo: ${duration.toFixed(2)}s`);

    // Remove spinner de loading
    if (loadingState) {
      loadingState.classList.add('loaded');
    }

    // Inicializa o primeiro frame
    video.currentTime = 0;

    // Distância de scroll calibrada para controle preciso do vídeo
    const scrollDistance = window.innerWidth <= 768 ? "+=2800" : "+=3800";

    // 3. ScrollTrigger Unificado (Pin + Scrub)
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: scrollDistance,
      pin: true,
      pinSpacing: true,
      scrub: 0.3, // Resposta instantânea e aveludada ao scroll
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = self.progress; // 0.000 a 1.000

        // 1. Controle DIRETO do Vídeo: progress -> video.currentTime
        targetTime = Math.max(0, Math.min(duration - 0.03, progress * duration));
        applyVideoSeek();

        // 2. Controle Sincronizado das Fases da Narrativa
        updateHeroVisuals(progress);
      }
    });

    function updateHeroVisuals(p) {
      // Indicador de Scroll
      if (scrollIndicator) {
        if (p > 0.03) {
          scrollIndicator.classList.add('hidden');
        } else {
          scrollIndicator.classList.remove('hidden');
        }
      }

      // Atenuação do Header durante o clímax do vídeo
      if (header) {
        if (p > 0.12 && p < 0.86) {
          header.classList.add('hero-dimmed');
        } else {
          header.classList.remove('hero-dimmed');
        }
      }

      // FASE 1: Introdução (0% a 18%)
      if (p < 0.18) {
        setLayer(phase1);
        video.style.opacity = '0.25';
        video.style.transform = 'scale(1.02)';
        video.style.filter = 'blur(2px)';
        hideMoments();
      }
      // FASE 2: Transição / Posicionamento (18% a 34%)
      else if (p >= 0.18 && p < 0.34) {
        setLayer(phase2);
        video.style.opacity = '0.65';
        video.style.transform = 'scale(1.01)';
        video.style.filter = 'blur(1px)';
        hideMoments();
      }
      // FASE 3 & 4: Protagonismo Total do Vídeo + Momentos Sutis (34% a 86%)
      else if (p >= 0.34 && p < 0.86) {
        setLayer(null);
        video.style.opacity = '1';
        video.style.transform = 'scale(1)';
        video.style.filter = 'none';

        toggleMoment(moment1, p >= 0.38 && p < 0.49);
        toggleMoment(moment2, p >= 0.50 && p < 0.61);
        toggleMoment(moment3, p >= 0.62 && p < 0.73);
        toggleMoment(moment4, p >= 0.74 && p < 0.85);
      }
      // FASE 5: Último Frame & CTA Final (86% a 100%)
      else if (p >= 0.86) {
        setLayer(ctaStage);
        hideMoments();
        video.style.opacity = '0.35';
        video.style.transform = 'scale(0.98)';
        video.style.filter = 'blur(4px) brightness(0.7)';
      }
    }

    function setLayer(active) {
      [phase1, phase2, ctaStage].forEach(l => {
        if (l) {
          if (l === active) l.classList.add('active');
          else l.classList.remove('active');
        }
      });
    }

    function toggleMoment(el, show) {
      if (!el) return;
      if (show) el.classList.add('active');
      else el.classList.remove('active');
    }

    function hideMoments() {
      [moment1, moment2, moment3, moment4].forEach(m => m && m.classList.remove('active'));
    }

    ScrollTrigger.refresh();
  }

  // Lifecycle Seguro para Metadados do Vídeo
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
    }, 400);
  }

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
})();
