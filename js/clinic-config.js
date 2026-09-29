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
    legalName: "[RAZÃO SOCIAL / REGISTRO INSTITUCIONAL]",
    cnpj: "67.751.242/0001-98",
    tagline: "Centro de atendimento psicológico, psicoterapia e desenvolvimento humano.",
    description: "Atendimento psicológico online para todo o Brasil, pautado pelo sigilo ético, escuta qualificada e acolhimento singular.",
    
    // Contato Oficial (Centralizado — Altere aqui para atualizar todos os links do site)
    whatsappNumber: "5551992509187", // Apenas dígitos com código do país (ex: 5551993617100)
    whatsappDisplay: "(51) 99250-9187",
    email: "[E-MAIL PROFISSIONAL DA CLÍNICA]",
    emailDisplay: "contato@portaldapsicologia.com.br",
    instagram: "[INSTAGRAM OFICIAL DA CLÍNICA]",
    instagramUrl: "https://instagram.com",
    
    // Localização & Modalidade
    city: "[CIDADE]",
    state: "[ESTADO]",
    address: "[ENDEREÇO DA CLÍNICA OU MODALIDADE EXCLUSIVAMENTE ONLINE]",
    modality: "Atendimento Exclusivamente Online (Todo o Brasil e Exterior)",
    serviceHours: "Segunda a Sexta-feira, horários flexíveis sob agendamento",
    appointmentPlatform: "Google Meet ou Videochamada Privativa (sem necessidade de instalação de aplicativos)",
    
    // Mensagem de Boas-Vindas Oficial do WhatsApp Business
    whatsappAutoMessage: "Olá! Seja bem-vindo(a) ao Portal da Psicologia.\n\nAgradecemos pelo seu contato. Nossa equipe está à disposição para acolher sua demanda e fornecer informações sobre nossos atendimentos psicológicos.\n\nEm breve, retornaremos sua mensagem. Será um prazer conversar com você.\n\nFilipi Morais\nCRP: 07/43751",

    // Mensagens Pré-formatadas e Contextuais para o WhatsApp
    messages: {
      scheduling: "Olá! Gostaria de informações sobre horários disponíveis para agendamento de consulta psicológica online.",
      questions: "Olá! Gostaria de esclarecer uma dúvida sobre o atendimento psicológico online no Portal da Psicologia.",
      general: "Olá! Gostaria de mais informações sobre os atendimentos da clínica.",
      privacy: "Olá! Gostaria de esclarecer uma dúvida sobre privacidade e tratamento de dados no Portal da Psicologia.",
      teamContact: (profName) => `Olá! Gostaria de verificar a disponibilidade de atendimento com o profissional ${profName}.`,
      formSubmission: (data) => {
        return `*Solicitação de Agendamento — Portal da Psicologia*\n\n` +
               `Olá! Gostaria de agendar uma consulta psicológica online.\n\n` +
               `• *Nome:* ${data.name || '[Não informado]'}\n` +
               `• *WhatsApp:* ${data.phone || '[Não informado]'}\n` +
               `• *Motivo / Objetivo:* ${data.demand || 'Psicoterapia Individual'}\n` +
               `• *Melhor Período:* ${data.shift || 'Horário Flexível'}\n` +
               `• *Modalidade:* Atendimento 100% Online\n\n` +
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
  // 2. CORPO CLÍNICO / PROFISSIONAIS (ESTRUTURA ESCALÁVEL PARA 1, 2, 3 OU MAIS)
  // ============================================================================
  // Esta lista pode conter 1, 2, 3 ou quantos profissionais a clínica possuir.
  // Permite que novos psicólogos sejam adicionados sem refazer o componente.
  const PROFESSIONALS_CONFIG = [
    {
      id: 1,
      name: "Filipi Morais",
      crp: "07/43751",
      profession: "Psicólogo Clínico",
      approach: "Psicanálise",
      aboutTitle: "Sobre mim",
      about: "Acredito que o processo psicoterapêutico deve ser construído a partir da singularidade de cada pessoa, respeitando sua história, seus sentimentos, seus limites e suas necessidades. Meu trabalho é pautado pela ética profissional, pela escuta qualificada e por uma abordagem humana e acolhedora.",
      specializationsTitle: "Especializações",
      specializations: [
        "Psicologia e Saúde Mental",
        "Avaliação Psicológica",
        "Sexologia Clínica"
      ],
      photo: "public/foto-filipi.jpeg",
      instagram: "https://instagram.com",
      email: "contato@portaldapsicologia.com.br"
    }
  ];

  return {
    clinic: CLINIC_CONFIG,
    professionals: PROFESSIONALS_CONFIG
  };
}));
