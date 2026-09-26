/**
 * Portal da Psicologia — Transição Cinematográfica: "A Matéria se Transforma"
 * Ativação por IntersectionObserver (25-35% de visibilidade).
 * Sem controle por scroll, sem bloqueio de rolagem, sem dependências externas.
 */

(function initTransformationTransition() {
  'use strict';

  function setup() {
    const section = document.getElementById('transicao-transformacao');
    if (!section) return;

    // Sinaliza suporte a JavaScript para gerenciar os estados
    section.classList.add('js-enabled');

    let isRunning = false;
    let hasPlayedThisVisit = false;
    let completionTimer = null;

    const ANIMATION_DURATION_MS = 2800;

    // Respeito ao prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Mantém a composição estática e equilibrada
    }

    function startTransformation() {
      if (isRunning || hasPlayedThisVisit) return;
      isRunning = true;
      hasPlayedThisVisit = true;

      section.classList.remove('is-finished');
      section.classList.add('is-animating');

      if (completionTimer) clearTimeout(completionTimer);

      completionTimer = setTimeout(() => {
        section.classList.remove('is-animating');
        section.classList.add('is-finished');
        isRunning = false;
      }, ANIMATION_DURATION_MS);
    }

    function resetIfExited() {
      // Quando o usuário sai completamente da seção e navega para longe,
      // preparamos para que uma nova visita seja igualmente elegante.
      if (!isRunning && hasPlayedThisVisit) {
        hasPlayedThisVisit = false;
        section.classList.remove('is-finished');
      }
    }

    // IntersectionObserver configurado entre 25% e 35% de visibilidade
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            startTransformation();
          } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.05) {
            resetIfExited();
          }
        });
      }, {
        threshold: [0.0, 0.25, 0.35, 0.5]
      });

      observer.observe(section);
    } else {
      // Fallback para navegadores legados: inicia ao scroll
      startTransformation();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
