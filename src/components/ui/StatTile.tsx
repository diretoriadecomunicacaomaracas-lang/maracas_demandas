import Link from "next/link";
import { Skeleton } from "./Skeleton";

type Tom = "azul" | "verde" | "amarelo" | "laranja" | "vermelho" | "ciano" | "neutro";
const ACENTO: Record<Tom, string> = {
  azul: "#028EFF", verde: "#4ED980", amarelo: "#FFC605", laranja: "#FF9E22",
  vermelho: "#FF3B2B", ciano: "#0EC7FF", neutro: "#98A1B0",
};

// Indicador clicável reutilizável. Ao clicar, abre a listagem correspondente (href com filtros).
export function StatTile({ label, valor, href, tom = "neutro", hint, loading = false }:
  { label: string; valor: React.ReactNode; href?: string; tom?: Tom; hint?: string; loading?: boolean }) {
  const conteudo = (
    <>
      <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r" style={{ background: ACENTO[tom] }} />
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12.5px] text-neutro-text2">{label}</div>
        {hint && <span className="text-[11px] text-neutro-text3" title={hint}>{hint}</span>}
      </div>
      <div className="text-[26px] font-extrabold leading-tight mt-1">
        {loading ? <Skeleton style={{ width: 48, height: 26 }} /> : valor}
      </div>
    </>
  );
  const cls = "relative card card-pad pl-5 anim-in block";
  if (href) return <Link href={href} className={`${cls} hoverable pressable`}>{conteudo}</Link>;
  return <div className={cls}>{conteudo}</div>;
}
