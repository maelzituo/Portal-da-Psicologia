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

    const rawProfessionals = ClinicData.professionals || [];
    // Filtra estritamente profissionais ativos com dados mínimos válidos
    const professionals = rawProfessionals.filter(p => {
      return p && typeof p === 'object' && p.active !== false && p.name && p.crp;
    });

    if (!professionals.length) {
      return;
    }

    // Configura o atributo data-count e classes semânticas para o CSS responsivo
    teamGrid.setAttribute('data-count', String(professionals.length));
    teamGrid.classList.remove('team-single', 'team-duo', 'team-multi');

    if (professionals.length === 1) {
      teamGrid.classList.add('team-single');
    } else if (professionals.length === 2) {
      teamGrid.classList.add('team-duo');
    } else {
      teamGrid.classList.add('team-multi');
    }

    teamGrid.innerHTML = professionals.map((prof, index) => {
      const hasPhoto = Boolean(prof.photo && typeof prof.photo === 'string' && prof.photo.trim() !== '');
      const photoSrc = hasPhoto ? sanitize(prof.photo) : '';
      const name = sanitize(prof.name);
      const crp = sanitize(prof.crp);
      const hasProfession = Boolean(prof.profession || prof.professionalTitle);
      const profession = hasProfession ? sanitize(prof.profession || prof.professionalTitle) : '';
      const approach = sanitize(prof.approach || '');
      const aboutTitle = sanitize(prof.aboutTitle || 'Sobre mim');
      const about = sanitize(prof.about || prof.bio || '');
      const specializations = Array.isArray(prof.specializations) 
        ? prof.specializations 
        : (Array.isArray(prof.specialties) ? prof.specialties : []);
      const specializationsTitle = sanitize(
        prof.specializationsTitle || (specializations.length === 1 ? 'Especialização' : 'Especializações')
      );

      // Iniciais para monograma editorial do espaço reservado
      const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
      const photoAlt = hasProfession ? `${name} — ${profession}` : name;

      // 1. Fotografia ou espaço reservado estruturado
      const photoHtml = `
        <div class="team-photo-wrap" data-reserved-photo="${photoSrc}">
          ${photoSrc ? `
            <img src="${photoSrc}" 
                 alt="${photoAlt}" 
                 class="team-photo-img" 
                 loading="lazy" 
                 width="640" 
                 height="640"
                 onload="this.classList.add('is-loaded');"
                 onerror="this.style.display='none';">
          ` : ''}
          <div class="team-photo-placeholder" role="img" aria-label="Espaço reservado para fotografia de ${name}">
            <div class="team-placeholder-inner">
              <div class="team-placeholder-avatar">
                <span class="team-monogram">${initials}</span>
              </div>
              <span class="team-placeholder-label">Espaço Reservado para Fotografia</span>
              <span class="team-placeholder-target"><code>${photoSrc || 'public/foto.jpeg'}</code></span>
            </div>
          </div>
        </div>
      `;

      // 3. CRP e título profissional, estritamente quando informado
      const identificationHtml = hasProfession
        ? `
          <div class="team-identification">
            <span class="team-crp-text"><strong>CRP:</strong> ${crp}</span>
            <span class="team-id-separator" aria-hidden="true">·</span>
            <span class="team-profession-text"><strong>${profession}</strong></span>
          </div>
        `
        : `
          <div class="team-identification">
            <span class="team-crp-text"><strong>CRP:</strong> ${crp}</span>
          </div>
        `;

      // 4. Abordagem terapêutica
      const approachHtml = approach ? `
        <div class="team-approach">
          <strong>Abordagem:</strong> ${approach}
        </div>
      ` : '';

      // 5. Seção Sobre mim (integral e sem truncamento)
      const aboutHtml = about ? `
        <div class="team-editorial-block">
          <h4 class="team-editorial-title">${aboutTitle}</h4>
          <p class="team-about-text">${about}</p>
        </div>
      ` : '';

      // 6. Especializações, quando disponíveis
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
          ${photoHtml}
          <div class="team-info">
            <h3 class="team-name">${name}</h3>
            ${identificationHtml}
            ${approachHtml}
            ${aboutHtml}
            ${specializationsHtml}

            <div class="team-card-actions">
              <a href="${ClinicData.clinic.getWhatsAppUrl('team', { name: name })}" 
                 class="btn btn-secondary team-contact-btn" 
                 data-wa-context="team"
                 data-wa-prof="${name}"
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

    // Atualiza links de e-mail institucionais
    if (clinic.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.href = `mailto:${clinic.email}`;
        if (link.textContent.includes('@')) {
          link.textContent = clinic.emailDisplay || clinic.email;
        }
      });
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
