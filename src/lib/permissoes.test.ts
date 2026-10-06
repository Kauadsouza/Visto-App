/**
 * Teste do contador de dias.
 *
 * A aritmética de janela móvel é o tipo de código que não dá erro visível:
 * um `+1` fora de lugar só apareceria como "90 dias" quando a pessoa já
 * estourou o limite. Por isso vale testar.
 *
 * Roda no Node: node --test src/lib/permissoes.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcularContador, ehSchengen, emAnos, META_RESIDENCIA_DIAS } from './permissoes.ts';

const hoje = (iso: string) => new Date(iso + 'T12:00:00Z');

test('lista de Schengen reconhece os países, com e sem acento', () => {
  assert.equal(ehSchengen('Portugal'), true);
  assert.equal(ehSchengen('portugal'), true);
  assert.equal(ehSchengen('Espanha'), true);
  assert.equal(ehSchengen('Suíça'), true);
  assert.equal(ehSchengen('Estados Unidos'), false);
  assert.equal(ehSchengen('Brasil'), false);
  assert.equal(ehSchengen('Reino Unido'), false);
});

test('sem registros, tudo zerado e 90 dias disponíveis', () => {
  const c = calcularContador([], hoje('2026-01-01'));
  assert.equal(c.diasNoPais, 0);
  assert.equal(c.diasSchengenUsados, 0);
  assert.equal(c.diasRestantesSchengen, 90);
  assert.equal(c.noLimiteSchengen, false);
  assert.equal(c.diaEntrada, null);
});

test('o dia da entrada conta como dia presente', () => {
  // Entrou hoje: zero dias decorridos, mas já consumiu um dia do bloco.
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2026-01-15', data_saida: null }],
    hoje('2026-01-15')
  );
  assert.equal(c.diasNoPais, 0);
  assert.equal(c.diasSchengenUsados, 1);
  assert.equal(c.diasRestantesSchengen, 89);
});

test('estada de 30 dias consome 31 dias do bloco (contagem inclusiva)', () => {
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2026-01-01', data_saida: null }],
    hoje('2026-01-31')
  );
  assert.equal(c.diasNoPais, 30);
  assert.equal(c.diasSchengenUsados, 31);
  assert.equal(c.diasRestantesSchengen, 59);
});

test('registro com saída fecha a estada', () => {
  const c = calcularContador(
    [{ pais: 'Espanha', data_entrada: '2026-01-01', data_saida: '2026-01-10' }],
    hoje('2026-02-01')
  );
  assert.equal(c.diasNoPais, 0);
  assert.equal(c.diasSchengenUsados, 10);
  assert.equal(c.diasRestantesSchengen, 80);
});

test('viagem fora do Schengen não consome o bloco', () => {
  const c = calcularContador(
    [
      { pais: 'Estados Unidos', data_entrada: '2026-01-01', data_saida: null },
    ],
    hoje('2026-01-31')
  );
  assert.equal(c.diasNoPais, 30);
  assert.equal(c.diasSchengenUsados, 0);
  assert.equal(c.diasRestantesSchengen, 90);
});

test('a janela móvel de 180 dias descarta o que já saiu', () => {
  // Entrou há 300 dias e continua lá. Só os últimos 180 dias contam.
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2025-06-01', data_saida: null }],
    hoje('2026-03-27')
  );
  // A janela é de 180 dias INCLUSIVOS (2025-09-29 até 2026-03-27), então uma
  // estada contínua preenche os 90 dias inteiros.
  assert.equal(c.diasSchengenUsados, 180);
  assert.equal(c.diasRestantesSchengen, 0);
  assert.equal(c.noLimiteSchengen, true);
});

test('múltiplas entradas somam no mesmo bloco', () => {
  const c = calcularContador(
    [
      { pais: 'Portugal', data_entrada: '2026-01-01', data_saida: '2026-01-10' },
      { pais: 'Espanha', data_entrada: '2026-01-20', data_saida: '2026-01-25' },
    ],
    hoje('2026-01-25')
  );
  assert.equal(c.diasSchengenUsados, 10 + 6);
  assert.equal(c.diasRestantesSchengen, 74);
});

test('no limite: sinaliza e projeta quando o bloco reabre', () => {
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2026-01-01', data_saida: null }],
    hoje('2026-03-31')
  );
  // 1/jan a 31/mar = 90 dias exatos.
  assert.equal(c.diasSchengenUsados, 90);
  assert.equal(c.noLimiteSchengen, true);
  assert.ok(c.liberaEm);
  assert.equal(c.liberaEm!.toISOString().slice(0, 10), '2026-06-30');
});

test('com saída registrada, não há país atual', () => {
  // `data_saida` preenchida significa que a pessoa já saiu: "dias no país
  // atual" é 0, e o bloco Schengen segue contando a estada consumida.
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2026-01-01', data_saida: '2026-01-11' }],
    hoje('2026-01-11')
  );
  assert.equal(c.diasNoPais, 0);
  assert.equal(c.diaEntrada, null);
  // O dia da saída conta como dia presente: 1 a 11 de janeiro são 11 dias.
  assert.equal(c.diasSchengenUsados, 11);
  assert.equal(c.diasRestantesSchengen, 79);
});

test('acumulado para residência é menor que a meta de 5 anos', () => {
  const c = calcularContador(
    [{ pais: 'Espanha', data_entrada: '2026-01-01', data_saida: null }],
    hoje('2026-01-31')
  );
  assert.equal(c.diasParaResidencia, 30);
  assert.equal(META_RESIDENCIA_DIAS, 1825);
  assert.ok(c.diasParaResidencia < c.diasMetaResidencia);
  assert.equal(emAnos(30), '0,1');
  assert.equal(emAnos(365), '1,0');
});

test('restantes nunca fica negativo', () => {
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2025-01-01', data_saida: null }],
    hoje('2026-06-01')
  );
  assert.equal(c.diasSchengenUsados, 180);
  assert.equal(c.diasRestantesSchengen, 0);
  assert.ok(c.diasRestantesSchengen >= 0);
});

test('registros com entrada futura não contam ainda', () => {
  const c = calcularContador(
    [{ pais: 'Portugal', data_entrada: '2026-06-01', data_saida: null }],
    hoje('2026-01-31')
  );
  assert.equal(c.diasSchengenUsados, 0);
  assert.equal(c.diasNoPais, 0);
});

test('só o registro em aberto conta como país atual', () => {
  const c = calcularContador(
    [
      { pais: 'Portugal', data_entrada: '2026-01-01', data_saida: '2026-01-05' },
      { pais: 'Espanha', data_entrada: '2026-01-06', data_saida: null },
    ],
    hoje('2026-01-16')
  );
  assert.equal(c.diasNoPais, 10);
});