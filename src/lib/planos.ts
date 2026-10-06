/**
 * =============================================================
 * Checklists por rota
 * =============================================================
 *
 * Conteúdo puro e estático, como o diagnóstico: sem banco, sem API. Cada
 * rota do MVP tem entre 5 e 12 itens, distribuídos pelas cinco fases.
 *
 * Fases em ordem de execução:
 *   Preparação → Documentos → Aplicação → Aguardando → Depois de chegar
 *
 * Os prazos são estimativas, não prazos oficiais de consulado. Os custos são
 * em BRL e são apenas a parte que o app consegue estimar (taxas e
 * documentos) — NÃO incluem passagem aérea nem custo de vida no destino.
 * =============================================================
 */

import type { FasePlano, ItemPlano } from '@/lib/database.types';

/**
 * =============================================================
 * ⚠️  OS CUSTOS AQUI SÃO ESTIMATIVAS, NÃO TABELAS OFICIAIS.
 * =============================================================
 *
 * Os valores de custo e prazo foram escritos a partir de referências gerais
 * de mercado. NÃO vieram de tabela de consulado, nem de fonte oficial, e não
 * foram conferidos item por item. Antes de publicar na Play Store eles
 * precisam ser validados contra as fontes primárias:
 *
 *   · UKVI — https://www.gov.uk/visas-immigration  (Student visa, CAS, Biometrics)
 *   · Consulado Geral da Espanha em Brasília — taxas e documentos por tipo
 *   · covariantes: câmbio, preço de tradução juramentada, seguros
 *
 * Servem para a pessoa ter ordem de grandeza e comparar rotas. Não servem
 * para decidir se tem dinheiro suficiente.
 *
 * O texto do aviso mora aqui para que código e tela nunca discordem sobre
 * ele — mudar um, muda os dois.
 */
export const CUSTOS_SAO_ESTIMATIVAS = true;

export const AVISO_CUSTOS =
  'Custos e prazos são estimativas educacionais, baseadas em referências ' +
  'gerais de mercado. Não vieram de tabela oficial de consulado e não foram ' +
  'conferidos item a item. Confirme cada valor na fonte oficial antes de ' +
  'decidir por eles.';

type ItemBruto = Omit<ItemPlano, 'custo'> & { custo: number };

export const FASES: { id: FasePlano; nome: string }[] = [
  { id: 'preparacao', nome: 'Preparação' },
  { id: 'documentos', nome: 'Documentos' },
  { id: 'aplicacao', nome: 'Aplicação' },
  { id: 'aguardando', nome: 'Aguardando' },
  { id: 'depois', nome: 'Depois de chegar' },
];

const checklists: Record<string, ItemBruto[]> = {
  'reino-unidos-estudo': [
    {
      titulo: 'Definir o curso e a universidade',
      descricao:
        'Filtrar cursos elegíveis ao Student visa e montar uma lista de 3faculdades.',
      fase: 'preparacao',
      prazo: 'semana 1',
      custo: 0,
    },
    {
      titulo: 'Abrir conta para guardar os funds',
      descricao:
        'Os £1.400 por ano precisam ficar 28 dias seguidos numa conta em seu nome.',
      fase: 'preparacao',
      prazo: 'semana 1 a 3',
      custo: 0,
    },
    {
      titulo: 'Teste de inglês',
      descricao:
        ' IELTS Academic ou equivalente é aceito. Sem ele, a oferta pode ser recusada.',
      fase: 'preparacao',
      prazo: 'semana 2',
      custo: 900,
    },
    {
      titulo: 'Passaporte válido',
      descricao:
        'Precisa ter pelo menos 6 meses de validade sobre a data de saída.',
      fase: 'documentos',
      prazo: 'semana 1',
      custo: 300,
    },
    {
      titulo: 'Histórico escolar e diplomas',
      descricao:
        'Declaração de matrícula e certificado de conclusão, com tradução juramentada se necessário.',
      fase: 'documentos',
      prazo: 'semana 3 a 4',
      custo: 600,
    },
    {
      titulo: 'Extratos bancários dos últimos meses',
      descricao:
        'Mostrar origem do dinheiro para não levantar dúvida sobre fundos.',
      fase: 'documentos',
      prazo: 'semana 4',
      custo: 0,
    },
    {
      titulo: 'Obter a carta CAS',
      descricao:
        'A universidade emite após a oferta. Custa £490 e define a validade do pedido.',
      fase: 'aplicacao',
      prazo: 'semana 6 a 8',
      custo: 3_100,
    },
    {
      titulo: 'Agendar a biometria no VAC',
      descricao: 'A tomada de digital e foto é feita presencialmente.',
      fase: 'aplicacao',
      prazo: 'semana 9',
      custo: 700,
    },
    {
      titulo: 'Enviar o pedido e pagar a taxa',
      descricao: 'Taxa de visto em Eligibility and fee, paga online após o CAS.',
      fase: 'aplicacao',
      prazo: 'semana 9 a 10',
      custo: 3_500,
    },
    {
      titulo: 'Comprar passagem e seguro',
      descricao:
        'O UKVI exige comprovante de montagem e cobertura médica £1.035 por ano.',
      fase: 'aplicacao',
      prazo: 'após aprovação',
      custo: 4_200,
    },
    {
      titulo: 'Registro no local e matrícula',
      descricao:
        'Guarde o seu BRP e finalize a matrícula para não perder a bolsa.',
      fase: 'depois',
      prazo: 'até 10 dias após chegar',
      custo: 800,
    },
  ],

  'espanha-estudo': [
    {
      titulo: 'Escolher o curso e a universidade',
      descricao:
        'Muitos cursos aceitam apenas pré-inscrição; outros exigem nota de corte.',
      fase: 'preparacao',
      prazo: 'semana 1',
      custo: 0,
    },
    {
      titulo: 'Conferir a equivalência de escolaridade',
      descricao:
        'Se a universidade exigir, o diploma brasileiro precisa ser homologado na España.',
      fase: 'preparacao',
      prazo: 'semana 1 a 3',
      custo: 0,
    },
    {
      titulo: 'Abrir conta e juntar a capacidade econômica',
      descricao:
        'Valor mantido conforme o curso e a duração; fica no consulado.',
      fase: 'preparacao',
      prazo: 'semana 1 a 3',
      custo: 0,
    },
    {
      titulo: 'Traduz e apostilar documentos',
      descricao: 'Sworn translator em espanhol, com cartório.',
      fase: 'documentos',
      prazo: 'semana 3 a 5',
      custo: 800,
    },
    {
      titulo: 'Seguro médico privado',
      descricao:
        'Cobertura mínima exigida, válida para todo o território espanhol.',
      fase: 'documentos',
      prazo: 'semana 5',
      custo: 1_400,
    },
    {
      titulo: 'Extratos e comprovante de moradia',
      descricao:
        'Moradia na Espanha ou responsável, com contrato ou declaração.',
      fase: 'documentos',
      prazo: 'semana 5 a 6',
      custo: 0,
    },
    {
      titulo: 'Preencher o formulário e pagar a taxa',
      descricao: 'Pedido no consulado, presencialmente na maioria dos casos.',
      fase: 'aplicacao',
      prazo: 'semana 7',
      custo: 900,
    },
    {
      titulo: 'Entrevista consular',
      descricao:
        'Leve passaporte, CAS ou credencial, comprovante financeiro e seguro.',
      fase: 'aplicacao',
      prazo: 'semana 7 a 8',
      custo: 0,
    },
    {
      titulo: 'Aguardar o visto de entrada',
      descricao: 'O prazo costuma ser de 15 a 45 dias úteis.',
      fase: 'aguardando',
      prazo: 'após aprovação',
      custo: 0,
    },
    {
      titulo: 'Comprar passagem aérea',
      descricao: 'Só depois do visto. A passagem não é exigida no pedido.',
      fase: 'depois',
      prazo: 'após aprovação',
      custo: 5_000,
    },
    {
      titulo: 'Registro na foreigners e matrícula',
      descricao: 'Obtenha o NIE/TIE e finalize a matrícula.',
      fase: 'depois',
      prazo: 'até 30 dias após chegar',
      custo: 600,
    },
  ],

  'espanha-digital-nomad': [
    {
      titulo: 'Fechar o contrato remoto',
      descricao:
        'A Spain exige vínculo formal: CLT, PJ ou prestador com cliente fora do país.',
      fase: 'preparacao',
      prazo: 'semana 1',
      custo: 0,
    },
    {
      titulo: 'Provar renda de 2,5x o salário mínimo',
      descricao:
        'Extratos dos últimos 3 meses mostrando a renda entrando na conta.',
      fase: 'preparacao',
      prazo: 'semana 1 a 2',
      custo: 0,
    },
    {
      titulo: 'Abrir conta para os documentos',
      descricao: 'Ter conta bancária em nome próprio facilita a prova de recursos.',
      fase: 'preparacao',
      prazo: 'semana 1',
      custo: 0,
    },
    {
      titulo: 'Contratar seguro médico',
      descricao: 'Seguro privado com cobertura em toda a Europa.',
      fase: 'documentos',
      prazo: 'semana 2',
      custo: 1_800,
    },
    {
      titulo: 'Comprovante de endereço na Espanha',
      descricao:
        'Aluguel, airbnb ou hospedagem com contrato válido.',
      fase: 'documentos',
      prazo: 'semana 2 a 3',
      custo: 4_500,
    },
    {
      titulo: 'Contrato de trabalho e nota fiscal',
      descricao:
        'Prova de que a atividade é exercida remotamente para fora da Espanha.',
      fase: 'documentos',
      prazo: 'semana 3',
      custo: 0,
    },
    {
      titulo: 'Passaporte com 6 meses de validade',
      descricao: 'Verifique também o visto de saída do Brasil.',
      fase: 'documentos',
      prazo: 'semana 1',
      custo: 300,
    },
    {
      titulo: 'Pedir a autorização de residência',
      descricao: 'Formulário na sede consular da região onde vai morar.',
      fase: 'aplicacao',
      prazo: 'semana 4',
      custo: 900,
    },
    {
      titulo: 'Entrevista e entrega de documentos',
      descricao: 'Envie tudo junto e guarde o comprovante de protocolo.',
      fase: 'aplicacao',
      prazo: 'semana 4 a 5',
      custo: 0,
    },
    {
      titulo: 'Regularizar na Nonetheless uro',
      descricao: 'Depois de chegar: alta na Segurança Social e emissão do TIE.',
      fase: 'depois',
      prazo: 'até 30 dias após chegar',
      custo: 700,
    },
  ],
};

/** Lista de itens da rota, na ordem em que devem ser feitos. */
export function itensDaRota(slug: string): ItemPlano[] {
  return (checklists[slug] ?? []).map(({ ...item }) => item);
}

/** Agrupa por fase, na ordem das cinco fases. Sempre devolve as 5 fases. */
export function agruparPorFase(itens: ItemPlano[]): { fase: FasePlano; nome: string; itens: ItemPlano[] }[] {
  return FASES.map(({ id, nome }) => ({
    fase: id,
    nome,
    itens: itens.filter((i) => i.fase === id),
  }));
}

export const moeda = (v: number) => (v === 0 ? 'Sem custo' : `R$ ${v.toLocaleString('pt-BR')}`);