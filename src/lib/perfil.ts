/**
 * =============================================================
 * Perfil do cliente
 * =============================================================
 *
 * O app não fala com "o usuário" — fala com uma pessoa que tem nome, destino
 * e uma situação. Este arquivo é o lugar onde as respostas do questionário
 * viram leitura humana: para onde ela vai, com que dinheiro, e o que ainda
 * atrapalha.
 *
 * Tudo aqui é derivado, nunca guardado. Se o questionário muda, o perfil muda
 * junto — não existe cópia para ficar desatualizada.
 * =============================================================
 */

import { diagnosticar, type Rota } from '@/lib/diagnostico';
import type { Respostas } from '@/lib/perguntas';

/** Destino extraído do slug da rota. */
export interface Destino {
  pais: string;
  nome: string;
  /** Frase curta que abre a tela da conta. */
  abertura: string;
}

const DESTINOS: Record<string, Destino> = {
  'reino-unidos-estudo': {
    pais: 'Reino Unido',
    nome: 'Inglaterra',
    abertura: 'Seu caminho para a Inglaterra está montado.',
  },
  'espanha-estudo': {
    pais: 'Espanha',
    nome: 'Espanha',
    abertura: 'Seu caminho para a Espanha está montado.',
  },
  'espanha-digital-nomad': {
    pais: 'Espanha',
    nome: 'Espanha',
    abertura: 'Seu caminho para a Espanha está montado.',
  },
};

/** Rota recomendada, ou null se o questionário não foi concluído. */
export function rotaRecomendada(respostas: Respostas): Rota | null {
  const d = diagnosticar(respostas);
  return d.completo ? d.rotas[0] : null;
}

export function destinoDe(rota: Rota | null): Destino | null {
  return rota ? DESTINOS[rota.slug] ?? null : null;
}

/** Primeira letra do nome, para o avatar. */
export function inicial(nome: string | undefined): string {
  const limpo = (nome ?? '').trim();
  return limpo ? limpo[0].toUpperCase() : '?';
}

/** A primeira linha do nome, para o tratamento no cabeçalho. */
export function primeiroNome(nome: string | undefined): string {
  return (nome ?? '').trim().split(/\s+/)[0] ?? '';
}

/**
 * O que está liberado no plano gratuito, e o que cada camada destrava.
 *
 * A lista é a mesma que aparece em /pagamento, mas curta: aqui o objetivo é
 * lembrar o que já é dela, não vender. Vender é o trabalho da tela de
 * consultoria.
 */
export const CAMADAS = [
  {
    chave: 'gratuito',
    titulo: 'Seu diagnóstico',
    preco: 'Grátis',
    descricao: 'As três rotas, a viabilidade de cada uma e o checklist do começo.',
    destrava: [
      'Diagnóstico completo com as 3 rotas',
      'Contador de dias no país e no bloco Schengen',
      'Primeiros passos de cada rota',
      'Assistente de IA para dúvidas',
    ],
  },
  {
    chave: 'ia',
    titulo: 'Consultoria por IA',
    preco: 'R$ 89/mês',
    descricao:
      'O agente estuda o seu perfil inteiro e monta um plano sob medida, com documentos, prazos e custo somado.',
    destrava: [
      'Tudo do plano gratuito',
      'Plano montado pelo agente a partir das suas respostas',
      'Checklist completo, sem travar',
      'Contadores de entrada e saída',
      'Conversa com o agente sabendo do seu plano',
    ],
  },
  {
    chave: 'humano',
    titulo: 'Consultoria humana',
    preco: 'R$ 290+',
    descricao:
      'Um consultor que revisa tudo com você, responde o que a IA não responde, e entra na sua call.',
    destrava: [
      'Tudo da consultoria por IA',
      'Call marcada com consultor de imigração',
      'Leitura crítica do seu caso específico',
      'Revisão de cada formulário antes de enviar',
    ],
  },
] as const;