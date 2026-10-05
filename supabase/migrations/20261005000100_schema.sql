-- =============================================================
-- Visto — 001: schema base
-- Tabelas do MVP. Todas com `user_id` amarrado em public.profiles,
-- que por sua vez é 1:1 com auth.users.
-- =============================================================

-- ---------- profiles ----------
-- Guardamos as respostas do questionário e o diagnóstico aqui.
-- `respostas` e `diagnostico` são jsonb porque o formato evolui com o app;
-- a validação do conteúdo acontece no cliente (ver src/lib/questionario.ts).
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nome        text,
  respostas   jsonb not null default '{}'::jsonb,
  diagnostico jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados do usuário: perfil, respostas do questionário e resultado do diagnóstico.';

-- ---------- planos ----------
-- Um item de checklist por linha. `item` guarda { titulo, descricao, fase, prazo, custo }.
create table public.planos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rota_slug   text not null,
  item        jsonb not null,
  concluido   boolean not null default false,
  ordenacao   integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.planos is 'Checklist do plano, um item por linha, agrupado por fase.';

-- ---------- assinaturas ----------
-- status controlado pelo servidor (Edge Function / webhook), nunca pelo app.
-- Para o MVP o app só LÊ esta tabela; a escrita fica com o backend.
create table public.assinaturas (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text not null default 'inativa',
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),

  constraint assinaturas_status_check
    check (status in ('inativa', 'ativa', 'cancelada', 'inadimplente'))
);

comment on column public.assinaturas.status is 'inativa | ativa | cancelada | inadimplente. Escrita apenas pelo servidor.';

-- ---------- registros_viagem ----------
-- Base do contador de dias (permanência e blocos Schengen 90/180).
create table public.registros_viagem (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  pais        text not null,
  data_entrada date not null,
  data_saida   date,
  created_at  timestamptz not null default now(),

  -- Não faz sentido sair antes de entrar.
  constraint registros_viagem_datas_check
    check (data_saida is null or data_saida >= data_entrada)
);

comment on table public.registros_viagem is 'Entradas e saídas do usuário por país, para cálculo de permanência.';

-- =============================================================
-- Índices
-- Toda consulta do app filtra por user_id, então ele precisa de índice.
-- =============================================================
create index planos_user_id_idx            on public.planos (user_id);
create index planos_user_rota_idx          on public.planos (user_id, rota_slug);
create index assinaturas_user_id_idx       on public.assinaturas (user_id);
create index registros_viagem_user_id_idx  on public.registros_viagem (user_id);
create index registros_viagem_entrada_idx  on public.registros_viagem (user_id, data_entrada desc);

-- Uma assinatura ativa por usuário: evita duplicar cobrança no polling.
create unique index assinaturas_user_unica_idx
  on public.assinaturas (user_id);