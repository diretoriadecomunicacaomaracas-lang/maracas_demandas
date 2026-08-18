import { transicaoKanbanValida, destinosKanban, mensagemDestinos, podeArrastar } from "../../src/domain/flows.ts";
let p = 0, f = 0; const A = (c: boolean, m: string) => c ? (p++, console.log("  ✓", m)) : (f++, console.log("  ✗", m));

// O BUG relatado: planejamento -> criação (pulando distribuição) agora é VÁLIDO.
A(transicaoKanbanValida("digital", "planejamento", "criacao"), "digital: Planejamento → Em criação (válido)");
A(transicaoKanbanValida("digital", "planejamento", "distribuicao"), "digital: Planejamento → Aguardando distribuição (válido)");
A(!transicaoKanbanValida("digital", "planejamento", "aprovado"), "digital: Planejamento → Aprovado (INVÁLIDO, é ação)");
A(!transicaoKanbanValida("digital", "planejamento", "publicado"), "digital: não pula para Publicado");
A(transicaoKanbanValida("digital", "revisao", "aprovacao"), "digital: Revisão → Aguardando aprovação (encaminhar)");
A(transicaoKanbanValida("digital", "criacao", "distribuicao"), "digital: devolução Em criação → Aguardando distribuição");
A(transicaoKanbanValida("audiovisual", "roteiro", "gravacao_aguard"), "audiovisual: Roteiro → Aguardando gravação");
A(transicaoKanbanValida("impresso", "revisao", "aprov_coord"), "impresso: Revisão → Aguard. aprov. Coordenador");
A(!podeArrastar("impresso", "liberado_imp"), "impresso: Liberado para impressão NÃO é arrastável (ação)");
A(mensagemDestinos("digital", "planejamento") === 'Esta demanda está em “Planejamento”. As próximas etapas permitidas são “Aguardando distribuição” e “Em criação”.', "mensagem de destinos formatada");
console.log(`Kanban: ${p} ok, ${f} falhas`); if (f) process.exit(1);
