/**
 * PORTAL DA PSICOLOGIA - INTERAÇÕES GLOBAIS & EXPERIÊNCIA DO USUÁRIO
 * Otimizado para Core Web Vitals, INP, LCP e 60-120 FPS em CPUs móveis de baixo custo.
 * Zero-Jank: Elimina listeners de scroll contínuos com getBoundingClientRect().
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Cache de Elementos do DOM ---
  const header = document.querySelector('.site-header');
  const sobreSection = document.getElementById('sobre');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileClose = document.getElementById('mobile-drawer-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // --- 1. CONTROLE DE NAVEGAÇÃO DO HEADER (APARECE EXCLUSIVAMENTE A PARTIR DE SOBRE A CLÍNICA) ---
  if (header && sobreSection) {
    let headerTicking = false;

    function updateHeaderVisibility() {
      // O header só deve surgir quando o usuário atingir a seção Sobre a Clínica (#sobre)
      // e permanecer nas seções seguintes. Se retornar para a Transição ou Hero, ele se oculta.
      const rect = sobreSection.getBoundingClientRect();
      const isPastSobre = rect.top <= 70;

      if (isPastSobre) {
        if (!header.classList.contains('scrolled')) {
          header.classList.add('scrolled');
        }
      } else {
        if (header.classList.contains('scrolled')) {
          header.classList.remove('scrolled');
        }
      }
      headerTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!headerTicking) {
        requestAnimationFrame(updateHeaderVisibility);
        headerTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (!headerTicking) {
        requestAnimationFrame(updateHeaderVisibility);
        headerTicking = true;
      }
    }, { passive: true });

    // Verificação inicial no carregamento da página
    updateHeaderVisibility();
  }

  // --- 2. MENU MOBILE DRAWER (GPU TRANSLATE, ZERO REFLOW) ---
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

  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu, { passive: true });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  }, { passive: true });

  // --- 3. SCROLL SUAVE PARA ÂNCORAS COM PRESERVAÇÃO DE MAIN THREAD ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
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

  // --- 4. MICROINTERAÇÃO LOCALIZADA NO CARTÃO DE FILOSOFIA (DESKTOP) ---
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const visualCard = document.querySelector('.about-visual-card');
    // Adiciona listener diretamente ao card (NÃO na janela global!), eliminando cálculos contínuos
    if (visualCard && window.innerWidth >= 1024 && window.matchMedia('(hover: hover)').matches) {
      let cardTicking = false;
      let cardRect = null;

      visualCard.addEventListener('mouseenter', () => {
        cardRect = visualCard.getBoundingClientRect();
      }, { passive: true });

      visualCard.addEventListener('mousemove', (e) => {
        if (!cardTicking) {
          requestAnimationFrame(() => {
            if (!cardRect) cardRect = visualCard.getBoundingClientRect();
            const x = e.clientX - cardRect.left;
            const y = e.clientY - cardRect.top;
            const dx = (x - cardRect.width / 2) / (cardRect.width / 2);
            const dy = (y - cardRect.height / 2) / (cardRect.height / 2);

            const tiltX = (-dy * 2.0).toFixed(2);
            const tiltY = (dx * 2.0).toFixed(2);
            visualCard.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            cardTicking = false;
          });
          cardTicking = true;
        }
      }, { passive: true });

      visualCard.addEventListener('mouseleave', () => {
        cardRect = null;
        visualCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      }, { passive: true });
    }
  }

  // --- 5. FORMULÁRIO DE AGENDAMENTO VIA WHATSAPP CENTRALIZADO ---
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

      // Utiliza a configuração centralizada em ClinicData
      let whatsappUrl = '';
      if (typeof ClinicData !== 'undefined' && ClinicData.clinic) {
        whatsappUrl = ClinicData.clinic.getWhatsAppUrl('form', { name, phone, demand, shift });
      } else {
        const message = `*Solicitação de Agendamento - Portal da Psicologia*\n\nOlá! Gostaria de agendar uma consulta psicológica online.\n\n- *Nome:* ${name}\n- *WhatsApp:* ${phone}\n- *Motivo / Objetivo:* ${demand}\n- *Período Preferencial:* ${shift}\n- *Modalidade:* Atendimento 100% Online\n\nAguardo informações sobre horários disponíveis. Obrigado(a)!`;
        whatsappUrl = `https://wa.me/5551993617100?text=${encodeURIComponent(message)}`;
      }

      if (submitBtn) {
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Redirecionando para o WhatsApp...</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #25D366, #1DA851)';
        submitBtn.style.color = '#FFFFFF';

        setTimeout(() => {
          window.location.href = whatsappUrl;
          submitBtn.innerHTML = '<span>Solicitação Aberta!</span>';

          setTimeout(() => {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
            bookingForm.reset();
          }, 3000);
        }, 350);
      } else {
        window.location.href = whatsappUrl;
        bookingForm.reset();
      }
    });
  }

  // --- 6. DARK MODE - LOGIC (SINCRONIZADO E ACESSÍVEL) ---
  const themeToggles = document.querySelectorAll('.theme-toggle');

  function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    themeToggles.forEach((toggle) => {
      toggle.setAttribute('aria-label', isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro');
      toggle.setAttribute('title', isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro');
    });
  }

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeUI(initialTheme);

  themeToggles.forEach((toggle) => {
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

  // Listener para mudanças na preferência do sistema operacional
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeUI(newTheme);
      }
    });
  }
});
