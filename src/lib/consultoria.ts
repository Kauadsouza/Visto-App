/**
 * =============================================================
 * Planos de consultoria
 * =============================================================
 *
 * Cada plano é uma oferta contratável. O texto é a cara do que se entrega,
 * sem prometer o que a consultoria não pode dar. O Visto não é assessoria
 * jurídica — os disclaimers reforçam isso em cada CTA.
 * =============================================================
 */

export type CategoriaConsultor = 'diagnostico' | 'acompanhamento' | 'aplicacao';
export type CicloConsultor = 'unico' | 'mensal';

export interface PlanoConsultoria {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: CategoriaConsultor;
  preco: number;
  periodicidade: CicloConsultor;
  duracao: string;
  entregaveis: string[];
  limitacoes: string[];
  bonus?: string[];
}

export const PLANOS: PlanoConsultoria[] = [
  {
    slug: 'diagnostico-humano',
    titulo: 'Diagnóstico com consultor',
    resumo:
      'Uma conversa de 1h com um consultor de imigração que revisa o seu perfil e confirma qual rota vale a pena seguir.',
    categoria: 'diagnostico',
    preco: 290,
    periodicidade: 'unico',
    duracao: '1 reunião de 60 min + relatório escrito',
    entregaveis: [
      'Leitura do questionário que você respondeu aqui',
      '1 reunião por vídeo com consultor',
      'Relatório escrito com a rota recomendada e por quê',
      'Lista de documentos a começar a juntar',
    ],
    limitacoes: [
      'Não é assessoria jurídica — não há revisão de petição',
      'Não inclui acompanhamento depois da reunião',
    ],
    bonus: ['Gravação da reunião por 30 dias'],
  },
  {
    slug: 'acompanhamento-mensal',
    titulo: 'Acompanhamento mensal',
    resumo:
      'Consultor dedicado que te guia nas próximas etapas enquanto você executa. Acompanhamento contínuo até a decisão.',
    categoria: 'acompanhamento',
    preco: 390,
    periodicidade: 'mensal',
    duracao: 'Enquanto você quiser, cancele a qualquer momento',
    entregaveis: [
      'Tudo do diagnóstico com consultor',
      'Mensagens ilimitadas (resposta em até 24h em dias úteis)',
      '2 reuniões por mês',
      'Checklist personalizado atualizado conforme você avança',
      'Suporte para dúvidas sobre documentos e formulários',
    ],
    limitacoes: [
      'O consultor não preenche formulários oficiais por você',
      'Não cobre honorários de advogado imigracionista (parceria à parte)',
    ],
    bonus: ['Modelos de e-mail para consulado, universidade e imigração'],
  },
  {
    slug: 'aplicacao-completa',
    titulo: 'Aplicação completa',
    resumo:
      'O consultor conduz o processo do início ao fim, do recolhimento de documentos à resposta do consulado.',
    categoria: 'aplicacao',
    preco: 1900,
    periodicidade: 'unico',
    duracao: '3 a 6 meses, depende da rota',
    entregaveis: [
      'Tudo do acompanhamento mensal, pelo tempo que durar',
      'Revisão de cada formulário antes de enviar',
      'Resposta a solicitações do consulado (RFEs)',
      'Suporte até a decisão final',
    ],
    limitacoes: [
      'Sujeito à elegibilidade do seu perfil — devolvemos o valor se não for viável',
      'Honorários de terceiros (taxa consular, tradutor juramentado) são por sua conta',
    ],
    bonus: ['Suporte de 30 dias após a decisão, qualquer que seja o resultado'],
  },
];

export function planoPorSlug(slug: string): PlanoConsultoria | undefined {
  return PLANOS.find((p) => p.slug === slug);
}

export function rotuloCategoria(c: CategoriaConsultor): string {
  return { diagnostico: 'Diagnóstico', acompanhamento: 'Acompanhamento', aplicacao: 'Aplicação' }[c];
}