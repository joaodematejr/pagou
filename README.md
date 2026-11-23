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

- [ ] Cadastro de clientes e cobranças recorrentes
- [ ] Geração de Pix em ambiente de teste (sandbox)
- [ ] Página pública de pagamento
- [ ] Baixa automática via webhook
- [ ] Lembretes por e-mail e atalho para WhatsApp
- [ ] Painel do mês

## Stack prevista

- **Front-end:** Next.js (React, TypeScript)
- **Back-end e banco em tempo real:** Convex
- **Pix:** API de PSP em modo de teste (sandbox). Nenhuma transação real é feita na demo.
- **E-mail:** Resend

## Como executar

Pré-requisitos: Node.js 20 ou superior e uma conta de desenvolvedor no PSP de Pix (modo de teste).

```bash
git clone https://github.com/joaodematejr/pagou.git
cd pagou
npm install
cp .env.example .env.local   # preencha as chaves de teste
npm run dev
```

Depois abra http://localhost:3000.

As instruções detalhadas de configuração (chaves, webhook e dados de exemplo) entram aqui assim que o código for publicado.

## Dados

A demo usa apenas dados sintéticos e o ambiente de teste do PSP. Nenhum dado pessoal real é coletado ou exibido.

## Licença

MIT
