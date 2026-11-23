"use client";

import { useParams } from "next/navigation";

// Esqueleto: a busca da cobrança pelo token e a exibição do Pix entram no dia 26/11.
export function Pagamento() {
  const { token } = useParams<{ token: string }>();

  return (
    <>
      <p className="mt-2 text-zinc-500">Em construção.</p>
      <p className="mt-6 font-mono text-xs text-zinc-400">{token}</p>
    </>
  );
}
