import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Comparação em tempo constante, para não vazar o segredo pelo tempo de resposta.
function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

// Webhook da AbacatePay. URL pública: https://<deployment>.convex.site/webhooks/abacatepay
// Referência: https://docs.abacatepay.com/pages/notificacoes/seguranca.md
http.route({
  path: "/webhooks/abacatepay",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const esperado = process.env.ABACATEPAY_WEBHOOK_SECRET;
    const recebido = request.headers.get("X-Webhook-Secret") ?? "";
    if (!esperado || !iguais(recebido, esperado)) {
      return new Response("Não autorizado", { status: 401 });
    }

    // TODO: validar também X-Webhook-Signature (HMAC-SHA256 do corpo bruto
    // com a chave pública da AbacatePay) antes de confiar no conteúdo.
    const corpoBruto = await request.text();
    let evento: { id?: string; event?: string; devMode?: boolean; data?: unknown };
    try {
      evento = JSON.parse(corpoBruto);
    } catch {
      return new Response("JSON inválido", { status: 400 });
    }
    if (!evento.id || !evento.event) {
      return new Response("Evento sem id ou tipo", { status: 400 });
    }

    const novo = await ctx.runMutation(internal.webhooks.registrarEvento, {
      eventoId: evento.id,
      tipo: evento.event,
    });
    if (!novo) return new Response("Já processado", { status: 200 });

    // TODO: em "transparent.completed", localizar a cobrança pelo id do Pix e
    // marcar como paga. O formato de `data` ainda precisa ser confirmado em
    // https://docs.abacatepay.com/pages/webhooks/events/transparent.md
    console.log("Webhook AbacatePay recebido:", evento.event, evento.id);

    return new Response("OK", { status: 200 });
  }),
});

export default http;
