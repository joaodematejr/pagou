/** Pix ainda válido por pelo menos 1 minuto. Usado no Convex e no navegador. */
export function pixValido(pixExpiraEm: string | undefined, agora: number): boolean {
  return pixExpiraEm !== undefined && Date.parse(pixExpiraEm) - agora > 60_000;
}
