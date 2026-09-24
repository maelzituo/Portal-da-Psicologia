/**
 * PORTAL DA PSICOLOGIA — RENDERIZADOR DO CORPO CLÍNICO & SINCRONIZAÇÃO DE DADOS
 * 
 * Renderiza de forma dinâmica e elegante os cards dos profissionais com base em ClinicData.
 * Suporta 1, 2, 3 ou mais profissionais, com fallbacks seguros que impedem a exibição
 * de "undefined", "null" ou campos quebrados, com placeholders visuais de alto padrão.
 */

(function () {
  'use strict';

  function sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderTeam() {
    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid || typeof ClinicData === 'undefined') return;

    const professionals = ClinicData.professionals || [];
    if (!professionals.length) {
      teamGrid.innerHTML = `
        <div class="team-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <p>O corpo clínico está sendo estruturado. Em breve as informações dos profissionais estarão disponíveis.</p>
        </div>
      `;
      return;
    }

    // Ajusta o estilo de grid se houver apenas 1 ou 2 profissionais
    if (professionals.length === 1) {
      teamGrid.style.gridTemplateColumns = 'minmax(300px, 480px)';
      teamGrid.style.justifyContent = 'center';
    } else if (professionals.length === 2) {
      teamGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 440px))';
      teamGrid.style.justifyContent = 'center';
    } else {
      teamGrid.style.gridTemplateColumns = '';
      teamGrid.style.justifyContent = '';
    }

    teamGrid.innerHTML = professionals.map((prof, index) => {
      const hasPhoto = prof.photo && typeof prof.photo === 'string' && prof.photo.trim() !== '';
      const name = sanitize(prof.name || '[NOME DO PROFISSIONAL]');
      const crp = sanitize(prof.crp || '[CRP DO PROFISSIONAL]');
      const role = sanitize(prof.role || 'Psicologia Clínica');
      const approach = sanitize(prof.approach || '[ABORDAGEM CLÍNICA]');
      const education = sanitize(prof.education || '[FORMAÇÃO]');
      const bio = sanitize(prof.bio || 'Atendimento clínico com foco na escuta ética e desenvolvimento humano.');
      
      const photoHtml = hasPhoto
        ? `<img src="${sanitize(prof.photo)}" alt="${name}" class="team-photo-img" loading="lazy" width="400" height="260">`
        : `
          <div class="team-avatar-placeholder" aria-label="Espaço reservado para a foto oficial">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="placeholder-photo-tag">[FOTO DO PROFISSIONAL]</span>
          </div>
        `;

      const specialtiesHtml = Array.isArray(prof.specialties) && prof.specialties.length > 0
        ? `
          <div class="team-specialties-tags">
            ${prof.specialties.map(spec => `<span class="team-spec-pill">${sanitize(spec)}</span>`).join('')}
          </div>
        `
        : '';

      return `
        <article class="team-card" data-prof-id="${prof.id || index + 1}">
          <div class="team-photo-wrap">
            ${photoHtml}
          </div>
          <div class="team-info">
            <div class="team-role">${role}</div>
            <h3 class="team-name">${name}</h3>
            <div class="team-crp">
              <span class="crp-badge">${crp}</span>
              ${approach ? `<span class="approach-meta">• ${approach}</span>` : ''}
            </div>
            ${education ? `<div class="team-education"><small>${education}</small></div>` : ''}
            <p class="team-bio">${bio}</p>
            ${specialtiesHtml}
            <div class="team-card-actions">
              <a href="${ClinicData.clinic.getWhatsAppUrl('scheduling')}" 
                 class="btn btn-secondary team-contact-btn" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 aria-label="Agendar consulta com ${name}">
                <span>Consultar Disponibilidade</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Sincroniza links do WhatsApp no DOM com o ClinicData
  function syncWhatsAppLinks() {
    if (typeof ClinicData === 'undefined' || !ClinicData.clinic) return;
    const clinic = ClinicData.clinic;

    // Atualiza links com data-wa-context
    document.querySelectorAll('[data-wa-context]').forEach(link => {
      const context = link.getAttribute('data-wa-context');
      link.href = clinic.getWhatsAppUrl(context);
    });

    // Atualiza números de telefone visíveis marcados com a classe clinic-wa-display
    document.querySelectorAll('.clinic-wa-display').forEach(el => {
      el.textContent = clinic.whatsappDisplay;
    });

    // Atualiza botão flutuante se presente
    const floatingBtn = document.getElementById('floating-whatsapp-btn');
    if (floatingBtn) {
      floatingBtn.href = clinic.getWhatsAppUrl('scheduling');
    }

    // Atualiza link de contato do WhatsApp na seção de contato
    const contactWaLink = document.getElementById('contact-whatsapp-link');
    if (contactWaLink) {
      contactWaLink.href = clinic.getWhatsAppUrl('general');
      contactWaLink.textContent = clinic.whatsappDisplay;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderTeam();
      syncWhatsAppLinks();
    });
  } else {
    renderTeam();
    syncWhatsAppLinks();
  }
})();
