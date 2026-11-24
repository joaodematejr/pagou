import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  query,
  type MutationCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { competenciaDe, competenciaValida, hojeBrasil, vencimentoDe } from "./lib/datas";
import { pixValido } from "./lib/pix";

/** Token aleatório (128 bits) da página pública de pagamento. */
function novoToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Cria a cobrança do cliente na competência, se ainda não existir.
 * Idempotente: chamar duas vezes não duplica. Devolve o id criado ou null.
 */
export async function garantirCobranca(
  ctx: MutationCtx,
  cliente: Doc<"clientes">,
  competencia: string,
) {
  if (!cliente.ativo) return null;
  // Cliente que começa num mês posterior ainda não é cobrado.
  if (cliente.inicioCompetencia && cliente.inicioCompetencia > competencia) return null;

  const existente = await ctx.db
    .query("cobrancas")
    .withIndex("por_cliente_competencia", (q) =>
      q.eq("clienteId", cliente._id).eq("competencia", competencia),
    )
    .unique();
  if (existente) return null;

  return await ctx.db.insert("cobrancas", {
    clienteId: cliente._id,
    competencia,
    vencimento: vencimentoDe(competencia, cliente.diaVencimento),
    valorCentavos: cliente.valorCentavos,
    status: "pendente",
    tokenPublico: novoToken(),
  });
}

/** Gera as cobranças que faltam na competência (padrão: mês atual). Roda no cron diário. */
export const gerarDoMes = internalMutation({
  args: { competencia: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const competencia = args.competencia ?? competenciaDe(hojeBrasil());
    if (!competenciaValida(competencia)) {
      throw new Error(`Competência inválida: ${competencia}. Use o formato AAAA-MM.`);
    }
    const clientes = await ctx.db
      .query("clientes")
      .withIndex("por_ativo", (q) => q.eq("ativo", true))
      .collect();

    let criadas = 0;
    for (const cliente of clientes) {
      if (await garantirCobranca(ctx, cliente, competencia)) criadas++;
    }
    return { competencia, criadas };
  },
});

/**
 * Cobranças da competência com o nome do cliente, ordenadas por vencimento.
 * O atraso é calculado na tela, porque depende do dia de hoje.
 */
export const doMes = query({
  args: { competencia: v.string() },
  handler: async (ctx, { competencia }) => {
    const cobrancas = await ctx.db
      .query("cobrancas")
      .withIndex("por_competencia", (q) => q.eq("competencia", competencia))
      .collect();

    const linhas = await Promise.all(
      cobrancas.map(async (c) => {
        const cliente = await ctx.db.get(c.clienteId);
        return {
          _id: c._id,
          nome: cliente?.nome ?? "Cliente removido",
          servico: cliente?.servico ?? "",
          valorCentavos: c.valorCentavos,
          vencimento: c.vencimento,
          status: c.status,
          tokenPublico: c.tokenPublico,
          pagaEm: c.pagaEm,
        };
      }),
    );

    return linhas.sort(
      (a, b) => a.vencimento.localeCompare(b.vencimento) || a.nome.localeCompare(b.nome),
    );
  },
});

// ---------------------------------------------------------------------------
// Página pública de pagamento e Pix
// ---------------------------------------------------------------------------

/**
 * O que o cliente vê na página /pagar/[token]. Expõe só o necessário para
 * pagar: nada de e-mail, telefone ou id interno.
 */
export const porToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const c = await ctx.db
      .query("cobrancas")
      .withIndex("por_token", (q) => q.eq("tokenPublico", token))
      .unique();
    if (!c) return null;
    const cliente = await ctx.db.get(c.clienteId);
    return {
      primeiroNome: cliente?.nome.split(" ")[0] ?? "",
      servico: cliente?.servico ?? "",
      competencia: c.competencia,
      vencimento: c.vencimento,
      valorCentavos: c.valorCentavos,
      status: c.status,
      brCode: c.brCode,
      brCodeBase64: c.brCodeBase64,
      pixExpiraEm: c.pixExpiraEm,
      pixModoTeste: c.pixModoTeste ?? false,
      pagaEm: c.pagaEm,
    };
  },
});

/** Cobrança completa pelo token, para as actions de Pix. */
export const paraPix = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const c = await ctx.db
      .query("cobrancas")
      .withIndex("por_token", (q) => q.eq("tokenPublico", token))
      .unique();
    if (!c) return null;
    const cliente = await ctx.db.get(c.clienteId);
    return { ...c, servico: cliente?.servico ?? "Cobrança" };
  },
});

/**
 * Grava o Pix criado no PSP. Se outra aba já gravou um Pix válido nesse meio
 * tempo, mantém o existente para o cliente não ver o QR Code mudar.
 */
export const salvarPix = internalMutation({
  args: {
    cobrancaId: v.id("cobrancas"),
    pixId: v.string(),
    brCode: v.string(),
    brCodeBase64: v.string(),
    pixExpiraEm: v.string(),
    pixModoTeste: v.boolean(),
  },
  handler: async (ctx, { cobrancaId, ...pix }) => {
    const c = await ctx.db.get(cobrancaId);
    if (!c || c.status !== "pendente") return false;
    if (c.pixId && pixValido(c.pixExpiraEm, Date.now())) return false;
    await ctx.db.patch(cobrancaId, pix);
    return true;
  },
});

/**
 * Dá baixa na cobrança dona do Pix. Idempotente: usado pelo webhook, pela
 * consulta de status e pela simulação, que podem chegar em qualquer ordem.
 */
export const marcarPagaPorPix = internalMutation({
  args: { pixId: v.string() },
  handler: async (ctx, { pixId }) => {
    const c = await ctx.db
      .query("cobrancas")
      .withIndex("por_pix", (q) => q.eq("pixId", pixId))
      .unique();
    if (!c) return "nao_encontrada" as const;
    if (c.status === "paga") return "ja_paga" as const;
    await ctx.db.patch(c._id, { status: "paga", pagaEm: Date.now() });
    return "paga" as const;
  },
});
