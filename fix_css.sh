cat << 'CSS' >> css/style.css

/* Fix the nav-actions display for mobile */
@media (max-width: 768px) {
  .site-header .nav-actions {
    display: flex;
    margin-right: 15px; /* Give space for hamburger menu */
  }
  .site-header .btn-nav {
    display: none; /* Hide 'Agendar consulta' on mobile header, keep only theme toggle */
  }
}
CSS
