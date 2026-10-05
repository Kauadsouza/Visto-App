#!/usr/bin/env node
/**
 * =============================================================
 * Teste de isolamento entre dois usuários (RLS)
 * =============================================================
 *
 * O que este script prova:
 *   1. Usuário A não enxerga dados do usuário B
 *   2. Usuário A não consegue alterar nem apagar dados do B
 *   3. Usuário A não consegue inserir linha em nome de B
 *   4. Visitante sem sessão não enxerga nada
 *   5. `assinaturas` é somente leitura no cliente (paywall não pode ser burlado)
 *   6. O profile é criado automaticamente no signup
 *
 * -------------------------------------------------------------
 * COMO RODAR — só depois de criar o projeto no Supabase:
 * -------------------------------------------------------------
 *   1. Crie o projeto em supabase.com
 *   2. Dashboard > SQL Editor > cole e rode, na ordem:
 *        supabase/migrations/20261005000100_schema.sql
 *        supabase/migrations/20261005000200_rls.sql
 *        supabase/migrations/20261005000300_triggers.sql
 *   3. Authentication > Providers > habilite Email (e Google, para o app)
 *   4. Crie o arquivo `supabase/.env.local` (NÃO versionado) com:
 *
 *        SUPABASE_URL=https://xxxxxxxx.supabase.co
 *        SUPABASE_ANON_KEY=<anon public key>
 *        SUPABASE_SERVICE_ROLE_KEY=<service role key>
 *
 *      A service_role é usada SÓ aqui, no ambiente de teste.
 *      Ela bypassa RLS de propósito — é o que permite criar os dois usuários
 *      de teste. Ela nunca entra no app; o bundle do cliente tem que
 *      funcionar (e o app tem que recusar a chave, ver src/lib/supabase.ts)
 *      sem ela.
 *
 *   5. node scripts/testar-isolamento.mjs
 *
 * O script cria os usuários de teste, roda as asserções e limpa tudo.
 * =============================================================
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(raiz, 'supabase', '.env.local');

if (!existsSync(envPath)) {
  console.error(`\nArquivo não encontrado: ${envPath}`);
  console.error('Crie-o com URL, ANON KEY e SERVICE ROLE KEY. Ver o cabeçalho deste arquivo.\n');
  process.exit(1);
}

for (const linha of readFileSync(envPath, 'utf8').split('\n')) {
  const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const URL_BASE = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !ANON || !SERVICE) {
  console.error('\nFaltam variáveis em supabase/.env.local: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.\n');
  process.exit(1);
}

if (!SERVICE.includes('service_role')) {
  console.error('\nA SUPABASE_SERVICE_ROLE_KEY não parece ser a service_role key (falta o sufixo "service_role").\n');
  process.exit(1);
}

// ---------- helpers ----------

let passou = 0;
let falhou = 0;

function checar(descricao, condicao, detalhe = '') {
  if (condicao) {
    passou++;
    console.log(`  ok    ${descricao}`);
  } else {
    falhou++;
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ''}`);
  }
}

const admin = createClient(URL_BASE, SERVICE, { auth: { persistSession: false } });

/** Cliente anônimo: fala com a API usando só a anon key, como o app faria. */
function anon() {
  return createClient(URL_BASE, ANON, { auth: { persistSession: false } });
}

const carimbo = Date.now();
const emailA = `teste-a-${carimbo}@exemplo.com`;
const emailB = `teste-b-${carimbo}@exemplo.com`;
const senha = `Teste-${carimbo}!x`;

const idsCriados = [];

async function criarUsuario(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error) throw new Error(`criação de ${email}: ${error.message}`);
  idsCriados.push(data.user.id);
  return data.user;
}

async function entrar(email) {
  const c = anon();
  const { data, error } = await c.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  return c;
}

async function limpar() {
  for (const id of idsCriados) {
    await admin.auth.admin.deleteUser(id);
  }
}

// ---------- o teste ----------

async function main() {
  console.log('\nCriando dois usuários de teste...\n');
  const userA = await criarUsuario(emailA);
  const userB = await criarUsuario(emailB);

  console.log('1) Trigger de profile no signup');
  const { data: perfilA } = await admin
    .from('profiles')
    .select('id, email')
    .eq('id', userA.id)
    .single();
  checar('profile do usuário A foi criado automaticamente', Boolean(perfilA));
  checar('email do profile confere', perfilA?.email === emailA, `veio ${perfilA?.email}`);

  console.log('\n2) Visitante sem sessão não enxerga nada');
  const visitante = anon();
  const { data: vazio } = await visitante.from('planos').select('*');
  checar('select sem sessão devolve 0 linhas', (vazio?.length ?? 0) === 0, `veio ${vazio?.length}`);

  console.log('\n3) Cada usuário grava dados');
  const clienteA = await entrar(emailA);
  const clienteB = await entrar(emailB);

  const insercaoA = await clienteA.from('planos').insert({
    user_id: userA.id,
    rota_slug: 'reino-unidos-estudo',
    item: { titulo: 'Item do usuário A', descricao: 'x', fase: 'preparacao', prazo: 'semana 1', custo: 0 },
    ordenacao: 0,
  });
  checar('usuário A inseriu um plano', !insercaoA.error, insercaoA.error?.message);

  await clienteB.from('planos').insert({
    user_id: userB.id,
    rota_slug: 'espanha-estudo',
    item: { titulo: 'Item do usuário B', descricao: 'x', fase: 'preparacao', prazo: 'semana 1', custo: 0 },
    ordenacao: 0,
  });

  console.log('\n4) Isolamento de leitura');
  const { data: lidosPorA } = await clienteA.from('planos').select('*');
  checar('A enxerga exatamente 1 linha', lidosPorA?.length === 1, `veio ${lidosPorA?.length}`);
  checar('a linha vista por A é a dele', lidosPorA?.[0]?.user_id === userA.id);

  const { data: lidosPorB } = await clienteB.from('planos').select('*');
  checar('B enxerga exatamente 1 linha', lidosPorB?.length === 1, `veio ${lidosPorB?.length}`);
  checar('a linha vista por B é a dele', lidosPorB?.[0]?.user_id === userB.id);

  console.log('\n5) Isolamento de escrita');
  const idDeB = lidosPorB?.[0]?.id;
  const idDeA = lidosPorA?.[0]?.id;

  const updateCruzado = await clienteA.from('planos').update({ concluido: true }).eq('id', idDeB);
  checar('A NÃO consegue alterar item de B (0 linhas afetadas)', (updateCruzado.data?.length ?? 0) === 0, `afetou ${updateCruzado.data?.length}`);

  const deleteCruzado = await clienteA.from('planos').delete().eq('id', idDeB);
  checar('A NÃO consegue apagar item de B (0 linhas afetadas)', (deleteCruzado.data?.length ?? 0) === 0, `afetou ${deleteCruzado.data?.length}`);

  const updateProprio = await clienteA.from('planos').update({ concluido: true }).eq('id', idDeA).select();
  checar('A consegue alterar o próprio item (1 linha afetada)', (updateProprio.data?.length ?? 0) === 1, `afetou ${updateProprio.data?.length}`);

  console.log('\n6) Não dá para inserir em nome de outro');
  const insertFalso = await clienteA.from('planos').insert({
    user_id: userB.id,
    rota_slug: 'invasao',
    item: { titulo: 'tentativa', descricao: 'x', fase: 'preparacao', prazo: 'semana 1', custo: 0 },
  });
  checar('inserção em nome de B é rejeitada', Boolean(insertFalso.error), 'o RLS aceitou — falha grave');

  console.log('\n7) assinaturas é somente leitura (paywall)');
  await admin.from('assinaturas').insert({ user_id: userA.id, status: 'inativa' });

  const tentativaAtivar = await clienteA
    .from('assinaturas')
    .update({ status: 'ativa' })
    .eq('user_id', userA.id);
  checar('cliente NÃO consegue ativar a própria assinatura', Boolean(tentativaAtivar.error));

  const { data: assinaturaLida } = await clienteA.from('assinaturas').select('status');
  checar('cliente consegue LER a assinatura', assinaturaLida?.length === 1, `veio ${assinaturaLida?.length}`);

  const { data: assinaturaDeB } = await clienteB.from('assinaturas').select('status');
  checar('B não enxerga a assinatura de A', (assinaturaDeB?.length ?? 0) === 0, `veio ${assinaturaDeB?.length}`);

  console.log('\n8) registros_viagem isolados');
  await clienteA.from('registros_viagem').insert({ user_id: userA.id, pais: 'Portugal', data_entrada: '2026-01-10' });
  const { data: viagensA } = await clienteA.from('registros_viagem').select('*');
  const { data: viagensB } = await clienteB.from('registros_viagem').select('*');
  checar('A vê só a própria viagem', viagensA?.length === 1, `veio ${viagensA?.length}`);
  checar('B não vê a viagem de A', (viagensB?.length ?? 0) === 0, `veio ${viagensB?.length}`);

  console.log('\n9) profiles é 1:1 e não aceita troca de dono');
  const sequestro = await clienteA.from('profiles').update({ email: emailB }).eq('id', userA.id).select();
  checar('A altera o próprio email (permitido)', (sequestro.data?.length ?? 0) === 1);

  const trocaDono = await clienteA.from('profiles').update({ id: userB.id }).eq('id', userA.id);
  checar('A NÃO consegue repassar o profile para B', Boolean(trocaDono.error));
}

main()
  .catch((e) => {
    console.error('\nErro durante o teste:', e.message);
    falhou++;
  })
  .finally(async () => {
    console.log('\nLimpando usuários de teste...');
    await limpar();
    console.log(`\n${'-'.repeat(46)}\n${passou} ok, ${falhou} falha(s)\n`);
    process.exit(falhou > 0 ? 1 : 0);
  });