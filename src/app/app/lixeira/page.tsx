import { redirect } from "next/navigation";
// Lixeira agora vive dentro de Arquivadas (aba). Mantém o link antigo funcionando.
export default function Lixeira() { redirect("/app/arquivadas?tab=lixeira"); }
