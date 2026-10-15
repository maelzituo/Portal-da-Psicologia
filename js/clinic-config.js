/**
 * PORTAL DA PSICOLOGIA — CONFIGURAÇÃO CENTRALIZADA DE DADOS DA CLÍNICA & PROFISSIONAIS
 * 
 * Este arquivo centraliza todas as informações institucionais, de contato e dos profissionais.
 * Permite que dados futuros (nomes, CRPs, fotos, e-mails, Instagram, CNPJ, etc.) sejam
 * facilmente atualizados em um único local, sem necessidade de alterar a estrutura dos componentes.
 * 
 * IMPORTANTE:
 * Os campos com placeholders (ex: "[NOME DO PROFISSIONAL]", "[CRP DO PROFISSIONAL]")
 * devem ser substituídos apenas quando os dados definitivos forem fornecidos oficialmente.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ClinicData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============================================================================
  // 1. DADOS INSTITUCIONAIS DA CLÍNICA
  // ============================================================================
  const CLINIC_CONFIG = {
    // Identidade
    name: "Portal da Psicologia",
    legalName: "Portal da Psicologia Serviços Psicológicos Ltda.",
    cnpj: "67.751.242/0001-98",
    tagline: "Centro de atendimento psicológico, psicoterapia e desenvolvimento humano.",
    description: "Atendimento psicológico on-line para todo o Brasil, pautado pelo sigilo ético, escuta qualificada e acolhimento singular.",
    
    // Contato Oficial (Centralizado — Altere aqui para atualizar todos os links do site)
    whatsappNumber: "5551992509187", // Apenas dígitos com código do país (5551992509187)
    whatsappDisplay: "(51) 99250-9187",
    email: "contato@portaldapsicoclinica.com.br",
    emailDisplay: "contato@portaldapsicoclinica.com.br",
    instagram: "https://instagram.com",
    instagramUrl: "https://instagram.com",
    
    // Localização & Modalidade
    city: "Porto Alegre",
    state: "RS",
    address: "Avenida Carlos Gomes, nº 700, Boa Vista, Porto Alegre, RS.",
    modality: "Atendimentos exclusivamente on-line, para todo o Brasil.",
    serviceHours: "Segunda-feira a sexta-feira, das 08h às 19h.",
    appointmentPlatform: "Videochamada privativa através de link enviado previamente (sem necessidade de instalação de aplicativos)",
    
    // Mensagem de Boas-Vindas Oficial do WhatsApp Business
    whatsappAutoMessage: "Olá! Seja bem-vindo(a) ao Portal da Psicologia.\n\nAgradecemos pelo seu contato. Nossa equipe está à disposição para acolher sua demanda e fornecer informações sobre nossos atendimentos psicológicos.\n\nEm breve, retornaremos sua mensagem. Será um prazer conversar com você.\n\nFilipi Morais\nCRP: 07/43751",

    // Mensagens Pré-formatadas e Contextuais para o WhatsApp
    messages: {
      scheduling: "Olá! Gostaria de informações sobre horários disponíveis para agendamento de consulta psicológica on-line.",
      questions: "Olá! Gostaria de esclarecer uma dúvida sobre o atendimento psicológico on-line no Portal da Psicologia.",
      general: "Olá! Gostaria de mais informações sobre os atendimentos da clínica.",
      privacy: "Olá! Gostaria de esclarecer uma dúvida sobre privacidade e tratamento de dados no Portal da Psicologia.",
      teamContact: (profName) => `Olá! Gostaria de verificar a disponibilidade de atendimento com o profissional ${profName}.`,
      formSubmission: (data) => {
        return `*Solicitação de Agendamento — Portal da Psicologia*\n\n` +
               `Olá! Gostaria de agendar uma consulta psicológica on-line.\n\n` +
               `• *Nome:* ${data.name || '[Não informado]'}\n` +
               `• *WhatsApp:* ${data.phone || '[Não informado]'}\n` +
               `• *Motivo / Objetivo:* ${data.demand || 'Psicoterapia Individual'}\n` +
               `• *Melhor Período:* ${data.shift || 'Horário Flexível'}\n` +
               `• *Modalidade:* Atendimentos exclusivamente on-line, para todo o Brasil.\n\n` +
               `Aguardo orientações sobre disponibilidade de horários. Obrigado(a)!`;
      }
    },

    /**
     * Gera URL do WhatsApp com mensagem contextual codificada
     * @param {string} context - 'scheduling' | 'questions' | 'general' | 'privacy' | 'form' | 'team'
     * @param {object} customData - dados adicionais para contexto 'form' ou 'teamContact'
     * @returns {string} URL completa do wa.me
     */
    getWhatsAppUrl: function (context, customData) {
      let message = this.messages.general;

      if (context === 'scheduling') {
        message = this.messages.scheduling;
      } else if (context === 'questions') {
        message = this.messages.questions;
      } else if (context === 'privacy' || context === 'dpo') {
        message = this.messages.privacy;
      } else if (context === 'form' && customData) {
        message = this.messages.formSubmission(customData);
      } else if (context === 'team' && customData && customData.name) {
        message = this.messages.teamContact(customData.name);
      }

      return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
    }
  };

  // ============================================================================
  // 2. CORPO CLÍNICO / PROFISSIONAIS (ESTRUTURA ESCALÁVEL PARA MÚLTIPLOS PSICÓLOGOS)
  // ============================================================================
  // O componente suporta 1, 2, 3 ou mais psicólogos de forma totalmente dinâmica.
  // Para adicionar um novo profissional futuramente, basta incluir um novo objeto
  // nesta lista com seus respectivos dados individuais (nome, CRP, profissão,
  // abordagem, apresentação e especializações).
  // Nunca adicione profissionais fictícios ou cards incompletos nesta lista.
  const PROFESSIONALS_CONFIG = [
    {
      id: "filipi-morais",
      name: "Filipi Morais",
      crp: "07/43751",
      profession: "Psicólogo Clínico",
      approach: "Psicanálise",
      aboutTitle: "Sobre mim",
      about: "Acredito que o processo psicoterapêutico deve ser construído a partir da singularidade de cada pessoa, respeitando sua história, seus sentimentos, seus limites e suas necessidades. Meu trabalho é pautado pela ética profissional, pela escuta qualificada e por uma abordagem humana e acolhedora.",
      specializationsTitle: "Especializações",
      specializations: [
        "Psicologia e Saúde Mental",
        "Avaliação psicológica",
        "Sexologia Clínica"
      ],
      // Local do arquivo de foto: public/foto-filipi.jpeg (Foto presente no projeto)
      photo: "public/foto-filipi.jpeg",
      active: true
    },
    {
      id: "carolina-poliane",
      name: "Carolina Poliane Schirmer Ferreira",
      crp: "08/45487",
      profession: "", // Sem título adicional além das informações confirmadas
      approach: "Terapia Cognitivo-Comportamental (TCC)",
      aboutTitle: "Sobre mim",
      about: "Psicóloga formada desde o ano de 2016. Atuo na área da saúde mental/clínica com o foco em Psicodiagnóstico. Acredito que todo sofrimento pode ser escutado, trabalhado e com o tempo podemos modificá-lo juntos. Meu trabalho é baseado na escuta humanizada, buscando ter um vínculo terapêutico sólido e de muita confiança, embasado no sigilo e na ética profissional.",
      specializationsTitle: "Especialização",
      specializations: [
        "Terapia Cognitivo-Comportamental (TCC)"
      ],
      // Local do arquivo de foto: public/foto-carolina.jpeg (Espaço reservado: adicione a foto neste caminho para exibir automaticamente)
      photo: "public/foto-carolina.jpeg",
      active: true
    },
    {
      id: "thaiana-veronese",
      name: "Thaiana Veronese Allonso",
      crp: "07/43554",
      profession: "", // Sem título adicional além das informações confirmadas
      approach: "Terapia Cognitivo-Comportamental (TCC)",
      aboutTitle: "Sobre mim",
      about: "Minha prática é orientada pela Terapia Cognitivo-Comportamental (TCC) e atravessada pela Psicologia Social, integrando conhecimento científico, compreensão da história de vida e acolhimento. Acredito em uma psicologia que une técnica e afeto, respeitando a singularidade de cada pessoa e suas diferentes formas de existir e sentir.",
      specializationsTitle: "Especializações",
      specializations: [
        "Psicologia de Grupos",
        "Psicologia Social",
        "Saúde da Mulher",
        "Orientação Parental"
      ],
      // Local do arquivo de foto: public/foto-thaiana.jpeg (Espaço reservado: adicione a foto neste caminho para exibir automaticamente)
      photo: "public/foto-thaiana.jpeg",
      active: true
    }
  ];

  return {
    clinic: CLINIC_CONFIG,
    professionals: PROFESSIONALS_CONFIG
  };
}));
