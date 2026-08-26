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
   * 1. GERENCIADOR DO VÍDEO MOBILE COM AUTO-PLAY ROBUSTO & ECO PERFORMANCE
   * - Inicia em autoplay contínuo, muted e playsinline.
   * - Desbloqueia reprodução caso haja bloqueio de economia de bateria.
   * - IntersectionObserver para pausar o vídeo fora da tela (preserva 100% de CPU/GPU nas outras seções).
   */
  function initMobileVideoExperience() {
    const video = document.getElementById('hero-video');
    const heroSection = document.getElementById('hero-scroll-section');
    const loadingState = document.getElementById('video-loading');

    if (!video) return;

    // Configurações vitais para reprodução móvel contínua e permitida pelos navegadores
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

    function removeLoadingSpinner() {
      if (loadingState && !loadingState.classList.contains('loaded')) {
        loadingState.classList.add('loaded');
      }
    }

    function attemptPlay() {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            removeLoadingSpinner();
          })
          .catch(() => {
            // Em caso de restrição do navegador (ex: modo de economia de energia),
            // desbloqueia na primeira interação touch ou scroll do usuário
            const unlockPlayback = () => {
              video.play().then(removeLoadingSpinner).catch(() => {});
              ['touchstart', 'touchend', 'click', 'scroll', 'pointerdown'].forEach(evt => {
                window.removeEventListener(evt, unlockPlayback);
              });
            };

            ['touchstart', 'touchend', 'click', 'scroll', 'pointerdown'].forEach(evt => {
              window.addEventListener(evt, unlockPlayback, { once: true, passive: true });
            });
          });
      }
    }

    // Tenta reprodução imediata
    attemptPlay();

    // Eventos de prontidão de mídia para garantir início instantâneo
    video.addEventListener('loadedmetadata', attemptPlay, { once: true });
    video.addEventListener('loadeddata', attemptPlay, { once: true });
    video.addEventListener('canplay', attemptPlay, { once: true });
    video.addEventListener('playing', removeLoadingSpinner, { once: true });

    // Fallback de segurança para remoção do spinner
    setTimeout(removeLoadingSpinner, 800);

    // ECO PERFORMANCE: Pausa o vídeo quando o Hero sair da tela para manter 60 FPS no scroll das outras seções
    if ('IntersectionObserver' in window && heroSection) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (video.paused) {
              video.play().catch(() => {});
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      }, { threshold: 0.05 });

      heroObserver.observe(heroSection);
    }
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
