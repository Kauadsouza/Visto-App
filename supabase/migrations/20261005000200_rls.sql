-- =============================================================
-- Visto — 002: Row Level Security
--
-- CRÍTICO: sem isto o app está aberto — qualquer pessoa com a anon key
-- consegue ler e escrever os dados de qualquer usuário.
--
-- Convenção do Supabase: usar `(select auth.uid())` em vez de `auth.uid()`.
-- O `select` faz o planner avaliar a função uma vez por query em vez de uma
-- vez por linha. Em tabelas com muitas linhas a diferença é grande.
-- =============================================================

alter table public.profiles         enable row level security;
alter table public.planos           enable row level security;
alter table public.assinaturas      enable row level security;
alter table public.registros_viagem enable row level security;

-- ---------- profiles ----------
-- A chave primária já é o id do usuário, então `auth.uid() = id` basta.
create policy "user_isolation" on public.profiles
  for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------- planos ----------
create policy "user_isolation" on public.planos
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- assinaturas ----------
-- SOMENTE LEITURA.
--
-- Por que: o status da assinatura decide se o paywall libera o plano. Se o app
-- pudesse escrever aqui, bastaria um `update` para liberar o conteúdo pago —
-- o controle de acesso inteiro vira decoração.
--
-- A escrita acontece no servidor (Edge Function com service_role na fase 2,
-- que contorna RLS por ser server-side). Para o MVP, o status é liberado
-- manualmente pelo admin no dashboard do Supabase.
create policy "user_isolation" on public.assinaturas
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------- registros_viagem ----------
create policy "user_isolation" on public.registros_viagem
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));