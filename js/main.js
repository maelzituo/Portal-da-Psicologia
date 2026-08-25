/**
 * PORTAL DA PSICOLOGIA - INTERAÇÕES GLOBAIS & EXPERIÊNCIA DO USUÁRIO
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Elementos de Navegação ---
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileClose = document.getElementById('mobile-drawer-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // --- Controle da Barra de Navegação no Scroll (Otimizado Eco Mode) ---
  let isHeaderTicking = false;

  function handleHeaderScroll() {
    if (!header) return;
    const nextSection = document.getElementById('sobre');
    let shouldBeScrolled = false;
    
    if (nextSection) {
      // O GSAP cria um "pin-spacer" que altera completamente o offsetTop.
      // Usar getBoundingClientRect() é a forma perfeita e absoluta de saber
      // a distância real da próxima seção em relação ao viewport.
      // Dentro de um rAF (sem forçar repaints prévios), isso custa zero performance.
      const rect = nextSection.getBoundingClientRect();
      
      // Quando a seção 'sobre' estiver a 100px de tocar o topo da tela
      // O header começa a sua transição suave (0.45s) de crossfade
      shouldBeScrolled = rect.top <= 100; 
    } else {
      shouldBeScrolled = window.scrollY > 60;
    }

    if (shouldBeScrolled) {
      if (!header.classList.contains('scrolled')) header.classList.add('scrolled');
    } else {
      if (header.classList.contains('scrolled')) header.classList.remove('scrolled');
    }
  }

  // Throttle via requestAnimationFrame para performance matemática no mobile
  window.addEventListener('scroll', () => {
    if (!isHeaderTicking) {
      window.requestAnimationFrame(() => {
        handleHeaderScroll();
        isHeaderTicking = false;
      });
      isHeaderTicking = true;
    }
  }, { passive: true });

  handleHeaderScroll();

  // --- Menu Mobile Drawer ---
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

  if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // --- Scroll Suave para Âncoras ---
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

  // --- Revelação Gradual com IntersectionObserver ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translate3d(0, 0, 0)';
        observer.unobserve(entry.target);
        
        setTimeout(() => {
          entry.target.style.willChange = 'auto';
        }, 1000); // clear after transition
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(
    '.specialty-card, .differential-row, .team-card, .about-visual-card'
  );

  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translate3d(0, 24px, 0)';
    el.style.willChange = 'opacity, transform';
    el.style.transition = `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index % 3 * 0.1}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index % 3 * 0.1}s`;
    revealObserver.observe(el);
  });

  // --- Manipulação do Formulário de Agendamento Online & Encaminhamento WhatsApp ---
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
        alert('Por favor, preencha seu nome e WhatsApp para prosseguir.');
        return;
      }

      // Monta a mensagem personalizada e ética para o WhatsApp
      const message = `🌿 *Solicitação de Agendamento - Portal da Psicologia*

Olá! Gostaria de agendar uma consulta psicológica online.

👤 *Nome:* ${name}
📱 *WhatsApp:* ${phone}
🎯 *Motivo / Objetivo:* ${demand}
⏰ *Período Preferencial:* ${shift}
💻 *Modalidade:* Atendimento 100% Online

Aguardo informações sobre horários disponíveis. Obrigado(a)!`;

      // Codifica para a URL do WhatsApp
      const clinicWhatsAppNumber = '5511999999999'; // Número da clínica configurável
      const whatsappUrl = `https://wa.me/${clinicWhatsAppNumber}?text=${encodeURIComponent(message)}`;

      if (submitBtn) {
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Redirecionando para o WhatsApp...</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #25D366, #1DA851)';
        submitBtn.style.color = '#FFFFFF';

        // Abre o WhatsApp com a mensagem pré-preenchida
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');

          submitBtn.innerHTML = '<span>Solicitação Aberta no WhatsApp!</span>';

          setTimeout(() => {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
            bookingForm.reset();
          }, 3500);
        }, 600);
      } else {
        window.open(whatsappUrl, '_blank');
        bookingForm.reset();
      }
    });
  }
});
