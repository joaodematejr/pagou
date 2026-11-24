// Cliente mínimo da API v2 da AbacatePay para Pix (Checkout Transparente).
// Referência: https://docs.abacatepay.com/pages/transparents/create.md
// Roda só no servidor (actions do Convex). A chave nunca vai para o navegador.

// ABACATEPAY_BASE_URL só existe para testes locais contra um servidor falso.
// Em uso normal fica ausente e vale a API real.
function baseUrl(): string {
  return process.env.ABACATEPAY_BASE_URL ?? "https://api.abacatepay.com/v2";
}

/** True quando a chave configurada é de Modo Teste. */
export function chaveDeTeste(): boolean {
  return (process.env.ABACATEPAY_API_KEY ?? "").startsWith("abc_dev_");
}

export type StatusPix =
  | "PENDING"
  | "EXPIRED"
  | "CANCELLED"
  | "PAID"
  | "UNDER_DISPUTE"
  | "REFUNDED"
  | "REDEEMED"
  | "APPROVED"
  | "FAILED";

export type PixQrCode = {
  id: string;
  amount: number;
  status: StatusPix;
  devMode: boolean;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
};

type Envelope<T> = { data: T | null; success: boolean; error: string | null };

function chave(): string {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) {
    throw new Error(
      "ABACATEPAY_API_KEY não configurada. Rode: npx convex env set ABACATEPAY_API_KEY abc_dev_...",
    );
  }
  return key;
}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${baseUrl()}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${chave()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const corpo = (await resposta.json().catch(() => null)) as Envelope<T> | null;
  if (!resposta.ok || !corpo?.success || !corpo.data) {
    const motivo = corpo?.error ?? `HTTP ${resposta.status}`;
    throw new Error(`AbacatePay ${caminho}: ${motivo}`);
  }
  return corpo.data;
}

/** Cria uma cobrança Pix. `valorCentavos` em centavos (mínimo 100). */
export function criarPix(args: {
  valorCentavos: number;
  descricao: string;
  externalId: string;
  expiraEmSegundos?: number;
}): Promise<PixQrCode> {
  return chamar<PixQrCode>("/transparents/create", {
    method: "POST",
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: args.valorCentavos,
        description: args.descricao.slice(0, 140),
        externalId: args.externalId,
        ...(args.expiraEmSegundos ? { expiresIn: args.expiraEmSegundos } : {}),
      },
    }),
  });
}

/** Consulta o status de um Pix. */
export function consultarPix(id: string) {
  return chamar<{ id: string; status: StatusPix; expiresAt: string }>(
    `/transparents/check?id=${encodeURIComponent(id)}`,
  );
}

/** Simula o pagamento de um Pix. Só funciona com chave de teste (abc_dev_). */
export function simularPagamento(id: string): Promise<PixQrCode> {
  return chamar<PixQrCode>(
    `/transparents/simulate-payment?id=${encodeURIComponent(id)}`,
    { method: "POST" },
  );
}
