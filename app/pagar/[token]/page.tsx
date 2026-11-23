import { Suspense } from "react";
import { Pagamento } from "./Pagamento";

// Página pública que o cliente abre para pagar. O token só existe em tempo de
// execução, então a parte que lê a URL fica dentro de um Suspense.
export default function PaginaPagamento() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Pagamento via Pix</h1>
      <Suspense fallback={<p className="mt-2 text-zinc-500">Carregando...</p>}>
        <Pagamento />
      </Suspense>
    </main>
  );
}
