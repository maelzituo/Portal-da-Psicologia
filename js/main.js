/**
 * PORTAL DA PSICOLOGIA - INTERAÇÕES GLOBAIS & EXPERIÊNCIA DO USUÁRIO
 * Otimizado para Core Web Vitals, INP, LCP e 60-120 FPS em CPUs móveis de baixo custo
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Cache de Elementos do DOM ---
  const header = document.querySelector('.site-header');
  const sobreSection = document.getElementById('sobre');
  const heroSection = document.getElementById('hero-scroll-section');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileClose = document.getElementById('mobile-drawer-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const isEcoMode = document.documentElement.classList.contains('perf-tier-low') || window.innerWidth < 768;

  // --- 1. CONTROLE DE NAVEGAÇÃO APÓS O HERO (ZERO-CPU OBSERVER & SCROLL SYNC) ---
  if (header) {
    const updateHeaderVisibility = () => {
      if (!sobreSection) return;
      const rect = sobreSection.getBoundingClientRect();
      
      // O header só se torna visível quando o usuário ultrapassa a experiência do Hero
      // (isto é, quando o topo da seção #sobre atinge ou ultrapassa a área visível superior)
      if (rect.top <= 80) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    if ('IntersectionObserver' in window && sobreSection) {
      const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(() => {
          updateHeaderVisibility();
        });
      }, {
        threshold: [0, 0.05, 0.1, 0.25, 0.5],
        rootMargin: '0px 0px 0px 0px'
      });

      headerObserver.observe(sobreSection);
      if (heroSection) headerObserver.observe(heroSection);
    }

    // Listener desacoplado via requestAnimationFrame para resposta imediata
    let isHeaderTicking = false;
    window.addEventListener('scroll', () => {
      if (!isHeaderTicking) {
        requestAnimationFrame(() => {
          updateHeaderVisibility();
          isHeaderTicking = false;
        });
        isHeaderTicking = true;
      }
    }, { passive: true });

    // Verificação inicial no carregamento da página
    updateHeaderVisibility();
  }

  // --- 2. MENU MOBILE DRAWER (GPU TRANSLATE) ---
  function openMobileMenu() {
    if (mobileDrawer && mobileOverlay) {
      mobileDrawer.classList.add('open');
      mobileOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileMenu() {
    if (mobileDrawer && mobileOverlay) {
      mobileDrawer.classList.remove('open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu, { passive: true });
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu, { passive: true });
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu, { passive: true });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu, { passive: true });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  }, { passive: true });

  // --- 3. SCROLL SUAVE PARA ÂNCORAS COM PRESERVAÇÃO DE MAIN THREAD ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 70;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- 4. REVELAÇÃO PROGRESSIVA EFICIENTE COM INTERSECTION OBSERVER ---
  const observerOptions = {
    threshold: isEcoMode ? 0.05 : 0.15,
    rootMargin: '0px 0px -30px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translate3d(0, 0, 0)';
        observer.unobserve(entry.target);
        
        // Remove willChange para liberar buffers de GPU
        setTimeout(() => {
          entry.target.style.willChange = 'auto';
        }, 600);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(
    '.specialty-card, .differential-row, .team-card, .about-visual-card'
  );

  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translate3d(0, 18px, 0)';
    if (!isEcoMode) {
      el.style.willChange = 'opacity, transform';
    }
    el.style.transition = `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index % 3 * 0.08, 0.2)}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index % 3 * 0.08, 0.2)}s`;
    revealObserver.observe(el);
  });

  // --- 5. MANIPULAÇÃO DO FORMULÁRIO DE AGENDAMENTO VIA WHATSAPP ---
  const bookingForm = document.getElementById('concierge-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('client-name');
      const phoneInput = document.getElementById('client-phone');
      const demandInput = document.getElementById('client-demand');
      const shiftInput = document.getElementById('client-shift');
      const submitBtn = document.getElementById('btn-submit-booking') || bookingForm.querySelector('button[type="submit"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const demand = demandInput ? demandInput.value : 'Psicoterapia Individual';
      const shift = shiftInput ? shiftInput.value : 'Horário Flexível';

      if (!name || !phone) {
        return;
      }

      // Mensagem personalizada e ética para o WhatsApp
      const message = `*Solicitação de Agendamento - Portal da Psicologia*

Olá! Gostaria de agendar uma consulta psicológica online.

- *Nome:* ${name}
- *WhatsApp:* ${phone}
- *Motivo / Objetivo:* ${demand}
- *Período Preferencial:* ${shift}
- *Modalidade:* Atendimento 100% Online

Aguardo informações sobre horários disponíveis. Obrigado(a)!`;

      const clinicWhatsAppNumber = '5551993617100';
      const whatsappUrl = `https://wa.me/${clinicWhatsAppNumber}?text=${encodeURIComponent(message)}`;

      if (submitBtn) {
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Redirecionando para o WhatsApp...</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #25D366, #1DA851)';
        submitBtn.style.color = '#FFFFFF';

        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
          submitBtn.innerHTML = '<span>Solicitação Aberta no WhatsApp!</span>';

          setTimeout(() => {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
            bookingForm.reset();
          }, 3000);
        }, 400);
      } else {
        window.open(whatsappUrl, '_blank');
        bookingForm.reset();
      }
    });
  }
});

/**
 * ==========================================================================
 * DARK MODE - LOGIC (SINCRONIZADO E ACESSÍVEL)
 * ==========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggles = document.querySelectorAll('.theme-toggle');
  
  function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    themeToggles.forEach(toggle => {
      toggle.setAttribute('aria-label', isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro');
      toggle.setAttribute('title', isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro');
    });
  }

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeUI(initialTheme);

  themeToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const root = document.documentElement;
      const currentTheme = root.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeUI(newTheme);
    });
  });

  // Listener para mudanças na preferência do sistema
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeUI(newTheme);
      }
    });
  }
});
