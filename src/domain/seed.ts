// Seed fictício em memória (homologação local, sem credenciais).
import type { Store } from "./store.ts";
import { novoStore, uid, agora } from "./store.ts";
import type { Ator } from "./types.ts";

export function seedStore(): { db: Store; atores: Record<string, Ator> } {
  const db = novoStore();
  const sSaude = { id: "sec_saude", nome: "Saúde", unidades: [{ id: "u_epi", nome: "Vig. Epidemiológica" }, { id: "u_san", nome: "Vig. Sanitária" }] };
  const sEdu = { id: "sec_edu", nome: "Educação", unidades: [] };
  db.secretarias.push(sSaude, sEdu);
  const graf = { id: "graf_boa", nome: "Gráfica Boa Impressão", ativa: true };
  db.graficas.push(graf);
  for (const nome of ["Geral","Coordenação","Criação","Audiovisual","Social Media e Publicações","Jornalismo e Coberturas","Impressos"])
    db.grupos.push({ id: uid("grp"), nome, membros: ["u_coord","u_designer","u_video"], arquivado: false });

  const atores: Record<string, Ator> = {
    diretor: { id: "u_dir", nome: "Diretor", cargos: ["diretor"], ambiente: "interno" },
    coord: { id: "u_coord", nome: "Marina Braga", cargos: ["coordenador"], ambiente: "interno" },
    designer: { id: "u_designer", nome: "Ana Ribeiro", cargos: ["designer"], ambiente: "interno" },
    video: { id: "u_video", nome: "Rafael Souza", cargos: ["videomaker"], ambiente: "interno" },
    social: { id: "u_social", nome: "Time Social", cargos: ["social_media"], ambiente: "interno" },
    admin: { id: "u_admin", nome: "Admin", cargos: ["administrador"], ambiente: "interno" },
    visual: { id: "u_visual", nome: "Visualizador", cargos: ["visualizador"], ambiente: "interno" },
    solSaude: { id: "u_sol_saude", nome: "João Meireles", cargos: ["solicitante"], ambiente: "solicitante", secretariaId: "sec_saude" },
    solEdu: { id: "u_sol_edu", nome: "Rita Alves", cargos: ["solicitante"], ambiente: "solicitante", secretariaId: "sec_edu" },
    grafica: { id: "u_graf", nome: "Gráfica", cargos: ["grafica"], ambiente: "grafica", graficaId: "graf_boa" },
  };
  return { db, atores };
}
