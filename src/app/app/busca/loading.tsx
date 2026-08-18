import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell atual="busca" usuario={{ nome: "…", cargo: "" }}>
      <div className="mb-4"><Skeleton style={{ height: 20, width: 240 }} /></div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card card-pad">
            <Skeleton style={{ height: 12, width: "30%" }} />
            <Skeleton style={{ height: 16, width: "70%", marginTop: 10 }} />
            <Skeleton style={{ height: 12, width: "90%", marginTop: 10 }} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
