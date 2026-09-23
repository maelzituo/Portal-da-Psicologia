/**
 * PORTAL DA PSICOLOGIA — MÓDULO DE FAQ / PERGUNTAS FREQUENTES
 * Gerencia o comportamento do Accordion, filtragem de categorias,
 * expansão progressiva ("Ver todas as perguntas") e acessibilidade WCAG AA.
 */

(function () {
  'use strict';

  // Base de dados estruturada do FAQ (14 perguntas categorizadas)
  const FAQ_DATA = [
    // --- Grupo 1: Sobre o Atendimento (1 a 6) ---
    {
      id: 1,
      category: 'atendimento',
      question: 'Como funciona o atendimento psicológico online?',
      answer: 'O atendimento é realizado por videochamada, em um ambiente virtual reservado e com horário previamente agendado. O paciente pode realizar a sessão de onde estiver, desde que esteja em um local tranquilo e com privacidade.'
    },
    {
      id: 2,
      category: 'atendimento',
      question: 'Quem pode fazer terapia online?',
      answer: 'O atendimento psicológico online pode ser realizado por pessoas que desejam cuidar da saúde emocional, compreender melhor suas dificuldades, desenvolver estratégias para lidar com situações da vida ou simplesmente buscar maior qualidade de vida.'
    },
    {
      id: 3,
      category: 'atendimento',
      question: 'Preciso ter um diagnóstico para fazer terapia?',
      answer: 'Não. Você não precisa ter um diagnóstico ou estar enfrentando um transtorno psicológico para procurar atendimento. A psicoterapia também pode ajudar em questões emocionais, relacionamentos, autoestima, mudanças de vida, dificuldades profissionais e outras situações.'
    },
    {
      id: 4,
      category: 'atendimento',
      question: 'Quanto tempo dura cada sessão?',
      answer: 'As sessões têm duração de 45 minutos.'
    },
    {
      id: 5,
      category: 'atendimento',
      question: 'Com que frequência devo fazer terapia?',
      answer: 'A terapia precisa, preferencialmente, ser semanal porque a continuidade é importante para construir o processo terapêutico com consistência. O intervalo de uma semana permite acompanhar o que aconteceu, compreender sentimentos e situações recentes e dar continuidade ao que foi trabalhado na sessão anterior. Mais do que uma frequência, trata-se de criar um espaço regular de escuta, reflexão e elaboração.'
    },
    {
      id: 6,
      category: 'atendimento',
      question: 'O atendimento é sigiloso?',
      answer: 'Sim. O sigilo profissional é um princípio fundamental do atendimento psicológico. As informações compartilhadas durante as sessões são tratadas com confidencialidade, respeitando as normas profissionais e a legislação aplicável.'
    },

    // --- Grupo 2: Sobre a Experiência (7 a 11) ---
    {
      id: 7,
      category: 'experiencia',
      question: 'Posso fazer terapia pelo celular?',
      answer: 'Sim. O atendimento on-line pode ser realizado por celular, tablet ou computador, desde que o dispositivo tenha acesso à internet, câmera e microfone.'
    },
    {
      id: 8,
      category: 'experiencia',
      question: 'Preciso instalar algum aplicativo?',
      answer: 'Para realizar a terapia on-line, você não precisa instalar nenhum aplicativo específico. As sessões podem ser realizadas pelo Google Meet, através de um link enviado previamente, ou por videochamada. É um processo simples, seguro e você pode participar pelo celular ou computador.'
    },
    {
      id: 9,
      category: 'experiencia',
      question: 'Como faço para agendar uma consulta?',
      answer: 'Entre em contato com a clínica pelos canais oficiais de atendimento. Nossa equipe poderá fornecer informações sobre horários disponíveis, modalidade de atendimento e valores, além de orientar você sobre os próximos passos.'
    },
    {
      id: 10,
      category: 'experiencia',
      question: 'Posso escolher o psicólogo que irá me atender?',
      answer: 'Sempre que possível, a clínica busca considerar as necessidades e preferências do paciente para realizar o encaminhamento ao profissional mais adequado.'
    },
    {
      id: 11,
      category: 'experiencia',
      question: 'E se eu não me sentir confortável com o psicólogo?',
      answer: 'A relação entre paciente e profissional é muito importante para o processo terapêutico. Caso você sinta que o profissional ou a abordagem não estão adequados às suas necessidades, converse com a clínica para avaliar as possibilidades de encaminhamento.'
    },

    // --- Grupo 3: Sobre o Atendimento Online (12 a 14) ---
    {
      id: 12,
      category: 'online',
      question: 'A clínica atende crianças e adolescentes?',
      answer: 'A disponibilidade de atendimento para crianças e adolescentes depende dos profissionais da clínica e de suas respectivas áreas de atuação. Entre em contato para verificar a disponibilidade e as condições específicas para esse público.'
    },
    {
      id: 13,
      category: 'online',
      question: 'A clínica atende pessoas de outras cidades ou estados?',
      answer: 'A clínica realiza atendimentos on-line para pessoas de todo o Brasil. Por meio da modalidade on-line, podemos oferecer acompanhamento psicológico independentemente do estado em que o paciente esteja. As sessões são realizadas por videochamada, com praticidade, privacidade e segurança, mantendo o compromisso com a qualidade do atendimento, o sigilo profissional e os princípios éticos da Psicologia.'
    },
    {
      id: 14,
      category: 'online',
      question: 'A terapia on-line funciona tão bem quanto a presencial?',
      answer: 'A terapia on-line pode ser eficaz para muitas pessoas e situações. A qualidade do processo terapêutico envolve fatores como a relação entre paciente e psicólogo, a escuta, o vínculo, a continuidade do acompanhamento e a adequação da modalidade às necessidades de cada pessoa.'
    }
  ];

  function initFaq() {
    const faqContainer = document.getElementById('faq-accordion-container');
    const toggleAllBtn = document.getElementById('faq-toggle-all');
    const categoryButtons = document.querySelectorAll('.faq-category-btn');

    if (!faqContainer) return;

    let currentCategory = 'todos';
    let isExpandedAll = false;
    const INITIAL_VISIBLE_COUNT = 6;

    // --- 1. RENDERIZAÇÃO PROGRESSIVA DO ACCORDION ---
    function renderAccordion() {
      // Itens a exibir conforme a categoria selecionada
      const filteredItems = FAQ_DATA.filter((item) => {
        if (currentCategory === 'todos') return true;
        return item.category === currentCategory;
      });

      faqContainer.innerHTML = '';

      filteredItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'faq-item';
        itemEl.setAttribute('data-category', item.category);
        itemEl.id = `faq-item-${item.id}`;

        // Se estiver na aba "todos" e ainda não expandiu tudo, esconde itens além do 6º
        if (currentCategory === 'todos' && !isExpandedAll && index >= INITIAL_VISIBLE_COUNT) {
          itemEl.classList.add('faq-item-collapsed');
        }

        itemEl.innerHTML = `
          <h3 class="faq-question-heading">
            <button 
              type="button" 
              class="faq-trigger" 
              id="faq-btn-${item.id}" 
              aria-expanded="false" 
              aria-controls="faq-answer-${item.id}"
            >
              <span class="faq-question-text">${item.question}</span>
              <span class="faq-icon-wrapper" aria-hidden="true">
                <span class="faq-icon"></span>
              </span>
            </button>
          </h3>
          <div 
            id="faq-answer-${item.id}" 
            class="faq-content" 
            role="region" 
            aria-labelledby="faq-btn-${item.id}"
          >
            <div class="faq-content-inner">
              <p>${item.answer}</p>
            </div>
          </div>
        `;

        faqContainer.appendChild(itemEl);
      });

      // Configuração dos Listeners nos botões
      attachAccordionListeners();

      // Atualiza o estado do botão "Ver todas as perguntas"
      updateToggleAllBtn(filteredItems.length);
    }

    // --- 2. CONTROLE DO ACCORDION (EXPANSÃO / FECHAMENTO SUAVE) ---
    function attachAccordionListeners() {
      const triggers = faqContainer.querySelectorAll('.faq-trigger');

      triggers.forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          const isCurrentlyOpen = item.classList.contains('is-open');

          // Fecha os outros itens para manter o contexto visual limpo e evitar layout shift
          faqContainer.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
            if (openItem !== item) {
              openItem.classList.remove('is-open');
              const openBtn = openItem.querySelector('.faq-trigger');
              if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
            }
          });

          // Alterna o item atual
          if (isCurrentlyOpen) {
            item.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
          } else {
            item.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
    }

    // --- 3. ATUALIZAÇÃO DO BOTÃO "VER TODAS AS PERGUNTAS" ---
    function updateToggleAllBtn(totalCount) {
      if (!toggleAllBtn) return;

      const actionsWrapper = toggleAllBtn.closest('.faq-actions-wrapper');

      // Se filtrou por uma categoria específica e tem menos ou igual a 6 itens, esconde o botão
      if (currentCategory !== 'todos') {
        if (actionsWrapper) actionsWrapper.style.display = 'none';
        return;
      }

      if (actionsWrapper) actionsWrapper.style.display = 'flex';

      const btnText = toggleAllBtn.querySelector('.faq-toggle-text');
      if (isExpandedAll) {
        if (btnText) btnText.textContent = 'Mostrar menos perguntas';
        toggleAllBtn.classList.add('expanded');
      } else {
        if (btnText) btnText.textContent = `Ver todas as perguntas (${totalCount})`;
        toggleAllBtn.classList.remove('expanded');
      }
    }

    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', () => {
        isExpandedAll = !isExpandedAll;

        const collapsedItems = faqContainer.querySelectorAll('.faq-item-collapsed');
        if (isExpandedAll) {
          collapsedItems.forEach((el) => {
            el.classList.remove('faq-item-collapsed');
            el.style.opacity = '0';
            el.style.transform = 'translate3d(0, 10px, 0)';
            el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            requestAnimationFrame(() => {
              el.style.opacity = '1';
              el.style.transform = 'translate3d(0, 0, 0)';
            });
          });
        } else {
          // Volta a ocultar a partir do 6º
          const allItems = faqContainer.querySelectorAll('.faq-item');
          allItems.forEach((el, index) => {
            if (index >= INITIAL_VISIBLE_COUNT) {
              el.classList.add('faq-item-collapsed');
              el.classList.remove('is-open');
              const btn = el.querySelector('.faq-trigger');
              if (btn) btn.setAttribute('aria-expanded', 'false');
            }
          });

          // Rola suavemente de volta para a seção FAQ se o usuário estiver muito abaixo
          const faqSection = document.getElementById('faq');
          if (faqSection) {
            const rect = faqSection.getBoundingClientRect();
            if (rect.top < -100) {
              window.scrollTo({
                top: window.pageYOffset + rect.top - 80,
                behavior: 'smooth'
              });
            }
          }
        }

        updateToggleAllBtn(FAQ_DATA.length);
      });
    }

    // --- 4. FILTRAGEM POR CATEGORIA ---
    categoryButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        if (cat === currentCategory) return;

        currentCategory = cat;

        categoryButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Se mudou de categoria, reseta expansão se for uma categoria específica
        if (currentCategory !== 'todos') {
          isExpandedAll = true;
        } else {
          isExpandedAll = false;
        }

        renderAccordion();
      });
    });

    // Render inicial
    renderAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaq);
  } else {
    initFaq();
  }
})();
