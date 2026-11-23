import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Registra o id de um evento de webhook. Devolve false se o evento já foi
 * processado, para que reenvios da AbacatePay não sejam aplicados duas vezes.
 */
export const registrarEvento = internalMutation({
  args: { eventoId: v.string(), tipo: v.string() },
  handler: async (ctx, { eventoId, tipo }) => {
    const existente = await ctx.db
      .query("eventosWebhook")
      .withIndex("por_evento", (q) => q.eq("eventoId", eventoId))
      .unique();
    if (existente) return false;
    await ctx.db.insert("eventosWebhook", {
      eventoId,
      tipo,
      recebidoEm: Date.now(),
    });
    return true;
  },
});
