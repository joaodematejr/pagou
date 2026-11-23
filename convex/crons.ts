import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Todo dia às 8h de Brasília (11h UTC) gera as cobranças do mês que faltarem.
// Rodar diariamente, e não só no dia 1, cobre clientes novos e falhas pontuais.
// O identificador do cron só aceita ASCII, por isso sem acento.
crons.daily(
  "gerar-cobrancas-do-mes",
  { hourUTC: 11, minuteUTC: 0 },
  internal.cobrancas.gerarDoMes,
  {},
);

export default crons;
