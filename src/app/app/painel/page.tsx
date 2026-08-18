import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { dadosPainel, type ItemPainel } from "@/server/data/painel";
import { StatTile } from "@/components/ui/StatTile";
import { SectionCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarrasHorizontais, Colunas, Rosca } from "@/components/ui/Chart";
import { STATUS } from "@/lib/statuses";
import { LIMITES_CARGA } from "@/domain/carga";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
const dtBR = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

function Lista({ itens, vazio, max = 5 }: { itens: ItemPainel[]; vazio: string; max?: number }) {
  if (!itens.length) return <p className="text-neutro-text3 text-[13px]">{vazio}</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {itens.slice(0, max).map((s) => (
        <li key={s.id}>
          <Link href={s.url} className="flex items-center gap-2 rounded-md hover:bg-neutro-surface2 -mx-1 px-1 py-1 pressable">
            <span className="flex-1 text-[13px] text-neutro-text truncate">{s.titulo}</span>
            {s.etapa && <span className="text-[11px] text-neutro-text3 hidden sm:inline">{(STATUS[s.etapa] as any)?.label ?? s.etapa}</span>}
            <span className="text-[11px] text-neutro-text2 tabular-nums">{dtBR(s.quando)}</span>
          </Link>
        </li>
      ))}
      {itens.length > max && <li className="text-[12px] text-neutro-text3 px-1">+{itens.length - max} outras</li>}
    </ul>
  );
}
function Mini({ label, n, href, tom }: { label: string; n: number; href: string; tom: string }) {
  return (
    <Link href={href} className="card card-pad pressable hoverable flex items-center justify-between gap-2">
      <span className="text-[12.5px] text-neutro-text2">{label}</span>
      <span className={`text-[18px] font-extrabold tone-${tom} px-2 rounded-md`}>{n}</span>
    </Link>
  );
}

export default async function Painel() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const d = await dadosPainel();
  const k = d.indicadores;
  const cards: [string, number, string, any][] = [
    ["Novas solicitações", k.novas, "/app/solicitacoes", "azul"],
    ["Demandas em andamento", k.andamento, "/app/demandas", "ciano"],
    ["Aguardando aprovação", k.aprovacao, "/app/demandas?filtro=aprovacao", "amarelo"],
    ["Atrasadas", k.atrasadas, "/app/demandas?filtro=atrasadas", "vermelho"],
    ["Publicações hoje", k.pubHoje, "/app/calendario", "verde"],
    ["Publicações próx. 7 dias", k.pub7, "/app/calendario", "verde"],
    ["Impressos aguardando aprovação", k.impAprov, "/app/impressos", "laranja"],
    ["Impressos em produção", k.impProd, "/app/impressos", "laranja"],
  ];

  return (
    <AppShell atual="painel" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold">Painel principal</h1>
        <p className="text-neutro-text2 text-[13px]">Visão operacional · dados reais · horário de Brasília</p>
      </div>

      {d.alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {d.alertas.map((a, i) => (
            <Link key={i} href={a.url} className={`flex items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-medium pressable tone-${a.tom}`}>
              <span aria-hidden>⚠</span><span className="flex-1">{a.texto}</span><span aria-hidden>→</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 stagger mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
        {cards.map(([lab, val, href, tom]) => <StatTile key={lab} label={lab} valor={val} href={href} tom={tom} />)}
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <SectionCard titulo="Operação de hoje" icone="◷">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Mini label="Prazos hoje" n={d.operacaoHoje.prazosHoje.length} href="/app/demandas" tom="amarelo" />
            <Mini label="Publicações hoje" n={d.operacaoHoje.publicacoesHoje.length} href="/app/calendario" tom="verde" />
            <Mini label="Aprovações pendentes" n={d.operacaoHoje.aprovacoesPendentes} href="/app/demandas?filtro=aprovacao" tom="laranjaverm" />
            <Mini label="Atrasadas" n={d.operacaoHoje.atrasadas.length} href="/app/demandas?filtro=atrasadas" tom="vermelho" />
            <Mini label="Gravações hoje" n={d.operacaoHoje.gravacoesHoje.length} href="/app/audiovisual" tom="laranja" />
            <Mini label="Sem responsável" n={d.operacaoHoje.semResponsavel.length} href="/app/demandas?filtro=sem_responsavel" tom="neutro" />
          </div>
          <div className="text-[12px] font-bold uppercase text-neutro-text3 mb-1">Prazos de hoje</div>
          <Lista itens={d.operacaoHoje.prazosHoje} vazio="Nenhuma tarefa com prazo hoje." />
        </SectionCard>

        <SectionCard titulo="Próximos 7 dias" icone="▦">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Mini label="Publicações" n={d.prox7.publicacoes.length} href="/app/calendario" tom="verde" />
            <Mini label="Prazos" n={d.prox7.prazos.length} href="/app/demandas" tom="amarelo" />
            <Mini label="Gravações" n={d.prox7.gravacoes.length} href="/app/audiovisual" tom="laranja" />
            <Mini label="Eventos" n={d.prox7.eventos.length} href="/app/calendario" tom="ciano" />
          </div>
          <div className="text-[12px] font-bold uppercase text-neutro-text3 mb-1">Publicações previstas</div>
          <Lista itens={d.prox7.publicacoes} vazio="Nenhuma publicação prevista." />
        </SectionCard>
      </div>

      <SectionCard titulo="Carga da equipe" icone="👥" className="mb-6"
        acao={<span className="text-[11px] text-neutro-text3">Alerta: ≥{LIMITES_CARGA.ativasMin} ativas ou ≥{LIMITES_CARGA.atrasadasMin} atrasadas</span>}>
        <p className="text-[12px] text-neutro-text3 mb-3">Indicador operacional de distribuição — não é avaliação de desempenho. {d.aguardandoDistribuicao} aguardando distribuição.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[520px]">
            <thead><tr className="text-left text-[11px] uppercase text-neutro-text3"><th className="py-1">Profissional</th><th className="py-1">Ativas</th><th className="py-1">Atrasadas</th><th className="py-1">Vencendo (3d)</th><th className="py-1"></th></tr></thead>
            <tbody>
              {d.carga.filter((c) => c.ativas > 0).map((c) => (
                <tr key={c.id} className="border-t border-neutro-border">
                  <td className="py-1.5"><Link href={`/app/demandas?prof=${c.id}`} className="font-medium hover:text-marca-azul">{c.nome}</Link></td>
                  <td className="py-1.5 tabular-nums">{c.ativas}</td>
                  <td className="py-1.5 tabular-nums">{c.atrasadas > 0 ? <span className="text-[#B32219] font-semibold">{c.atrasadas}</span> : c.atrasadas}</td>
                  <td className="py-1.5 tabular-nums">{c.vencendo}</td>
                  <td className="py-1.5">{c.elevada && <span className="text-[11px] font-semibold tone-laranja px-2 py-0.5 rounded-full" title={c.motivo ?? ""}>carga elevada</span>}</td>
                </tr>
              ))}
              {d.carga.every((c) => c.ativas === 0) && <tr><td colSpan={5} className="py-3 text-neutro-text3">Ninguém com demandas ativas.</td></tr>}
            </tbody>
          </table>
        </div>
        {d.semDemanda.length > 0 && <p className="text-[12px] text-neutro-text3 mt-2">Sem demandas: {d.semDemanda.join(", ")}.</p>}
      </SectionCard>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <SectionCard titulo="Solicitações por secretaria" icone="🏛"><BarrasHorizontais dados={d.secretarias.solicitacoes} hrefDe={(x) => `/app/solicitacoes`} cor="#028EFF" /></SectionCard>
        <SectionCard titulo="Demandas por secretaria" icone="🏛"><BarrasHorizontais dados={d.secretarias.demandas} hrefDe={(x) => `/app/demandas?grupo=${x.chave}`} cor="#0EC7FF" /></SectionCard>
        <SectionCard titulo="Publicações por secretaria" icone="🏛"><BarrasHorizontais dados={d.secretarias.publicacoes} hrefDe={(x) => `/app/demandas?grupo=${x.chave}`} cor="#4ED980" /></SectionCard>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <SectionCard titulo="Abertas por tipo" icone="▣"><Rosca dados={d.graficos.porTipo} /></SectionCard>
        <SectionCard titulo="Distribuição por status" icone="▣"><Rosca dados={d.graficos.distribuicaoStatus} /></SectionCard>
        <SectionCard titulo="Volume mensal (novas)" icone="▤"><Colunas dados={d.graficos.volumeMensal} cor="#028EFF" /></SectionCard>
        <SectionCard titulo="Concluídas por mês" icone="✓"><Colunas dados={d.graficos.concluidasPorMes} cor="#4ED980" /></SectionCard>
      </div>
    </AppShell>
  );
}
