import { ConvexError } from "convex/values";

/** Mensagem legível de um erro vindo do Convex. */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof ConvexError && typeof erro.data === "string") return erro.data;
  return padrao;
}
