"use client";

import { useMutation, useQuery } from "convex/react";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import {
  competenciaDe,
  diasEntre,
  hojeBrasil,
  nomeDaCompetencia,
} from "@/convex/lib/datas";
import { formatarCentavos, reaisParaCentavos } from "@/lib/dinheiro";
import { mensagemDeErro } from "@/lib/erros";

// A data de hoje só é lida no navegador. No prerender do servidor fica null,
// o que evita gravar uma data fixa no HTML estático.
const semAssinatura = () => () => {};
function useHoje(): string | null {
  return useSyncExternalStore(semAssinatura, () => hojeBrasil(), () => null);
}

export default function Painel() {
  const clientes = useQuery(api.clientes.listar);
  const hoje = useHoje();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Pagou<span className="text-emerald-600">?</span>
        </h1>
        <p className="mt-1 text-zinc-500">Suas cobranças do mês num lugar só.</p>
      </header>

      {hoje && <CobrancasDoMes hoje={hoje} />}

      <NovoCliente />

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Clientes</h2>
        {clientes === undefined ? (
          <p className="text-zinc-500">Carregando...</p>
        ) : clientes.length === 0 ? (
          <p className="text-zinc-500">Nenhum cliente ainda. Cadastre o primeiro acima.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {clientes.map((c) => (
              <li key={c._id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-sm text-zinc-500">
                    {c.servico} · vence dia {c.diaVencimento}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">
                  {formatarCentavos(c.valorCentavos)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

type Situacao = { rotulo: string; classe: string };

function situacao(status: string, vencimento: string, hoje: string): Situacao {
  if (status === "paga") {
    return { rotulo: "Paga", classe: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" };
  }
  if (status === "cancelada" || status === "expirada") {
    return { rotulo: status === "cancelada" ? "Cancelada" : "Expirada", classe: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" };
  }
  const dias = diasEntre(vencimento, hoje);
  if (dias > 0) {
    return {
      rotulo: dias === 1 ? "1 dia atrasada" : `${dias} dias atrasada`,
      classe: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    rotulo: dias === 0 ? "Vence hoje" : `Vence dia ${vencimento.slice(8, 10)}`,
    classe: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  };
}

function CobrancasDoMes({ hoje }: { hoje: string }) {
  const competencia = competenciaDe(hoje);
  const cobrancas = useQuery(api.cobrancas.doMes, { competencia });

  if (cobrancas === undefined) {
    return <p className="mb-10 text-zinc-500">Carregando cobranças...</p>;
  }

  let recebido = 0;
  let aReceber = 0;
  let emAtraso = 0;
  for (const c of cobrancas) {
    if (c.status === "paga") recebido += c.valorCentavos;
    else if (c.status === "pendente") {
      aReceber += c.valorCentavos;
      if (diasEntre(c.vencimento, hoje) > 0) emAtraso += c.valorCentavos;
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold first-letter:uppercase">
        {nomeDaCompetencia(competencia)}
      </h2>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Total rotulo="Recebido" valor={recebido} />
        <Total rotulo="A receber" valor={aReceber} />
        <Total rotulo="Em atraso" valor={emAtraso} destaque={emAtraso > 0} />
      </div>

      {cobrancas.length === 0 ? (
        <p className="text-zinc-500">Nenhuma cobrança neste mês.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {cobrancas.map((c) => {
            const s = situacao(c.status, c.vencimento, hoje);
            return (
              <li key={c._id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.nome}</p>
                  <p className="truncate text-sm text-zinc-500">{c.servico}</p>
                  {c.status === "pendente" && (
                    <a
                      href={`/pagar/${c.tokenPublico}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                      Link de pagamento
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">{formatarCentavos(c.valorCentavos)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.classe}`}>{s.rotulo}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Total({ rotulo, valor, destaque = false }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{rotulo}</p>
      <p className={`mt-1 font-semibold tabular-nums ${destaque ? "text-amber-600" : ""}`}>
        {formatarCentavos(valor)}
      </p>
    </div>
  );
}

function NovoCliente() {
  const criar = useMutation(api.clientes.criar);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const valorCentavos = reaisParaCentavos(String(dados.get("valor") ?? ""));
    if (valorCentavos === null) {
      setErro("Valor inválido. Use, por exemplo, 150 ou 150,00.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await criar({
        nome: String(dados.get("nome") ?? ""),
        servico: String(dados.get("servico") ?? ""),
        valorCentavos,
        diaVencimento: Number(dados.get("dia")),
        email: String(dados.get("email") ?? "") || undefined,
        telefone: String(dados.get("telefone") ?? "") || undefined,
      });
      form.reset();
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  const campo =
    "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

  return (
    <form
      onSubmit={enviar}
      className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold sm:col-span-2">Novo cliente</h2>
      <input name="nome" placeholder="Nome" required className={campo} />
      <input name="servico" placeholder="Serviço (ex.: faxina semanal)" required className={campo} />
      <input name="valor" placeholder="Valor (R$)" inputMode="decimal" required className={campo} />
      <input
        name="dia"
        type="number"
        min={1}
        max={28}
        placeholder="Dia do vencimento (1 a 28)"
        required
        className={campo}
      />
      <input name="email" type="email" placeholder="E-mail (opcional)" className={campo} />
      <input name="telefone" placeholder="WhatsApp com DDD (opcional)" inputMode="tel" className={campo} />
      {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}
      <button
        type="submit"
        disabled={salvando}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60 sm:col-span-2"
      >
        {salvando ? "Salvando..." : "Cadastrar"}
      </button>
    </form>
  );
}
