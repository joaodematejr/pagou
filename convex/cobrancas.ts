import { v } from "convex/values";
import { internalMutation, query, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { competenciaDe, competenciaValida, hojeBrasil, vencimentoDe } from "./lib/datas";

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
