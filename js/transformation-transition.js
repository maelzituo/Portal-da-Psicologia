/**
 * ============================================================================
 * PORTAL DA PSICOLOGIA — COMPONENTE: "A MATÉRIA SE TRANSFORMA"
 * Módulo de transição artística contemplativa entre o Hero e a Seção Clínica (#sobre).
 * 
 * Arquitetura isolada, configurável, sem interferência de scroll ou dependências externas.
 * Estados: idle → animating → concluded (ou reduced-motion).
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO CENTRALIZADA E ESCALÁVEL DO COMPONENTE
  // --------------------------------------------------------------------------
  const TransformationTransitionConfig = {
    totalDurationMs: 3400,
    thresholds: {
      enter: 0.25,  // Inicia quando 25% da seção está visível
      exit: 0.05    // Considera saída completa quando menos de 5% está visível
    },
    mouseInteraction: {
      enabled: true,
      maxOffsetViewport: 7, // Deslocamento máximo em pixels para a matéria
      maxOffsetHalo: 12,    // Deslocamento máximo em pixels para o halo de luz
      lerpFactor: 0.08      // Coeficiente de suavização para reação aveludada
    }
  };

  class TransformationTransition {
    constructor() {
      this.section = document.getElementById('transicao-transformacao');
      if (!this.section) return;

      this.viewport = document.getElementById('trans-materia-viewport');
      this.halo = document.getElementById('trans-materia-halo');

      this.isRunning = false;
      this.hasPlayed = false;
      this.completionTimer = null;
      this.observer = null;

      // Mouse Parallax suave
      this.isMouseSupported = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      this.targetX = 0;
      this.targetY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.rafId = null;

      this.init();
    }

    init() {
      this.section.classList.add('js-enabled');

      // 1. Verificação de Acessibilidade (prefers-reduced-motion)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        this.section.setAttribute('data-state', 'reduced-motion');
        return; // Mantém composição estática pura e equilibrada
      }

      this.section.setAttribute('data-state', 'idle');

      // 2. Observer de Visibilidade
      this.setupObserver();

      // 3. Interação Sutil com Mouse (Desktop Opcional)
      if (this.isMouseSupported && TransformationTransitionConfig.mouseInteraction.enabled) {
        this.setupMousePresence();
      }
    }

    setupObserver() {
      if (!('IntersectionObserver' in window)) {
        // Fallback direto
        this.start();
        return;
      }

      const options = {
        threshold: [0.0, TransformationTransitionConfig.thresholds.exit, TransformationTransitionConfig.thresholds.enter, 0.5]
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= TransformationTransitionConfig.thresholds.enter) {
            this.start();
          } else if (!entry.isIntersecting || entry.intersectionRatio <= TransformationTransitionConfig.thresholds.exit) {
            this.handleExit();
          }
        });
      }, options);

      this.observer.observe(this.section);
    }

    start() {
      if (this.isRunning || this.hasPlayed) return;

      this.isRunning = true;
      this.hasPlayed = true;
      this.section.setAttribute('data-state', 'animating');

      if (this.completionTimer) {
        clearTimeout(this.completionTimer);
      }

      this.completionTimer = setTimeout(() => {
        this.section.setAttribute('data-state', 'concluded');
        this.isRunning = false;
      }, TransformationTransitionConfig.totalDurationMs);
    }

    handleExit() {
      // Quando o usuário navega para longe (sai da seção por completo)
      // resetamos suavemente o ciclo caso deseje rever ao retornar
      if (!this.isRunning && this.hasPlayed) {
        this.hasPlayed = false;
        this.section.setAttribute('data-state', 'idle');
      }
    }

    setupMousePresence() {
      const onMouseMove = (e) => {
        if (!this.section) return;
        const rect = this.section.getBoundingClientRect();
        
        // Ativo apenas quando a seção estiver visível na janela
        if (rect.top >= window.innerHeight || rect.bottom <= 0) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        // Limita a variação entre -1 e 1
        this.targetX = Math.max(-1, Math.min(1, deltaX));
        this.targetY = Math.max(-1, Math.min(1, deltaY));

        if (!this.rafId) {
          this.rafId = requestAnimationFrame(this.animateMousePresence.bind(this));
        }
      };

      const onMouseLeave = () => {
        this.targetX = 0;
        this.targetY = 0;
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      this.section.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }

    animateMousePresence() {
      const { maxOffsetViewport, maxOffsetHalo, lerpFactor } = TransformationTransitionConfig.mouseInteraction;

      this.currentX += (this.targetX - this.currentX) * lerpFactor;
      this.currentY += (this.targetY - this.currentY) * lerpFactor;

      if (this.viewport) {
        const vx = (this.currentX * maxOffsetViewport).toFixed(2);
        const vy = (this.currentY * maxOffsetViewport).toFixed(2);
        this.viewport.style.transform = `translate3d(${vx}px, ${vy}px, 0)`;
      }

      if (this.halo) {
        const hx = (this.currentX * maxOffsetHalo).toFixed(2);
        const hy = (this.currentY * maxOffsetHalo).toFixed(2);
        this.halo.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
      }

      // Continua interpolando se ainda houver diferença perceptível
      if (Math.abs(this.targetX - this.currentX) > 0.001 || Math.abs(this.targetY - this.currentY) > 0.001) {
        this.rafId = requestAnimationFrame(this.animateMousePresence.bind(this));
      } else {
        this.rafId = null;
      }
    }
  }

  // Inicialização no DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TransformationTransition());
  } else {
    new TransformationTransition();
  }
})();
