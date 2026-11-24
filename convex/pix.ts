import { ConvexError, v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { chaveDeTeste, consultarPix, criarPix, simularPagamento } from "./abacatepay";
import { nomeDaCompetencia } from "./lib/datas";
import { pixValido } from "./lib/pix";

async function carregar(ctx: ActionCtx, token: string) {
  const c = await ctx.runQuery(internal.cobrancas.paraPix, { token });
  if (!c) throw new ConvexError("Cobrança não encontrada.");
  return c;
}

/**
 * Garante um Pix válido para a cobrança. Chamado quando o cliente abre a
 * página de pagamento. Se já existe Pix válido, não faz nada.
 */
export const gerar = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const c = await carregar(ctx, token);
    if (c.status !== "pendente") return;
    if (c.pixId && pixValido(c.pixExpiraEm, Date.now())) return;

    let pix;
    try {
      pix = await criarPix({
        valorCentavos: c.valorCentavos,
        descricao: `${c.servico}, ${nomeDaCompetencia(c.competencia)}`,
        // Único por tentativa: um Pix novo substitui o expirado.
        externalId: `${c._id}-${Date.now()}`,
      });
    } catch (erro) {
      console.error("Falha ao criar Pix", erro);
      throw new ConvexError("Não foi possível gerar o Pix agora. Tente de novo em instantes.");
    }

    await ctx.runMutation(internal.cobrancas.salvarPix, {
      cobrancaId: c._id,
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      pixExpiraEm: pix.expiresAt,
      pixModoTeste: pix.devMode,
    });
  },
});

/**
 * Consulta o status do Pix na AbacatePay e dá baixa se já foi pago.
 * É o caminho de reserva caso o webhook atrase ou falhe.
 */
export const verificar = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const c = await carregar(ctx, token);
    if (c.status === "paga") return "paga" as const;
    if (!c.pixId) return "sem_pix" as const;

    let status;
    try {
      ({ status } = await consultarPix(c.pixId));
    } catch (erro) {
      console.error("Falha ao consultar Pix", erro);
      throw new ConvexError("Não foi possível consultar o pagamento agora.");
    }
    if (status !== "PAID") return "pendente" as const;

    await ctx.runMutation(internal.cobrancas.marcarPagaPorPix, { pixId: c.pixId });
    return "paga" as const;
  },
});

/** Simula o pagamento do Pix. Só existe em Modo Teste, para a demo. */
export const simular = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!chaveDeTeste()) {
      throw new ConvexError("Simulação disponível só em modo teste.");
    }
    const c = await carregar(ctx, token);
    if (c.status === "paga") return;
    if (!c.pixId || !c.pixModoTeste) {
      throw new ConvexError("Esta cobrança não tem um Pix de teste.");
    }

    let pix;
    try {
      pix = await simularPagamento(c.pixId);
    } catch (erro) {
      console.error("Falha ao simular pagamento", erro);
      throw new ConvexError("Não foi possível simular o pagamento.");
    }
    // A AbacatePay também manda o webhook; a baixa é idempotente.
    if (pix.status === "PAID") {
      await ctx.runMutation(internal.cobrancas.marcarPagaPorPix, { pixId: c.pixId });
    }
  },
});
