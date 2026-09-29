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
      teamGrid.style.gridTemplateColumns = 'minmax(300px, 520px)';
      teamGrid.style.justifyContent = 'center';
    } else if (professionals.length === 2) {
      teamGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 460px))';
      teamGrid.style.justifyContent = 'center';
    } else {
      teamGrid.style.gridTemplateColumns = '';
      teamGrid.style.justifyContent = '';
    }

    teamGrid.innerHTML = professionals.map((prof, index) => {
      const hasPhoto = prof.photo && typeof prof.photo === 'string' && prof.photo.trim() !== '';
      const name = sanitize(prof.name || 'Filipi Morais');
      const crp = sanitize(prof.crp || '07/43751');
      const profession = sanitize(prof.profession || prof.professionalTitle || 'Psicólogo Clínico');
      const approach = sanitize(prof.approach || 'Psicanálise');
      const aboutTitle = sanitize(prof.aboutTitle || 'Sobre mim');
      const about = sanitize(prof.about || prof.bio || '');
      const specializationsTitle = sanitize(prof.specializationsTitle || 'Especializações');
      const specializations = Array.isArray(prof.specializations) 
        ? prof.specializations 
        : (Array.isArray(prof.specialties) ? prof.specialties : []);
      
      const photoSrc = hasPhoto ? sanitize(prof.photo) : '';

      const photoHtml = hasPhoto
        ? `<img src="${photoSrc}" alt="${name} — ${profession}" class="team-photo-img" loading="lazy" width="640" height="640">`
        : `
          <div class="team-avatar-placeholder" aria-label="Espaço reservado para a foto oficial">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="placeholder-photo-tag">[FOTO DO PROFISSIONAL]</span>
          </div>
        `;

      const specializationsHtml = specializations.length > 0
        ? `
          <div class="team-editorial-block">
            <h4 class="team-editorial-title">${specializationsTitle}</h4>
            <ul class="team-specializations-list">
              ${specializations.map(spec => `<li>${sanitize(spec)}</li>`).join('')}
            </ul>
          </div>
        `
        : '';

      return `
        <article class="team-card" data-prof-id="${prof.id || index + 1}">
          <div class="team-photo-wrap">
            ${photoHtml}
          </div>
          <div class="team-info">
            <h3 class="team-name">${name}</h3>
            
            <div class="team-identification">
              <span class="team-crp-text"><strong>CRP:</strong> ${crp}</span>
              <span class="team-id-separator" aria-hidden="true">·</span>
              <span class="team-profession-text"><strong>${profession}</strong></span>
            </div>

            <div class="team-approach">
              <strong>Abordagem:</strong> ${approach}
            </div>

            <div class="team-editorial-block">
              <h4 class="team-editorial-title">${aboutTitle}</h4>
              <p class="team-about-text">${about}</p>
            </div>

            ${specializationsHtml}

            <div class="team-card-actions">
              <a href="${ClinicData.clinic.getWhatsAppUrl('team', { name: name })}" 
                 class="btn btn-secondary team-contact-btn" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 aria-label="Consultar disponibilidade com ${name}">
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
