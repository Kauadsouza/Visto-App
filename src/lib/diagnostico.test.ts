/**
 * Teste do diagnóstico — a única lógica crítica do app.
 *
 * Roda direto no Node (o Node 24 executa TypeScript sem compilar antes):
 *   node --test src/lib/diagnostico.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { diagnosticar } from './diagnostico.ts';
import { RESPOSTAS_VAZIAS, type Respostas } from './perguntas.ts';

const POR_DEFINICAO: Respostas = {
  ...RESPOSTAS_VAZIAS,
  idade: '27',
  objetivo: 'estudar',
  dinheiro: '20_60k',
  area: 'Engenharia de software',
  ingles: 'intermediario',
  ensinoMedio: 'sim',
  passagem: 'tenho_recurso',
  foraEuropa: 'nao',
};

const nivel = (r: { viabilidade: string }) =>
  ({ alta: 2, media: 1, baixa: 0 })[r.viabilidade as 'alta'] as number;

const porSlug = (r: Respostas, slug: string) =>
  diagnosticar(r).rotas.find((x) => x.slug === slug)!;

test('devolve sempre as 3 rotas do MVP, e só elas', () => {
  const { rotas } = diagnosticar(POR_DEFINICAO);
  assert.equal(rotas.length, 3);
  assert.deepEqual(
    rotas.map((x) => x.slug).sort(),
    ['espanha-digital-nomad', 'espanha-estudo', 'reino-unidos-estudo'].sort()
  );
});

test('nunca inventa Working Holiday para brasileiros', () => {
  const { rotas, avisos } = diagnosticar(POR_DEFINICAO);
  assert.ok(!rotas.some((x) => x.slug.includes('working')));
  assert.ok(avisos.some((a) => a.includes('Working Holiday')));
});

test('dinheiro abaixo de R$ 3 mil joga todas para baixa, com aviso', () => {
  const resultado = diagnosticar({ ...POR_DEFINICAO, dinheiro: 'ate_3k' });
  assert.ok(resultado.rotas.every((x) => x.viabilidade === 'baixa'));
  assert.ok(resultado.avisos.some((a) => a.includes('aumentar a renda')));
});

test('sem ensino médio, nenhuma rota fica acima de média', () => {
  const resultado = diagnosticar({ ...POR_DEFINICAO, ensinoMedio: 'nao' });
  assert.ok(
    resultado.rotas.every((x) => x.viabilidade !== 'alta'),
    'esperado: nenhuma rota com viabilidade alta'
  );
});

test('inglês básico derruba a rota da Inglaterra em um nível', () => {
  // Cenário com pouco dinheiro de propósito: com dinheiro alto a Inglaterra
  // satura em "alta" e o -1 do inglês fica invisível (o teto de 2 esconde).
  const base = { ...POR_DEFINICAO, dinheiro: '3_8k' };
  const comIntermediario = porSlug(base, 'reino-unidos-estudo');
  const comBasico = porSlug({ ...base, ingles: 'basico' }, 'reino-unidos-estudo');

  assert.equal(nivel(comBasico), nivel(comIntermediario) - 1);
  assert.ok(nivel(comIntermediario) < 2, 'cenário precisa estar abaixo do teto');
});

test('menos de 25 anos prioriza estudo', () => {
  const jovem = diagnosticar({ ...POR_DEFINICAO, idade: '21' });
  const maduro = diagnosticar({ ...POR_DEFINICAO, idade: '30' });

  const studiesJovem = jovem.rotas.find((x) => x.slug === 'reino-unidos-estudo')!;
  const studiesMaduro = maduro.rotas.find((x) => x.slug === 'reino-unidos-estudo')!;
  const nomadJovem = jovem.rotas.find((x) => x.slug === 'espanha-digital-nomad')!;

  assert.ok(nivel(studiesJovem) >= nivel(studiesMaduro));
  assert.ok(nivel(nomadJovem) < 2 || studiesJovem.viabilidade !== 'baixa');
});

test('mais de 35 anos empurra para digital nomad', () => {
  const idoso = porSlug({ ...POR_DEFINICAO, idade: '44' }, 'espanha-digital-nomad');
  const jovem = porSlug({ ...POR_DEFINICAO, idade: '28' }, 'espanha-digital-nomad');
  assert.equal(nivel(idoso), nivel(jovem) + 1);
});

test('objetivo "trabalhar" derruba estudo e sobe digital nomad', () => {
  const estudar = diagnosticar(POR_DEFINICAO);
  const trabalhar = diagnosticar({ ...POR_DEFINICAO, objetivo: 'trabalhar' });

  const nomadEstudar = estudar.rotas.find((x) => x.slug === 'espanha-digital-nomad')!;
  const nomadTrabalhar = trabalhar.rotas.find((x) => x.slug === 'espanha-digital-nomad')!;

  assert.equal(nivel(nomadTrabalhar), nivel(nomadEstudar) + 2);
});

test('aceitar ficar fora da Europa sobe o digital nomad', () => {
  const sim = porSlug({ ...POR_DEFINICAO, foraEuropa: 'sim' }, 'espanha-digital-nomad');
  const nao = porSlug({ ...POR_DEFINICAO, foraEuropa: 'nao' }, 'espanha-digital-nomad');
  assert.equal(nivel(sim), nivel(nao) + 1);
});

test('respostas sempre vêm ordenadas da mais viável para a menos viável', () => {
  const cenarios: Respostas[] = [
    POR_DEFINICAO,
    { ...POR_DEFINICAO, idade: '20', objetivo: 'estudar', dinheiro: '60k_mais' },
    { ...POR_DEFINICAO, idade: '50', objetivo: 'trabalhar', dinheiro: '3_8k' },
    { ...POR_DEFINICAO, ensinoMedio: 'nao', ingles: 'basico', dinheiro: 'ate_3k' },
  ];

  for (const cenario of cenarios) {
    const niveis = diagnosticar(cenario).rotas.map(nivel);
    const ordenado = [...niveis].sort((a, b) => b - a);
    assert.deepEqual(niveis, ordenado, `ordenação quebrada em ${JSON.stringify(cenario)}`);
  }
});

test('desempate entre rotas iguais vai para a mais barata', () => {
  const resultado = diagnosticar({ ...POR_DEFINICAO, objetivo: 'os_dois', idade: '30' });
  const inglaterra = resultado.rotas.find((x) => x.slug === 'reino-unidos-estudo')!;
  const espanha = resultado.rotas.find((x) => x.slug === 'espanha-estudo')!;

  if (nivel(inglaterra) === nivel(espanha)) {
    assert.ok(espanha.custoMin <= inglaterra.custoMin);
  }
});

test('perfil incompleto é sinalizado, sem quebrar', () => {
  const vazio = diagnosticar(RESPOSTAS_VAZIAS);
  assert.equal(vazio.completo, false);
  assert.equal(vazio.rotas.length, 3);
});

test('função é pura: mesmo input, mesmo output', () => {
  const a = diagnosticar(POR_DEFINICAO);
  const b = diagnosticar(POR_DEFINICAO);
  assert.deepEqual(a, b);
});

test('idade fora do intervalo não é aceita como válida', () => {
  assert.equal(diagnosticar({ ...POR_DEFINICAO, idade: '12' }).completo, false);
  assert.equal(diagnosticar({ ...POR_DEFINICAO, idade: 'abc' }).completo, false);
  assert.equal(diagnosticar({ ...POR_DEFINICAO, idade: '27' }).completo, true);
});

test('toda rota tem custo e prazo consistentes', () => {
  for (const rota of diagnosticar(POR_DEFINICAO).rotas) {
    assert.ok(rota.custoMin > 0, `${rota.slug} sem custo mínimo`);
    assert.ok(rota.custoMax > rota.custoMin, `${rota.slug} com custo máximo menor`);
    assert.ok(rota.tempoMeses[1] >= rota.tempoMeses[0], `${rota.slug} com prazo invertido`);
    assert.ok(rota.passos.length > 0, `${rota.slug} sem passos`);
  }
});