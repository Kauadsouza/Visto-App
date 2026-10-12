/**
 * =============================================================
 * Chat com a base local
 * =============================================================
 *
 * Sem LLM, sem servidor. O motor está em src/lib/ia.ts: para cada
 * pergunta, devolve a melhor resposta (regex + score) com fontes.
 *
 * Se um dia houver Edge Function, é substituir `consultarIA` por uma
 * chamada ao backend. A forma do retorno continua a mesma:
 * { texto, fontes, confianca }.
 * =============================================================
 */

import { consultarIA, type RespostaIA } from '@/lib/ia';

export type Papel = 'usuario' | 'assistente';

export interface Mensagem {
  id: string;
  papel: Papel;
  texto: string;
  /** Epoch ms */
  criadoEm: number;
  /** Carregando streaming no momento. */
  carregando?: boolean;
  /** Fontes citadas pela IA na resposta. */
  fontes?: string[];
  /** Nível de confiança (0-1). Abaixo de 0.3 não apareceu intent. */
  confianca?: number;
}

/**
 * A camada 1 (Assistente) é a vitrine do produto: ela não pode expirar no
 * meio de uma conversa. Não há cota de mensagens — o que limita é o
 * `TAMANHO_MAX_INPUT` por mensagem e o Motor local, que não custa nada.
 *
 * A cota vive na camada 2 (Consultoria por IA), onde há trabalho de verdade
 * por trás da resposta.
 */
export const LIMITE_MENSAGENS_DIA = Number.POSITIVE_INFINITY;
export const TAMANHO_MAX_INPUT = 1500;

export interface LimiteUltrapassado {
  ok: false;
  motivo: 'limite-diario' | 'input-invalido' | 'muito-longo' | 'sem-conta';
  mensagem: string;
}
export interface Permissao {
  ok: true;
  restantes: number;
}
export type Resultado = Permissao | LimiteUltrapassado;

/** Valida o que a pessoa digitou. */
export function validarInput(texto: string): Resultado {
  const t = texto.trim();
  if (t.length === 0) {
    return { ok: false, motivo: 'input-invalido', mensagem: 'A mensagem está vazia.' };
  }
  if (t.length > TAMANHO_MAX_INPUT) {
    return {
      ok: false,
      motivo: 'muito-longo',
      mensagem: `Limite de ${TAMANHO_MAX_INPUT} caracteres.`,
    };
  }
  return { ok: true, restantes: LIMITE_MENSAGENS_DIA };
}

/** Conta quantas mensagens o usuário mandou hoje. */
export function mensagensHoje(historico: Mensagem[]): number {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);
  const ts = inicioDoDia.getTime();
  return historico.filter((m) => m.papel === 'usuario' && m.criadoEm >= ts).length;
}

/** Envia a pergunta para a IA local e devolve a resposta. */
export function enviarMensagem(_historico: Mensagem[], input: string): Mensagem {
  // Simula latência só para a UI mostrar o estado "carregando" brevemente.
  const resposta: RespostaIA = consultarIA(input);

  return {
    id: `${Date.now()}`,
    papel: 'assistente',
    texto: resposta.texto,
    criadoEm: Date.now(),
    fontes: resposta.fontes,
    confianca: resposta.confianca,
  };
}