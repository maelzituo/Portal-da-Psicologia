/**
 * PORTAL DA PSICOLOGIA - EXPERIÊNCIA MOBILE NARRATIVA & CONTÍNUA
 * Módulo independente para telas touch (< 768px).
 * Gerencia o vídeo em loop suave sem scrub de scroll e orquestra o
 * storytelling por capítulos via IntersectionObserver com 60 FPS estáveis.
 */

(function () {
  'use strict';

  // Verifica se o dispositivo está na largura mobile
  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  /**
   * 1. GERENCIADOR DO VÍDEO MOBILE
   * Inicia o vídeo em autoplay suave, loop contínuo, muted e playsinline.
   * Não pausa, não reseta e não depende do scroll.
   */
  function initMobileVideoExperience() {
    const video = document.getElementById('hero-video');
    const loadingState = document.getElementById('video-loading');

    if (!video) return;

    // Configurações vitais para reprodução móvel contínua e permitida pelos navegadores
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.loop = true;
    video.autoplay = true;

    function playVideoSmoothly() {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Em caso de restrição severa de autoplay com economia de energia, 
            // tenta reproduzir no primeiro toque do usuário
            const handleFirstTouch = () => {
              video.play().catch(() => {});
              document.removeEventListener('touchstart', handleFirstTouch);
            };
            document.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true });
          });
        }
      }
      if (loadingState) {
        loadingState.classList.add('loaded');
      }
    }

    if (video.readyState >= 2) {
      playVideoSmoothly();
    } else {
      video.addEventListener('canplay', playVideoSmoothly, { once: true });
      video.addEventListener('loadeddata', playVideoSmoothly, { once: true });
    }

    // Tratamento de erro com fallback elegante
    video.addEventListener('error', () => {
      if (loadingState) loadingState.classList.add('loaded');
      const container = document.getElementById('hero-video-container');
      if (container) {
        container.style.backgroundColor = 'var(--color-background-secondary)';
      }
    }, { once: true });

    // Garante remoção do spinner após timeout de segurança
    setTimeout(() => {
      if (loadingState && !loadingState.classList.contains('loaded')) {
        loadingState.classList.add('loaded');
      }
    }, 1200);
  }

  /**
   * 2. SISTEMA DE STORYTELLING POR CAPÍTULOS
   * Animação elegante de entrada conforme o usuário rola pela história da clínica.
   */
  function initMobileChapters() {
    // Lista de seções que compõem a narrativa da clínica
    const chapterSelectors = [
      '#sobre',
      '#especialidades',
      '#diferenciais',
      '#equipe',
      '#contato'
    ];

    const chapters = document.querySelectorAll(chapterSelectors.join(', '));
    if (!chapters.length) return;

    // Configuração do IntersectionObserver: ativa quando ~25-35% da seção entra na tela
    const chapterObserverOptions = {
      root: null,
      threshold: 0.25,
      rootMargin: '0px 0px -40px 0px'
    };

    const chapterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('chapter-revealed');
          
          // Libera a memória da GPU após a conclusão da animação (700ms)
          setTimeout(() => {
            entry.target.style.willChange = 'auto';
          }, 700);

          observer.unobserve(entry.target);
        }
      });
    }, chapterObserverOptions);

    chapters.forEach(chapter => {
      chapter.classList.add('mobile-chapter-section');
      chapterObserver.observe(chapter);
    });
  }

  /**
   * 3. INICIALIZAÇÃO CONTROLADA
   */
  function setupMobileExperience() {
    if (!isMobileViewport()) return;

    initMobileVideoExperience();
    initMobileChapters();
  }

  // Inicializa assim que o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileExperience);
  } else {
    setupMobileExperience();
  }

  // Monitora redimensionamento de janela (Mobile <-> Desktop)
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (isMobileViewport()) {
        initMobileVideoExperience();
      }
    }, 200);
  }, { passive: true });

})();
