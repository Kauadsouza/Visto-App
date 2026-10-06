# Visto

App que ensina uma pessoa brasileira a sair do Brasil. Você responde 8
perguntas sobre o seu perfil e o app mostra quais caminhos de imigração são
**realmente** viáveis para você — com custo, prazo e o que fazer primeiro.
Depois gera um checklist personalizado e um contador de dias para
permanência.

Não é app de viagem. Sem hotel, passagem, roteiro, mapa ou chat com IA.

---

## ⚠️ Antes de usar de verdade: os números são estimativas

**Os custos e prazos deste app não vieram de fonte oficial.** Foram escritos a
partir de referências gerais de mercado e **não foram conferidos item a item**
contra tabela de consulado.

Antes de publicar, valide cada valor contra:

- **UKVI** — <https://www.gov.uk/visas-immigration> (Student visa, CAS,
  Biometrics fee)
- **Consulado Geral da Espanha em Brasília** — taxas e documentos por tipo
- **Covariantes que mudam tudo**: câmbio, preço de tradução juramentada,
  seguros, mensalidades

O aviso aparece na tela do plano e na do resultado. O texto mora em um lugar
só — `AVISO_COSTOS` em [src/lib/planos.ts](src/lib/planos.ts) — para código e
tela nunca discordarem entre si.

---

## Rodando

```bash
npm install
cp .env.example .env      # preencha o que precisar
npx expo start
```

- `a` — Android (emulador ou dispositivo)
- `w` — navegador

### Modo sem backend

Enquanto não houver projeto no Supabase, o app roda **inteiro em estado
local**: questionário, diagnóstico, checklist e contador funcionam e são
persistidos no aparelho, sem nuvem e sem login.

Isso é controlado por um interruptor em
[src/lib/config.ts](src/lib/config.ts):

```ts
export const MODO_SEM_BACKEND = true;
```

Com ele ligado, as rotas `questionario`, `resultado`, `plano` e `pagamento`
ficam liberadas sem sessão e a tela de login mostra **"Continuar sem conta"**.

**Para ligar o backend** (ver seção "Ligar o Supabase" abaixo): mude para
`false`. Nada mais precisa ser alterado.

### Variáveis de ambiente

Todas em `.env` (não versionado). Só a `anon public key` do Supabase pode ir
para o cliente — **nunca** a `service_role`, que bypassa RLS. O cliente recusa
a chave se ela tiver cara de `service_role`
([src/lib/supabase.ts](src/lib/supabase.ts)).

| Variável | Para quê |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave `anon public` |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Login social (Google) |
| `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` | Referência: `visto://auth/callback` |
| `EXPO_PUBLIC_STRIPE_PAYMENT_LINK` | Link de pagamento do Stripe |

Depois de mexer no `.env`, **reinicie o Metro com `--clear`**. Variáveis
`EXPO_PUBLIC_*` são embutidas no bundle em tempo de build.

---

## Verificação

```bash
npm run typecheck     # tsc --noEmit, strict
npm test              # 29 testes das regras de negócio
npm run doctor        # expo-doctor
node scripts/verificar-navegador.mjs http://localhost:8081
```

O último abre o app no Chrome headless e reporta erros de console e exceções.
Vale rodar depois de mexer em tela: **`expo export` passar não prova que o app
abre** — erro de runtime só aparece executando o JavaScript. Foi assim que o
bug de `darkMode` foi encontrado.

### O que tem teste

| Arquivo | Cobre |
|---|---|
| [diagnostico.test.ts](src/lib/diagnostico.test.ts) | As 3 rotas, dinheiro, ensino médio, inglês, idade, objetivo, ordenação, desempate por custo, puridade |
| [permissoes.test.ts](src/lib/permissoes.test.ts) | Janela móvel Schengen de 180 dias, limite de 90, contagem inclusiva, entradas múltiplas, progresso para residência |

---

## Estrutura

```
src/
  app/              telas (Expo Router) — _layout, onboarding, auth,
                    questionario, resultado, plano, pagamento
  components/       Botao, Cabecalho, GuardaRota
  lib/
    perguntas.ts    as 8 perguntas (fonte única de tela e regra)
    diagnostico.ts  regra de negócio pura — sem rede, sem IA
    planos.ts       checklist por rota + aviso de estimativa
    permissoes.ts   Schengen 90/180 e residência
    supabase.ts     cliente, sessão persistente
    database.types.ts  tipos do banco
    erros.ts        erros do Supabase em português
  store/            zustand: auth, questionario, plano
supabase/migrations/  schema, RLS e triggers
scripts/            teste de isolamento e verificação de navegador
```

### Onde a segurança mora

- **RLS em todas as 4 tabelas**, com `(select auth.uid())`. Sem isso o app
  está aberto: qualquer pessoa com a anon key lê e escreve os dados de todo
  mundo.
- **`assinaturas` é somente-leitura para o cliente.** Se o app pudesse escrever
  no `status`, um `update` liberava o paywall inteiro. A escrita é do servidor.
- **Sanitização antes de salvar** ([questionario.ts](src/store/questionario.ts)):
  chave por chave, sem chave desconhecida, texto cortado, tags removidas. A
  resposta de "área de atuação" é texto livre e sempre traz junto o que veio de
  outros lugares.
- **`service_role` nunca no cliente.** Ela existe só em `supabase/.env.local`,
  usada apenas pelo script de teste.

---

## Ligar o Supabase

1. Crie o projeto em [supabase.com](https://supabase.com)
2. Dashboard → **SQL Editor** → rode, **na ordem**:
   - [20261005000100_schema.sql](supabase/migrations/20261005000100_schema.sql)
   - [20261005000200_rls.sql](supabase/migrations/20261005000200_rls.sql)
   - [20261005000300_triggers.sql](supabase/migrations/20261005000300_triggers.sql)
3. **Authentication → Providers**: habilite Email (e Google, se for usar login
   social)
4. Preencha o `.env` e mude `MODO_SEM_BACKEND` para `false`

Depois rode o teste de isolamento, que cria dois usuários e prova que um não
enxerga nem mexe nos dados do outro:

```bash
# crie supabase/.env.local com SUPABASE_URL, SUPABASE_ANON_KEY e
# SUPABASE_SERVICE_ROLE_KEY
node scripts/testar-isolamento.mjs
```

---

## Pagamento: o que funciona e o que não funciona

**Agora (MVP):** Payment Link hospedado do Stripe, aberto no navegador com
`Linking.openURL`. A tela de pagamento **não consegue confirmar** que o
pagamento foi aprovado — quem sabe disso é o Stripe, não o app. A tela diz isso
explicitamente em vez de fingir que liberou o acesso.

Sem `EXPO_PUBLIC_STRIPE_PAYMENT_LINK` configurado, o botão ativa o acesso só
naquele aparelho, sem cobrar ninguém, para você testar o fluxo.

### Fase 2 — verificação real

Precisa de backend, e é onde a `service_role` entra:

1. **Edge Function `criar-checkout`** — recebe o JWT do usuário, cria ou
   reaproveita o `stripe_customer_id`, cria a Checkout Session e devolve a URL.
   Usa `service_role` no servidor, nunca no cliente.
2. **Webhook do Stripe** grava o status em `assinaturas`. Melhor que polling
   porque não depende de o app estar aberto.
3. **No app**, ao voltar do navegador: polling em `assinaturas` a cada 5s,
   timeout de 60s. Se `status = 'ativa'`, libera. Se não voltar em 60s, mostrar
   "finalizando seu pagamento" com opção de reabrir o checkout.

Regra que não se quebra: **o app nunca escreve `status = 'ativa'`.** Se ele
puder, o paywall é decoração.

### Play Store e Google Play Billing

O checkout hospedado funciona no MVP, mas **para publicar na Play Store é
obrigatório migrar para Google Play Billing** — vender produto digital dentro
do app por link externo viola as regras da loja. Isso está registrado como
trabalho obrigatório na lista abaixo.

---

## O que ainda NÃO funciona

Sendo direto sobre os limites do que existe hoje:

- **Login social com Google** — o código está pronto, mas depende de você criar
  as credenciais no Google Cloud e no painel do Supabase. Não testado.
- **Pagamento real** — o link abre e o app volta, mas **não libera o acesso**.
  Sem backend não há como saber se o pagamento passou.
- **Nada de nuvem.** Sem Supabase ligado, questionário, checklist, contador e
  assinatura ficam **só neste aparelho**. Trocar de celular perde tudo.
- **Rate limit no cadastro** — não implementado (precisa de backend).
- **Sessão do Google na web** — o intercâmbio de código PKCE está implementado,
  mas não testado contra o Google real.
- **Os custos não foram validados** contra fonte oficial (veja o topo).

---

## Para publicar na Play Store

**Conta e assinatura**

- Conta de desenvolvedor Google Play — **US$ 25, taxa única**
- Preencha o cadastro verificado da conta, inclusive endereço e telefone
- Para contas criadas recently, o Google exige verificação de identidade com
  documento pessoal

**Build e assinatura**

- Keystore de upload, gerada e guardada com segurança. **Se perder a chave,
  não dá para mais atualizar o app** — nem para despublicar
- `npx eas build --platform android --profile production`
- Configure `android.package` (já está `com.visto.app` — confirme que é o
  domínio que você controla)

**Identidade visual**

- Ícone 512×512 PNG, sem transparência, sem cantos arredondados no arquivo
  (o Android aplica o mask)
- Ícone adaptativo (foreground + background) — os assets atuais são do
  scaffold padrão e **precisam ser trocados**
- Splash na cor do app (`#0A0A0A`) com o logo centralizado
- Todas as configurações de cor estão em [app.json](app.json)

**Obrigatórios do app**

- **Política de privacidade** publicada em URL pública e acessível. Obrigatória
  mesmo sem coleta de dados
- Termos de uso
- Formulário de **Data safety** no Play Console, refletindo o que o app guarda:
  email, respostas do questionário e registros de viagem
- Classificação de conteúdo
- **Target API** atualizado para o exigido pelo Google no momento do envio

**Assinatura dentro do app**

- Migrar o Stripe para **Google Play Billing**. Enquanto o checkout for por
  link externo, a assinatura é rejeitada na revisão

**Outros pontos**

- Base64 do APK/AAB para quem instala fora da Play Store (ou dispense)
- Teste em aparelho real — o emulador não reproduce notch, teclado e voltar
  físico

---

## Licença

Ver [LICENSE](LICENSE).