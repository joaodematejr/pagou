"use client";

import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import { formatarCentavos, reaisParaCentavos } from "@/lib/dinheiro";

export default function Painel() {
  const clientes = useQuery(api.clientes.listar);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Pagou<span className="text-emerald-600">?</span>
        </h1>
        <p className="mt-1 text-zinc-500">Suas cobranças do mês num lugar só.</p>
      </header>

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
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
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
