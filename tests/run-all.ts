// Executa a verificação de lógica (Node --experimental-strip-types). Resultados reais.
import { can, podeLiberarImpressao, ambienteDestino } from "../src/lib/permissions.ts";
import { normalizarLinkDrive, mesmoArquivoDrive } from "../src/lib/drive.ts";
import { podeLiberarImpressao as checklist, type EstadoLiberacao } from "../src/lib/impressao.ts";
import { respeita24h, atrasoDias } from "../src/domain/rules.ts";

let p = 0, f = 0; const A = (c: boolean, m: string) => c ? (p++, 0) : (f++, console.log("  ✗", m));
A(can(["diretor"], "aprovar_digital") && !can(["designer"], "aprovar_digital"), "permissões");
A(podeLiberarImpressao([{ cargo: "coordenador" }, { cargo: "diretor" }]), "impresso 2 aprovações");
A(ambienteDestino(["solicitante","designer"]) === "interno", "ambiente por acúmulo");
A(mesmoArquivoDrive("https://drive.google.com/file/d/1ABCDEFGHIJ2222/view", "https://drive.google.com/open?id=1ABCDEFGHIJ2222"), "drive dedupe por id");
A(!normalizarLinkDrive("https://x.com/a.pdf").ok, "recusa não-drive");
const base: EstadoLiberacao = { versaoVigente: true, versaoEstado: "aprovada", aprovacaoCoordenadorAtiva: true, aprovacaoDiretorAtiva: true, aprovacoesMesmaVersao: true, graficaSelecionada: true, quantidade: "1", medidas: "a", formato: "b", material: "c", acabamento: "d", prazoInformado: true, localEntrega: "e", existeLiberacaoIncompativel: false };
A(checklist(base) && !checklist({ ...base, aprovacaoDiretorAtiva: false }), "checklist impressão");
A(!respeita24h(new Date(Date.now() + 12 * 3600e3).toISOString()) && respeita24h(new Date(Date.now() + 25 * 3600e3).toISOString()), "regra 24h");
A(atrasoDias(new Date(Date.now() - 2 * 86400e3).toISOString(), "criacao") > 0 && atrasoDias(new Date(Date.now() - 2 * 86400e3).toISOString(), "finalizado") === 0, "atraso é indicador");
console.log(`Lógica: ${p} ok, ${f} falhas`); if (f) process.exit(1);
