import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const statusCobranca = v.union(
  v.literal("pendente"),
  v.literal("paga"),
  v.literal("expirada"),
  v.literal("cancelada"),
);

export default defineSchema({
  // Cliente recorrente de quem cobra. Os dados ficam só aqui: a cobrança
  // enviada ao PSP leva apenas valor e descrição, sem dados pessoais.
  clientes: defineTable({
    nome: v.string(),
    servico: v.string(),
    valorCentavos: v.number(),
    diaVencimento: v.number(), // 1 a 28, para existir em todo mês
    email: v.optional(v.string()),
    telefone: v.optional(v.string()), // só dígitos, com DDD, para o link do WhatsApp
    ativo: v.boolean(),
  }).index("por_ativo", ["ativo"]),

  // Uma cobrança por cliente por competência (mês de referência).
  cobrancas: defineTable({
    clienteId: v.id("clientes"),
    competencia: v.string(), // "2026-11"
    vencimento: v.string(), // "2026-11-10"
    valorCentavos: v.number(),
    status: statusCobranca,
    // Token aleatório da página pública de pagamento (/pagar/[token]).
    tokenPublico: v.string(),
    // Dados do Pix devolvidos pelo PSP.
    pixId: v.optional(v.string()),
    brCode: v.optional(v.string()),
    brCodeBase64: v.optional(v.string()),
    pixExpiraEm: v.optional(v.string()),
    pagaEm: v.optional(v.number()),
  })
    .index("por_cliente_competencia", ["clienteId", "competencia"])
    .index("por_competencia", ["competencia"])
    .index("por_token", ["tokenPublico"])
    .index("por_pix", ["pixId"]),

  // Ids de eventos de webhook já processados, para ignorar reenvios.
  eventosWebhook: defineTable({
    eventoId: v.string(),
    tipo: v.string(),
    recebidoEm: v.number(),
  }).index("por_evento", ["eventoId"]),
});
