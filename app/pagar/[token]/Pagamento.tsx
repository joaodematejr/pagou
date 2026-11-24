"use client";

import { useAction, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { nomeDaCompetencia } from "@/convex/lib/datas";
import { pixValido } from "@/convex/lib/pix";
import { formatarCentavos } from "@/lib/dinheiro";
import { mensagemDeErro } from "@/lib/erros";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function dataCurta(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

export function Pagamento() {
  const { token } = useParams<{ token: string }>();
  const cobranca = useQuery(api.cobrancas.porToken, { token });
  const gerar = useAction(api.pix.gerar);
  const verificar = useAction(api.pix.verificar);
  const simular = useAction(api.pix.simular);

  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Gera o Pix ao abrir a página, uma vez por Pix (o ref evita chamada dupla).
  const pedido = useRef<string | null>(null);
  useEffect(() => {
    if (!cobranca || cobranca.status !== "pendente") return;
    if (pixValido(cobranca.pixExpiraEm, Date.now())) return;
    const chave = `${token}:${cobranca.pixExpiraEm ?? "novo"}`;
    if (pedido.current === chave) return;
    pedido.current = chave;
    gerar({ token }).catch((e) =>
      setErro(mensagemDeErro(e, "Não foi possível gerar o Pix agora.")),
    );
  }, [cobranca, gerar, token]);

  if (cobranca === undefined) {
    return <p className="mt-2 text-zinc-500">Carregando...</p>;
  }
  if (cobranca === null) {
    return <p className="mt-2 text-zinc-500">Cobrança não encontrada. Confira o link.</p>;
  }

  const cabecalho = (
    <div className="mt-4">
      <p className="text-zinc-500">
        {cobranca.primeiroNome ? `Olá, ${cobranca.primeiroNome}. ` : ""}
        {cobranca.servico}, {nomeDaCompetencia(cobranca.competencia)}
      </p>
      <p className="mt-3 text-4xl font-bold tabular-nums">
        {formatarCentavos(cobranca.valorCentavos)}
      </p>
      <p className="mt-1 text-sm text-zinc-500">Vencimento {dataCurta(cobranca.vencimento)}</p>
    </div>
  );

  if (cobranca.status === "paga") {
    return (
      <>
        {cabecalho}
        <div className="mt-8 rounded-xl bg-emerald-50 p-6 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <p className="text-lg font-semibold">Pagamento confirmado</p>
          {cobranca.pagaEm && (
            <p className="mt-1 text-sm">Recebido em {dataHora.format(cobranca.pagaEm)}. Obrigado!</p>
          )}
        </div>
      </>
    );
  }

  if (cobranca.status !== "pendente") {
    return (
      <>
        {cabecalho}
        <p className="mt-8 text-zinc-500">Esta cobrança não está mais disponível.</p>
      </>
    );
  }

  async function executar(acao: () => Promise<unknown>, padrao: string) {
    setErro(null);
    setAviso(null);
    setOcupado(true);
    try {
      return await acao();
    } catch (e) {
      setErro(mensagemDeErro(e, padrao));
    } finally {
      setOcupado(false);
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  const temPix = Boolean(cobranca.brCode && cobranca.brCodeBase64);

  return (
    <>
      {cabecalho}

      {!temPix ? (
        !erro && <p className="mt-8 text-zinc-500">Gerando o Pix...</p>
      ) : (
        <div className="mt-8">
          {/* QR Code em data URL vindo do PSP; next/image não otimiza data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cobranca.brCodeBase64}
            alt="QR Code do Pix"
            width={224}
            height={224}
            className="mx-auto rounded-lg bg-white p-2"
          />
          {cobranca.pixExpiraEm && (
            <p className="mt-2 text-xs text-zinc-500">
              Válido até {dataHora.format(new Date(cobranca.pixExpiraEm))}
            </p>
          )}

          <p className="mt-6 text-sm font-medium">Pix copia e cola</p>
          <textarea
            readOnly
            value={cobranca.brCode}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-2 w-full resize-none rounded-lg border border-zinc-300 bg-transparent p-2 font-mono text-xs dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => copiar(cobranca.brCode!)}
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white"
          >
            {copiado ? "Copiado!" : "Copiar código"}
          </button>

          <button
            type="button"
            disabled={ocupado}
            onClick={async () => {
              const r = await executar(
                () => verificar({ token }),
                "Não foi possível consultar o pagamento agora.",
              );
              if (r === "pendente") setAviso("Ainda não recebemos. Pode levar alguns segundos.");
            }}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 font-semibold disabled:opacity-60 dark:border-zinc-700"
          >
            Já paguei
          </button>

          {cobranca.pixModoTeste && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => executar(() => simular({ token }), "Não foi possível simular.")}
              className="mt-3 w-full rounded-lg border border-dashed border-amber-500 px-4 py-3 text-sm font-semibold text-amber-700 disabled:opacity-60 dark:text-amber-400"
            >
              Simular pagamento (modo teste)
            </button>
          )}
        </div>
      )}

      {aviso && <p className="mt-4 text-sm text-zinc-500">{aviso}</p>}
      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
    </>
  );
}
