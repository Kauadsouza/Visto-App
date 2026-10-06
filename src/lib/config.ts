/**
 * Interruptores de modo do app.
 *
 * MODO_SEM_BACKEND existe porque o Supabase ainda não foi criado. Enquanto ele
 * for `true`, o questionário e o resultado funcionam só com estado local
 * (persistido no AsyncStorage) e o guardião de rota deixa passar para essas
 * telas sem sessão.
 *
 * Quando o projeto no Supabase existir:
 *   1. rode as migrations em supabase/migrations/
 *   2. preencha o .env
 *   3. troque MODO_SEM_BACKEND para false
 *
 * Nada mais precisa mudar: as telas já leem do mesmo store.
 */
export const MODO_SEM_BACKEND = true;

/** Conta a pessoa pelo teste de rate limit descrito no README. */
export const PRECO_MENSAL = 'R$ 29,90';