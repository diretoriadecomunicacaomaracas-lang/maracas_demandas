// Suíte de integração executável em Node (--experimental-strip-types). Percorre os fluxos ponta a ponta.
import { seedStore } from "../../src/domain/seed.ts";
import { uid, agora } from "../../src/domain/store.ts";
import { criarSolicitacao, listarSolicitacoes, marcarRestrita, triagem } from "../../src/domain/services/solicitacoes.ts";
import { criarSubdemanda, moverEtapa, reabrir, excluirLogico } from "../../src/domain/services/demandas.ts";
import { adicionarVersao } from "../../src/domain/services/versoes.ts";
import { aprovarDigital, liberarPublicacao, aprovarImpresso, liberarImpressao, estadoLiberacao } from "../../src/domain/services/aprovacoes.ts";
import { confirmarVersao, pedidosDaGrafica } from "../../src/domain/services/grafica.ts";
import { enviarMensagem, naoLidas, pesquisar } from "../../src/domain/services/conversas.ts";

let pass = 0, fail = 0;
function ok(cond: boolean, msg: string) { if (cond) { pass++; console.log("  ✓", msg); } else { fail++; console.log("  ✗ FALHOU:", msg); } }
function grp(t: string) { console.log("\n== " + t + " =="); }

const amanha = new Date(Date.now() + 26 * 3600 * 1000).toISOString();
const em12h = new Date(Date.now() + 12 * 3600 * 1000).toISOString();

// 1) Solicitações + visibilidade + 24h
grp("1. Portal de Solicitações e Triagem");
let { db, atores } = seedStore();
ok(criarSolicitacao(db, atores.solSaude, { titulo: "Card raiva animal", tipo: "digital", secretariaId: "sec_saude", prazoDesejado: em12h }).ok === false, "bloqueia prazo < 24h");
const r1 = criarSolicitacao(db, atores.solSaude, { titulo: "Card raiva animal", tipo: "digital", secretariaId: "sec_saude", prazoDesejado: amanha });
ok(r1.ok === true, "cria solicitação com 24h e protocolo " + (r1.ok && r1.solic.protocolo));
criarSolicitacao(db, atores.solEdu, { titulo: "Spot Educação", tipo: "audiovisual", secretariaId: "sec_edu", prazoDesejado: amanha });
ok(listarSolicitacoes(db, atores.solSaude).length === 1, "solicitante da Saúde vê só a da Saúde");
ok(listarSolicitacoes(db, atores.solEdu).every(s => s.secretariaId === "sec_edu"), "solicitante da Educação não vê a da Saúde");
ok(listarSolicitacoes(db, atores.coord).length === 2, "interno vê todas (triagem)");
const solId = r1.ok ? r1.solic.id : "";
marcarRestrita(db, atores.solSaude, solId, true);
ok(listarSolicitacoes(db, atores.solEdu).length === (db.solicitacoes.filter(s=>s.secretariaId==="sec_edu").length), "restrita não vaza para outra secretaria");
const tri = triagem(db, atores.coord, solId, "aprovar");
ok(tri.ok && !!tri.demandaId, "triagem aprovar → cria demanda+subdemanda");
ok(db.emails.some(e => e.tipo === "solicitacao_aprovada"), "e-mail 'solicitação aprovada' enfileirado");

// 2/3) Demandas + Kanban validado
grp("2/3. Demandas, subdemandas e Kanban validado");
const dem = db.demandas[0];
const subR = criarSubdemanda(db, atores.coord, dem.id, { titulo: "Card feed", tipo: "digital", responsavelId: atores.designer.id, membros: [atores.designer.id] });
ok(subR.ok, "coordenador cria subdemanda");
const sub = subR.sub!;
ok(criarSubdemanda(db, atores.solSaude, dem.id, { titulo: "x", tipo: "digital" }).ok === false, "solicitante NÃO cria demanda");
ok(moverEtapa(db, atores.designer, sub.id, "distribuicao").ok, "designer (membro) move planejamento→distribuição");
moverEtapa(db, atores.designer, sub.id, "criacao"); moverEtapa(db, atores.designer, sub.id, "revisao"); moverEtapa(db, atores.designer, sub.id, "aprovacao");
ok(sub.etapa === "aprovacao", "avança até 'aprovação' pelas transições válidas");
ok(moverEtapa(db, atores.designer, sub.id, "publicado").ok === false, "não pula para etapa crítica arrastando");
ok(moverEtapa(db, atores.video, sub.id, "criacao").ok === false, "não-membro não move");

// 4) Versões + dedupe Drive
grp("4. Links e versões (dedupe por ID do Drive)");
const linkA = "https://drive.google.com/file/d/1Aaaaaaaaaa2222222222/view?usp=sharing";
const linkAoutroFormato = "https://drive.google.com/open?id=1Aaaaaaaaaa2222222222";
const v1 = adicionarVersao(db, atores.designer, sub.id, linkA);
ok(v1.ok && v1.numero === 1, "cria V1 (link canônico)");
ok(adicionarVersao(db, atores.designer, sub.id, linkAoutroFormato).ok === false, "bloqueia mesmo arquivo (formato diferente) como nova versão");
ok(adicionarVersao(db, atores.designer, sub.id, "https://exemplo.com/x.pdf").ok === false, "recusa link que não é do Drive");

// 5) Aprovação digital (aprovar × liberar separados)
grp("5. Aprovação digital e liberação de publicação (separadas)");
ok(liberarPublicacao(db, atores.coord, v1.versaoId!).ok === false, "não libera publicação sem aprovar");
ok(aprovarDigital(db, atores.designer, v1.versaoId!, "aprovar").ok === false, "designer não aprova");
ok(aprovarDigital(db, atores.coord, v1.versaoId!, "aprovar").ok, "coordenador aprova (basta um)");
ok(liberarPublicacao(db, atores.diretor, v1.versaoId!).ok, "diretor libera publicação (ação separada)");

// 6) Impressos: dupla aprovação + checklist + liberação manual
grp("6. Fluxo completo dos impressos");
const subImp = criarSubdemanda(db, atores.coord, dem.id, { titulo: "Panfleto dengue", tipo: "impresso", membros: [atores.designer.id] }).sub!;
const vi = adicionarVersao(db, atores.designer, subImp.id, "https://drive.google.com/file/d/1Imp333333334444444455/view");
// pedido com ficha técnica
db.pedidos.push({ id: uid("ped"), subdemandaId: subImp.id, graficaId: "graf_boa", quantidade: "5000", medidas: "15x21", formato: "A5", material: "Couché 150g", acabamento: "4/4", localEntrega: "Sede Vig. Sanitária", prazo: amanha, status: "planejamento", createdAt: agora() });
ok(liberarImpressao(db, atores.diretor, vi.versaoId!).ok === false, "não libera impressão sem as 2 aprovações");
ok(aprovarImpresso(db, atores.coord, vi.versaoId!).ok, "coordenador aprova impresso");
ok(liberarImpressao(db, atores.diretor, vi.versaoId!).ok === false, "ainda bloqueado com só 1 aprovação");
ok(aprovarImpresso(db, atores.diretor, vi.versaoId!).ok, "diretor aprova a MESMA versão");
const lib = liberarImpressao(db, atores.diretor, vi.versaoId!);
ok(lib.ok, "libera impressão (manual) com checklist completo");
ok(db.emails.some(e => e.tipo === "versao_liberada_impressao"), "e-mail 'versão liberada p/ impressão' enfileirado");

// 7) Portal da Gráfica
grp("7. Portal da Gráfica");
ok(pedidosDaGrafica(db, atores.grafica).length === 1, "gráfica vê só o pedido atribuído");
ok(confirmarVersao(db, atores.grafica, db.pedidos[0].id).ok, "gráfica confirma a versão liberada");
// substituição invalida e exige nova confirmação
const vi2 = adicionarVersao(db, atores.designer, subImp.id, "https://drive.google.com/file/d/1Imp999999998888888877/view");
ok(db.confirmacoes.every(c => !c.ativa), "nova versão invalida a confirmação da gráfica");
ok(db.aprovacoes.filter(a => a.versaoId === vi.versaoId && a.ativa).length === 0, "nova versão invalida as aprovações anteriores");

// 8/9/10) Notificações + e-mail (queue)
grp("8/9/10. Notificações internas e e-mails");
ok(db.notificacoes.length > 0, "há notificações internas registradas");
ok(db.emails.every(e => ["convite","recuperacao_senha","pedido_informacoes","solicitacao_aprovada","solicitacao_recusada","solicitacao_cancelada","aprovacao_pendente","correcao_formal","demanda_atrasada","versao_liberada_impressao","versao_substituida","problema_grafica","divergencia","reimpressao","entrega","reabertura"].includes(e.tipo)), "e-mails só para eventos importantes");

// 11) Conversas
grp("11. Conversas internas");
const grpCriacao = db.grupos.find(g => g.nome === "Criação")!;
ok(enviarMensagem(db, atores.designer, grpCriacao.id, "Subi a V1 no Drive", [atores.coord.id]).ok, "designer envia mensagem com menção");
ok(enviarMensagem(db, atores.solSaude, grpCriacao.id, "oi").ok === false, "solicitante NÃO participa do chat interno");
ok(naoLidas(db, atores.coord.id, grpCriacao.id) >= 1, "coordenador tem mensagem não lida");
ok(pesquisar(db, atores.coord, "drive").length >= 1, "pesquisa básica encontra a mensagem");
ok(db.notificacoes.some(n => n.tipo === "mencao"), "menção gera notificação");

// 12) Reabertura + histórico/auditoria + exclusão lógica
grp("12. Reabertura, auditoria e exclusão lógica");
sub.situacao = "ativa"; sub.etapa = "finalizado";
ok(reabrir(db, atores.designer, sub.id, "criacao", "x").ok === false, "designer não reabre");
ok(reabrir(db, atores.coord, sub.id, "criacao", "Ajuste solicitado").ok, "coordenador reabre com justificativa");
ok(db.aprovacoes.filter(a => db.versoes.some(v => v.id === a.versaoId && v.subdemandaId === sub.id) && a.ativa).length === 0, "retorno a etapa anterior invalida aprovações (mas ficam no histórico)");
ok(db.auditoria.some(a => a.acao === "reaberta" && a.justificativa === "Ajuste solicitado"), "reabertura auditada com justificativa");
ok(excluirLogico(db, atores.coord, sub.id, "não será mais executada").ok, "exclusão lógica com justificativa");
ok(db.subdemandas.find(s => s.id === sub.id)!.situacao === "excluida_logicamente", "registro preservado (soft delete)");

console.log(`\n=== RESULTADO: ${pass} passaram, ${fail} falharam ===`);
if (fail > 0) process.exit(1);
