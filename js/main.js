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

  // --- Controle da Barra de Navegação no Scroll ---
  function handleHeaderScroll() {
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
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
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(
    '.specialty-card, .differential-row, .team-card, .about-visual-card'
  );

  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index % 3 * 0.1}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index % 3 * 0.1}s`;
    revealObserver.observe(el);
  });

  // --- Manipulação do Formulário de Contato / Agendamento ---
  const bookingForm = document.getElementById('concierge-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('client-name');
      const phoneInput = document.getElementById('client-phone');
      const submitBtn = bookingForm.querySelector('button[type="submit"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (!name || !phone) {
        alert('Por favor, preencha os campos obrigatórios.');
        return;
      }

      if (submitBtn) {
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Solicitação enviada com sucesso!</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #DFCA9D, #B39A68)';
        submitBtn.style.color = '#07090D';

        setTimeout(() => {
          submitBtn.innerHTML = originalContent;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
          bookingForm.reset();
        }, 3000);
      }
    });
  }
});
