cat << 'CSS' >> css/style.css

/* Correções específicas para inputs que precisam de contraste no dark mode */
[data-theme="dark"] .form-input,
[data-theme="dark"] .form-select,
[data-theme="dark"] .form-input:focus,
[data-theme="dark"] .form-select:focus {
  background: var(--color-background-secondary);
  color: var(--text-primary);
  border-color: var(--color-border);
}

[data-theme="dark"] .form-select option {
  background-color: var(--color-background-secondary);
  color: var(--text-primary);
}

/* Ensure background is correctly applied */
[data-theme="dark"] body {
  background-color: var(--color-background);
}
CSS
