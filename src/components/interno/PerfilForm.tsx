"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { atualizarMeuPerfil } from "@/server/data/perfil";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const MAX = 5 * 1024 * 1024; const TIPOS = ["image/jpeg", "image/png", "image/webp"];

export function PerfilForm({ id, nome0, avatar0 }: { id: string; nome0: string; avatar0: string | null }) {
  const [nome, setNome] = useState(nome0);
  const [avatar, setAvatar] = useState<string | null>(avatar0);
  const [pending, start] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter(); const toast = useToast();

  async function upload(file: File) {
    if (!TIPOS.includes(file.type)) { toast.erro("Formato inválido (use JPG, PNG ou WebP)."); return; }
    if (file.size > MAX) { toast.erro("Imagem acima de 5 MB."); return; }
    setEnviando(true);
    try {
      const sb = createSupabaseBrowser();
      const ext = file.name.split(".").pop() || "png";
      const path = `${id}/${Date.now()}.${ext}`;
      const { error } = await sb.storage.from("avatares").upload(path, file, { upsert: true });
      if (error) { toast.erro("Upload indisponível (bucket 'avatares' ainda não configurado). Use uma URL por enquanto."); return; }
      const { data } = sb.storage.from("avatares").getPublicUrl(path);
      setAvatar(data.publicUrl);
      toast.sucesso("Foto carregada. Clique em Salvar.");
    } finally { setEnviando(false); }
  }
  function salvar() {
    start(async () => {
      const r = await atualizarMeuPerfil({ nome, avatarUrl: avatar });
      if (r.ok) { toast.sucesso("Perfil atualizado."); router.refresh(); } else toast.erro(r.erro ?? "Erro.");
    });
  }

  return (
    <div className="card card-pad max-w-[560px]">
      <div className="flex items-center gap-4 mb-4">
        <Avatar nome={nome || "?"} url={avatar} size={72} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={enviando}>{enviando ? "Enviando…" : "Trocar foto"}</Button>
            {avatar && <Button variant="danger" onClick={() => setAvatar(null)}>Remover</Button>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          <input className="inp h-9" placeholder="…ou cole a URL de uma imagem" value={avatar ?? ""} onChange={(e) => setAvatar(e.target.value || null)} />
        </div>
      </div>
      <label className="block mb-3"><span className="block text-[13px] font-semibold mb-1">Nome</span>
        <input className="inp" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
      <Button variant="primary" disabled={pending} onClick={salvar}>{pending ? "Salvando…" : "Salvar"}</Button>
    </div>
  );
}
