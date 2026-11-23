import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { garantirCobranca } from "./cobrancas";
import { competenciaDe, hojeBrasil, primeiraCompetencia } from "./lib/datas";

export const listar = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clientes")
      .withIndex("por_ativo", (q) => q.eq("ativo", true))
      .collect();
  },
});

export const criar = mutation({
  args: {
    nome: v.string(),
    servico: v.string(),
    valorCentavos: v.number(),
    diaVencimento: v.number(),
    email: v.optional(v.string()),
    telefone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nome = args.nome.trim();
    const servico = args.servico.trim();
    if (!nome) throw new Error("Informe o nome do cliente.");
    if (!servico) throw new Error("Informe o serviço.");
    // Mínimo da AbacatePay para Pix: 100 centavos.
    if (!Number.isInteger(args.valorCentavos) || args.valorCentavos < 100) {
      throw new Error("O valor mínimo é R$ 1,00.");
    }
    if (
      !Number.isInteger(args.diaVencimento) ||
      args.diaVencimento < 1 ||
      args.diaVencimento > 28
    ) {
      throw new Error("O dia de vencimento vai de 1 a 28.");
    }
    const telefone = args.telefone?.replace(/\D/g, "") || undefined;
    const hoje = hojeBrasil();

    const id = await ctx.db.insert("clientes", {
      nome,
      servico,
      valorCentavos: args.valorCentavos,
      diaVencimento: args.diaVencimento,
      email: args.email?.trim() || undefined,
      telefone,
      ativo: true,
      inicioCompetencia: primeiraCompetencia(hoje, args.diaVencimento),
    });

    // Se o vencimento deste mês ainda não passou, a cobrança já sai agora,
    // sem esperar o cron do dia seguinte.
    const cliente = await ctx.db.get(id);
    if (cliente) await garantirCobranca(ctx, cliente, competenciaDe(hoje));

    return id;
  },
});
