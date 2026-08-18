"use client";
import { useRouter } from "next/navigation";
export function LinhaDemanda({ id, children }: { id: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr className="border-t border-neutro-border hover:bg-neutro-surface2 cursor-pointer"
      onClick={(e) => { const el = e.target as HTMLElement; if (el.closest("a,button,input,select,label")) return; router.push(`/app/demandas/${id}`); }}>
      {children}
    </tr>
  );
}
