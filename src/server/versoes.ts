import { createSupabaseServer } from "@/lib/supabase-server";
import { normalizarLinkDrive } from "@/lib/drive";
import { exigirPermissao } from "./guard";

// Adiciona nova versão a partir de um link do Drive.
// Detecta duplicidade por ID do arquivo (mensagem amigável) antes do índice do banco.
export async function adicionarVersao(subdemandaId: string, numero: number, linkBruto: string, titulo?: string) {
  await exigirPermissao("editar_operacional");
  const norm = normalizarLinkDrive(linkBruto);
  if (!norm.ok) return { ok: false as const, mensagem: norm.motivo };

  const supabase = createSupabaseServer();

  // Já existe versão ATIVA com o mesmo arquivo nesta subdemanda?
  const { data: existentes } = await supabase
    .from("versoes")
    .select("numero, drive_file_id, estado")
    .eq("subdemanda_id", subdemandaId)
    .not("estado", "in", "(substituida,cancelada)");
  const dup = (existentes ?? []).find((v: any) => v.drive_file_id === norm.fileId);
  if (dup) {
    return { ok: false as const, mensagem: `Este arquivo do Drive já está em uso na versão V${dup.numero}. Cada versão deve ter um arquivo próprio no Drive.` };
  }

  // Inserção: o trigger nova_versao_invalida cuida de invalidar aprovações anteriores;
  // o índice único (subdemanda_id, drive_file_id) é a proteção final.
  const { error } = await supabase.from("versoes").insert({
    subdemanda_id: subdemandaId, numero, titulo: titulo ?? null,
    link_drive: norm.canonical, estado: "em_revisao",
  });
  if (error) {
    if (error.message.includes("versoes_fileid_unico_ativo"))
      return { ok: false as const, mensagem: "Este arquivo do Drive já está em uso em outra versão ativa desta subdemanda." };
    return { ok: false as const, mensagem: "Não foi possível cadastrar a versão. Tente novamente." };
  }
  return { ok: true as const, canonical: norm.canonical, fileId: norm.fileId };
}
