const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarCentavos(centavos: number): string {
  return formatador.format(centavos / 100);
}

/**
 * Converte o que a pessoa digitou ("150", "150,5", "1.500,00") em centavos.
 * Devolve null se não for um valor válido.
 */
export function reaisParaCentavos(texto: string): number | null {
  let limpo = texto.trim().replace(/\s|R\$/g, "");
  if (limpo.includes(",")) {
    // Formato brasileiro: ponto separa milhar, vírgula separa centavos.
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (!/^\d+\.\d{1,2}$/.test(limpo)) {
    // Sem vírgula, ponto só é decimal em "150.5" ou "150.50"; senão é milhar.
    limpo = limpo.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * 100);
}
