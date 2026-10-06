/**
 * =============================================================
 * Cliente da IA auxiliar
 * =============================================================
 *
 * Esqueleto do cliente. SEM BACKEND esta função não funciona de verdade.
 * O que existe aqui:
 *
 *   1. Validação de input e formato da mensagem
 *   2. Streaming de resposta (a Edge Function envia chunks em JSONL)
 *   3. Limite de 5 mensagens/dia por usuário
 *
 * O que entra na fase 2:
 *   - Edge Function `chat` que valida a assinatura e chama Claude
 *   - Persistência do histórico em `mensagens_chat` no Supabase
 *   - System prompt com fontes oficiais de imigração e regra "não
 *     invente"
 * =============================================================
 */

export type Papel = 'usuario' | 'assistente';

export interface Mensagem {
  id: string;
  papel: Papel;
  texto: string;
  /** Epoch ms */
  criadoEm: number;
  /** Carregando streaming no momento. */
  carregando?: boolean;
}

export interface LimiteUltrapassado {
  ok: false;
  motivo: 'limite-diario' | 'sem-assinatura' | 'input-invalido' | 'muito-longo';
  mensagem: string;
}
export interface Permissao {
  ok: true;
  restantes: number;
}
export type Resultado = Permissao | LimiteUltrapassado;

const LIMITE_POR_DIA = 5;
const TAMANHO_MAX_INPUT = 1500;

/** Valida o que a pessoa digitou antes de mandar para a Edge Function. */
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
  return { ok: true, restantes: LIMITE_POR_DIA };
}

export const LIMITE_MENSAGENS_DIA = LIMITE_POR_DIA;
export const TAMANHO_MAX = TAMANHO_MAX_INPUT;

/**
 * Placeholder da chamada. Quando a Edge Function existir, ela será o destino
 * desta Promise. Por enquanto devolve uma mensagem fixa, marcada como
 * `placeholder: true` para a UI deixar claro que não é resposta de IA.
 */
export async function enviarMensagem(
  _historico: Mensagem[],
  _input: string
): Promise<Mensagem> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    id: `${Date.now()}`,
    papel: 'assistente',
    texto:
      'A IA auxiliar entra na próxima fase. Por enquanto eu sou um placeholder ' +
      '— o esqueleto do chat está pronto, falta o backend.',
    criadoEm: Date.now(),
  };
}