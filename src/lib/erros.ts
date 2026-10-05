/**
 * Tradução dos erros do Supabase para português.
 *
 * A mensagem crua do Supabase é em inglês e genérica ("Invalid login
 * credentials"), e não diz o que a pessoa deve fazer. Aqui cada caso vira
 * uma instrução concreta.
 */

export function traduzirErroAuth(mensagem: string | undefined): string {
  if (!mensagem) return 'Não foi possível continuar. Tente de novo.';

  const m = mensagem.toLowerCase();

  if (m.includes('invalid login credentials')) {
    return 'Email ou senha incorretos.';
  }

  // A mensagem mais útil do fluxo: o email é válido, só não tem conta.
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'Esse email já tem conta. Faça login ou use outro email.';
  }

  if (m.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar. Veja a caixa de entrada.';
  }

  if (m.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  if (m.includes('unable to validate email') || m.includes('invalid email')) {
    return 'Esse email não parece válido.';
  }

  if (m.includes('user not found')) {
    return 'Esse email não tem conta. Quer criar uma?';
  }

  if (
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('fetch failed')
  ) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }

  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Muitas tentativas em pouco tempo. Espere um minuto e tente de novo.';
  }

  if (m.includes('popup closed') || m.includes('cancelled') || m.includes('canceled')) {
    return 'Login cancelado.';
  }

  return 'Não foi possível continuar. Tente de novo.';
}

/** Mensagem de erro já pronta para exibir, a partir de qualquer `throw` do Supabase. */
export function mensagemDe(e: unknown): string {
  if (e instanceof Error) return traduzirErroAuth(e.message);
  if (typeof e === 'string') return traduzirErroAuth(e);
  return traduzirErroAuth((e as { message?: string } | null)?.message);
}