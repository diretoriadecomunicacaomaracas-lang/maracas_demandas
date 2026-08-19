"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const AJUDA: { chave: string; titulo: string; itens: string[] }[] = [
  { chave: "/app/painel", titulo: "Painel", itens: ["Cards de indicadores são clicáveis e abrem a lista filtrada.", "Alertas mostram regras reais (sem responsável, publicações sem aprovação, atrasos).", "Gráficos usam dados reais do Supabase."] },
  { chave: "/app/solicitacoes", titulo: "Central de Solicitações", itens: ["Pendentes em ordem cronológica (mais antiga primeiro).", "A única ação da linha é Analisar.", "Na análise, use “Aprovar para Planejamento” no topo."] },
  { chave: "/app/planejamento", titulo: "Planejamento", itens: ["Backlog reúne o que foi aprovado e ainda não foi programado.", "Uma demanda só entra no calendário com responsável definido.", "Ao agendar, o status vira “Aguardando distribuição”."] },
  { chave: "/app/demandas", titulo: "Demandas", itens: ["Abre no Kanban; Tabela e Finalizadas são visões secundárias.", "Arraste os cartões entre etapas de produção.", "Etapas de aprovação/liberação avançam por ação, não por arraste."] },
  { chave: "/app/criacao", titulo: "Criação", itens: ["“Minha fila” mostra só o que é seu; “Equipe” mostra todos.", "Cartões trazem prioridade, prazo, etapa e participantes.", "Clique no cartão para abrir a tarefa."] },
  { chave: "/app/audiovisual", titulo: "Audiovisual", itens: ["Gravações de hoje/próximas, edição, revisão e correção.", "Carga por profissional da área.", "Clique no cartão para abrir a tarefa."] },
  { chave: "/app/impressos", titulo: "Impressos", itens: ["Visão gerencial por etapa do fluxo de impressão.", "Acompanhe também a carga por gráfica."] },
  { chave: "/app/calendario", titulo: "Calendário", itens: ["Visão compartilhada da equipe (somente leitura).", "É alimentado pelo Planejamento.", "Impressos não entram no calendário editorial."] },
  { chave: "/app/conversas", titulo: "Bate-papo", itens: ["Grupos internos (Geral, Criação, Audiovisual).", "Use @nome para mencionar — a pessoa recebe notificação.", "Mensagens não lidas aparecem com contador."] },
  { chave: "/app/arquivadas", titulo: "Arquivadas e Lixeira", itens: ["Arquivadas: concluídas/arquivadas, pesquisáveis e restauráveis.", "Lixeira: excluídas logicamente, com retenção de 30 dias."] },
  { chave: "/app/admin", titulo: "Administração", itens: ["Usuários, Secretarias, Setores, Gráficas, Grupos e Convites.", "Criação de usuário usa convite seguro (a pessoa define a própria senha).", "Ações ficam registradas em auditoria."] },
];
const LEGENDA = [["Planejamento", "amarelo"], ["Em produção", "laranja"], ["Revisão/Aprovação", "laranjaverm"], ["Concluído", "verde"]];

export function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ctx = AJUDA.find((a) => path.startsWith(a.chave)) ?? { titulo: "Ajuda", itens: ["Selecione uma área para ver dicas específicas."] };
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ajuda desta página" className="w-10 h-10 rounded-[10px] hover:bg-neutro-surface2 pressable">?</button>
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/40 anim-fade" onClick={() => setOpen(false)}>
          <aside className="absolute right-0 top-0 bottom-0 w-[380px] max-w-[92vw] bg-white border-l border-neutro-border shadow-lg p-5 overflow-auto anim-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ajuda">
            <div className="flex items-center gap-2 mb-3"><h2 className="font-bold flex-1">Ajuda · {ctx.titulo}</h2><button aria-label="Fechar" onClick={() => setOpen(false)} className="pressable">✕</button></div>
            <ul className="flex flex-col gap-2 mb-5">
              {ctx.itens.map((i, k) => <li key={k} className="flex gap-2 text-[13.5px] text-neutro-text2"><span aria-hidden className="text-marca-azul">•</span>{i}</li>)}
            </ul>
            <div className="border-t border-neutro-border pt-3">
              <div className="text-[11px] font-bold uppercase text-neutro-text3 mb-2">Legenda de etapas</div>
              <div className="flex flex-wrap gap-2">{LEGENDA.map(([nome, tom]) => <span key={nome} className={`text-[12px] px-2 py-0.5 rounded-full tone-${tom}`}>{nome}</span>)}</div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
