# Pagou?

Cobrança por Pix para quem trabalha por conta própria e odeia ter que cobrar.

Projeto do Hack Brasil 2026, trilha **Pagamentos & finanças**.

## O problema

Diarista, personal trainer, professor particular, manicure, cuidador de idosos: milhões de autônomos no Brasil recebem de clientes fixos todo mês, e quase todos controlam isso de cabeça ou num caderno. A cobrança vai por mensagem solta no WhatsApp, o comprovante se perde no meio da conversa e, no fim do mês, ninguém sabe direito quem pagou.

Cobrar é desconfortável. Muita gente prefere deixar passar a parecer chata, e o atraso vira prejuízo. Sistemas de cobrança existentes foram feitos para empresas: pedem CNPJ, integração, boleto e um vocabulário que esse público não usa.

## A solução

O **Pagou?** organiza as cobranças recorrentes de um autônomo em um só lugar:

1. **Cadastro simples.** A pessoa cadastra cada cliente com o valor e o dia de vencimento.
2. **Cobrança pronta.** No vencimento, o sistema gera um Pix (QR Code e copia e cola) e uma página de pagamento com o nome de quem cobra.
3. **Lembrete sem constrangimento.** O cliente recebe o lembrete por e-mail, e a pessoa pode mandar pelo WhatsApp com a mensagem já escrita, em um toque.
4. **Baixa automática.** Quando o Pix cai, a cobrança vira "pago" sozinha, sem conferir extrato nem pedir comprovante.
5. **Painel do mês.** Quem pagou, quem está atrasado e quanto entrou, numa tela só.

## Para quem

Trabalhadores autônomos e informais com clientes recorrentes, que recebem por Pix e não têm (nem querem ter) um sistema de gestão.

## Status

Em construção durante o Hack Brasil 2026. Esta seção é atualizada conforme as funcionalidades ficam prontas.

- [x] Esqueleto do app (Next.js + Convex) e modelo de dados
- [x] Cadastro de clientes
- [ ] Geração mensal das cobranças recorrentes
- [ ] Geração de Pix em ambiente de teste (sandbox)
- [ ] Página pública de pagamento
- [ ] Baixa automática via webhook
- [ ] Lembretes por e-mail e atalho para WhatsApp
- [ ] Painel do mês

## Stack

- **Front-end:** Next.js 16 (React, TypeScript, Tailwind)
- **Back-end e banco em tempo real:** Convex. O painel atualiza sozinho quando um pagamento cai.
- **Pix:** API v2 da [AbacatePay](https://docs.abacatepay.com) em Modo Teste. Nenhuma transação real é feita na demo.
- **E-mail:** Resend (previsto)

## Estrutura

```
app/                  páginas (painel em /, pagamento público em /pagar/[token])
convex/schema.ts      modelo de dados: clientes, cobrancas, eventosWebhook
convex/clientes.ts    cadastro e listagem de clientes
convex/abacatepay.ts  cliente da API de Pix (criar, consultar, simular pagamento)
convex/http.ts        webhook da AbacatePay (/webhooks/abacatepay)
lib/dinheiro.ts       formatação e conversão de valores em reais
docs/                 página pública do projeto (GitHub Pages)
```

## Como executar

Pré-requisito: Node.js 20 ou superior.

```bash
git clone https://github.com/joaodematejr/pagou.git
cd pagou
npm install

# Terminal 1: back-end. Na primeira vez pede login no Convex
# e cria o .env.local com a URL do deployment.
npx convex dev

# Terminal 2: front-end
npm run dev
```

Depois abra http://localhost:3000.

Para testar sem conta no Convex, rode o back-end em modo local anônimo:
`CONVEX_AGENT_MODE=anonymous npx convex dev`.

### Pix em Modo Teste

1. Crie uma conta na AbacatePay. Toda conta começa em Modo Teste e não precisa de CNPJ.
2. Gere uma chave de API v2 de teste (começa com `abc_dev_`).
3. Configure as variáveis no Convex (elas ficam só no servidor):

```bash
npx convex env set ABACATEPAY_API_KEY abc_dev_...
npx convex env set ABACATEPAY_WEBHOOK_SECRET <segredo com 32+ caracteres>
```

4. Cadastre na AbacatePay um webhook v2 para o evento `transparent.completed` apontando para
   `https://<seu-deployment>.convex.site/webhooks/abacatepay`, com o mesmo segredo.

## Dados

A demo usa apenas dados sintéticos e o ambiente de teste do PSP. Nenhum dado pessoal real é coletado ou exibido.

## Licença

MIT
