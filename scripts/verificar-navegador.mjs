/**
 * Abre o app no Chrome headless e reporta o que aparece no console.
 *
 * Existe porque o bundle passar no `expo export` não prova que a tela abre:
 * erro de runtime só aparece executando o JavaScript no navegador. Aqui
 * conectamos no Chrome via CDP e ouvimos `Runtime.consoleAPICalled` e
 * `Runtime.exceptionThrown`.
 *
 * Uso: node .expo/verificar-navegador.mjs [url]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_APP = process.argv[2] ?? 'http://localhost:8081';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// Porta própria: não podemos derrubar o Chrome do usuário (taskkill fecha as
// abas dele), então cada verificação sobe a sua instância nesta porta.
const PORTA_CDP = process.argv[3] ?? '9333';

const perfil = mkdtempSync(join(tmpdir(), 'visto-chrome-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORTA_CDP}`,
  `--user-data-dir=${perfil}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=420,900',
  'about:blank',
], { stdio: 'ignore' });

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperarCDP() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORTA_CDP}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch {}
    await dormir(250);
  }
  throw new Error('Chrome não abriu a porta de debug');
}

function conectar(url) {
  return new Promise((resolver, rejeitar) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolver(ws);
    ws.onerror = (e) => rejeitar(new Error('falha no WebSocket: ' + e.message));
  });
}

const problemas = [];
const infos = [];

async function main() {
  const wsDebugger = await esperarCDP();
  const ws = await conectar(wsDebugger);

  let id = 0;
  const pendentes = new Map();
  let sessao = null;

  // O handler é ligado ANTES de qualquer comando: uma resposta que chega
  // antes disso é descartada e o await correspondente trava para sempre.
  ws.onmessage = (evento) => {
    const msg = JSON.parse(evento.data);

    if (msg.id && pendentes.has(msg.id)) {
      const { res, rej } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      return;
    }

    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      problemas.push('EXCEÇÃO: ' + (d.exception?.description ?? d.text));
    }

    if (msg.method === 'Runtime.consoleAPICalled') {
      const texto = msg.params.args
        .map((a) => a.value ?? a.description ?? '')
        .join(' ');
      if (msg.params.type === 'error' || msg.params.type === 'warning') {
        problemas.push(`CONSOLE ${msg.params.type.toUpperCase()}: ${texto}`);
      } else {
        infos.push(`${msg.params.type}: ${texto}`);
      }
    }

    if (msg.method === 'Log.entryAdded') {
      const e = msg.params.entry;
      if (e.level === 'error') problemas.push(`LOG: ${e.text} ${e.url ?? ''}`);
    }
  };

  const enviar = (method, params = {}) =>
    new Promise((res, rej) => {
      const msgId = ++id;
      pendentes.set(msgId, { res, rej });
      // `sessionId: null` é rejeitado pelo CDP — só enviamos depois de anexar.
      const msg = { id: msgId, method, params };
      if (sessao) msg.sessionId = sessao;
      ws.send(JSON.stringify(msg));
    });

  // Abre uma aba nova e anexa a ela.
  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const anexo = await enviar('Target.attachToTarget', { targetId, flatten: true });
  sessao = anexo.sessionId;

  await enviar('Runtime.enable');
  await enviar('Log.enable');
  await enviar('Page.enable');

  await enviar('Page.navigate', { url: URL_APP });

  // O bundle de dev é grande; 25s dá folga sem travar.
  await dormir(25000);

  // Verifica o que realmente está na tela.
  const { result } = await enviar('Runtime.evaluate', {
    expression: `JSON.stringify({
      title: document.title,
      url: location.href,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      // Varre os elementos procurando o verde e o fundo escuro da paleta.
      verde: Array.from(document.querySelectorAll('*')).filter(e => getComputedStyle(e).backgroundColor === 'rgb(22, 163, 74)').length,
      fundoEscuro: Array.from(document.querySelectorAll('*')).filter(e => getComputedStyle(e).backgroundColor === 'rgb(10, 10, 10)').length,
      texto: (document.body.innerText || '').slice(0, 200)
    })`,
    returnByValue: true,
  });

  console.log('\n=== PÁGINA ===');
  console.log(JSON.parse(result.value));
  console.log('\n=== CONSOLE ===');
  console.log(infos.length ? infos.join('\n') : '(sem mensagens)');
  console.log('\n=== PROBLEMAS ===');
  console.log(problemas.length ? problemas.join('\n') : '(nenhum)');

  ws.close();
  chrome.kill();
  try { rmSync(perfil, { recursive: true, force: true }); } catch {}

  process.exit(problemas.length ? 1 : 0);
}

main().catch((e) => {
  console.error('FALHA:', e.message);
  chrome.kill();
  process.exit(2);
});