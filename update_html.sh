#!/bin/bash

# 1. Add theme init script to <head>
sed -i '/<\/head>/i \
  <!-- Lógica de Inicialização do Tema (Previne Flash of Incorrect Theme) -->\
  <script>\
    (function() {\
      const storedTheme = localStorage.getItem("theme");\
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;\
      if (storedTheme === "dark" || (!storedTheme && systemDark)) {\
        document.documentElement.setAttribute("data-theme", "dark");\
      } else {\
        document.documentElement.setAttribute("data-theme", "light");\
      }\
    })();\
  </script>\
' index.html

# 2. Update header to include theme toggle
# Replacing <div class="nav-cta">...</div> with a wrapper <div class="nav-actions">...</div>
sed -i 's/<div class="nav-cta">/<div class="nav-actions nav-cta">/g' index.html
sed -i '/<div class="nav-actions nav-cta">/a \
        <button class="theme-toggle" id="theme-toggle" aria-label="Alternar modo de cor">\
          <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/></svg>\
          <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7c.18 0 .35.02.53.04C11.16 6.36 10 7.91 10 9.75c0 2.5 2.03 4.53 4.53 4.53 1.84 0 3.39-1.16 4.71-2.53.02.18.04.35.04.53 0 3.86-3.14 7-7 7z"/></svg>\
        </button>' index.html

