// Datas no fuso de Brasília. Usado no Convex e no navegador.
// O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo em UTC-3.
const DESLOCAMENTO_BRASILIA_MS = 3 * 60 * 60 * 1000;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Data de hoje em Brasília, no formato "2026-11-23". */
export function hojeBrasil(agora: number = Date.now()): string {
  return new Date(agora - DESLOCAMENTO_BRASILIA_MS).toISOString().slice(0, 10);
}

/** "2026-11-23" vira "2026-11". */
export function competenciaDe(data: string): string {
  return data.slice(0, 7);
}

export function competenciaValida(competencia: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(competencia);
  return m !== null && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

/** "2026-12" vira "2027-01". */
export function proximaCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

/** "2026-11" e dia 5 viram "2026-11-05". */
export function vencimentoDe(competencia: string, dia: number): string {
  return `${competencia}-${String(dia).padStart(2, "0")}`;
}

/**
 * Primeiro mês a cobrar de um cliente cadastrado hoje: o mês atual se o
 * vencimento ainda não passou, senão o próximo. Evita cobrança que nasce atrasada.
 */
export function primeiraCompetencia(hoje: string, diaVencimento: number): string {
  const atual = competenciaDe(hoje);
  return Number(hoje.slice(8, 10)) <= diaVencimento ? atual : proximaCompetencia(atual);
}

/** Dias de `de` até `ate` (positivo se `ate` vem depois). */
export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(ate) - Date.parse(de)) / UM_DIA_MS);
}

/** "2026-11" vira "novembro de 2026". */
export function nomeDaCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES[mes - 1]} de ${ano}`;
}
