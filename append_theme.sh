cat << 'CSS' >> css/style.css

/* ==========================================================================
   DARK MODE - SISTEMA DE TEMA NOTURNO
   ========================================================================== */
[data-theme="dark"] {
  --color-background: #111412;
  --color-background-secondary: #171b19;
  --color-card: #1c211f;
  --color-card-elevated: #1f2522;
  --color-card-hover: #262c29;

  --color-primary: #a7bfae;
  --color-primary-dark: #b8ccbe;
  --color-primary-light: #7a9484;
  --color-primary-soft: rgba(167, 191, 174, 0.08);

  --color-secondary: #90a388;
  --color-secondary-light: #a9bc9f;
  --color-secondary-soft: rgba(144, 163, 136, 0.1);

  --color-text: #eaecec;
  --color-text-secondary: #a3aba5;
  --text-pure: #ffffff;
  --text-primary: #eaecec;
  --text-secondary: #a3aba5;
  --text-muted: #79827b;

  --color-border: rgba(255, 255, 255, 0.08);
  --glass-bg: rgba(28, 33, 31, 0.88);
  --glass-bg-subtle: rgba(28, 33, 31, 0.65);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(181, 149, 103, 0.45);
  --glass-specular: rgba(255, 255, 255, 0.03);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 12px 30px -4px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 22px 50px -10px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2);
  --shadow-hover: 0 26px 60px -8px rgba(0, 0, 0, 0.4), 0 10px 24px rgba(181, 149, 103, 0.1);
}

/* Transições suaves para mudança de tema */
body, .site-header.scrolled, .nav-menu, .card, .btn, .specialty-card, .team-card, .form-input, .form-select, .mobile-nav-drawer, .about-stats-card, .contact-card {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}

/* Correções de inputs e elementos com cor hardcoded para o tema */
.form-input, .form-select {
  background: var(--color-background-secondary);
  color: var(--text-primary);
}
.form-input:focus, .form-select:focus {
  background: var(--color-background-secondary);
}
.form-select option {
  background-color: var(--color-background-secondary);
  color: var(--text-primary);
}
.team-image-box {
  background: linear-gradient(180deg, var(--color-background-secondary) 0%, var(--color-card-hover) 100%);
}

/* Botão de Toggle de Tema */
.theme-toggle {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: var(--transition-fast);
}
.site-header:not(.scrolled) .theme-toggle {
  color: #FAF9F6;
  border-color: rgba(255, 255, 255, 0.2);
}
.theme-toggle:hover {
  background: var(--color-primary-soft);
  transform: translateY(-2px);
}
.site-header:not(.scrolled) .theme-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}
.theme-toggle svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

[data-theme="dark"] .icon-moon { display: none; }
[data-theme="dark"] .icon-sun { display: block; }
[data-theme="light"] .icon-moon { display: block; }
[data-theme="light"] .icon-sun { display: none; }
CSS
