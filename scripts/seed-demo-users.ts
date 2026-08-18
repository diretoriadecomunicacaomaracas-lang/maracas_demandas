/**
 * Cria usuários de homologação em auth.users + perfis em public.usuarios.
 * Uso: defina SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL e rode:
 *   npx tsx scripts/seed-demo-users.ts
 * Senhas são apenas para HOMOLOGAÇÃO. Nunca use em produção.
 */
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const SENHA = "Homolog@2026"; // documentada em docs/CONTAS_HOMOLOGACAO.md

const users = [
  { email: "admin@maracas.ba.gov.br", nome: "Administração", cargo: "administrador", ambiente: "interno" },
  { email: "diretor@maracas.ba.gov.br", nome: "Diretor de Comunicação", cargo: "diretor", ambiente: "interno" },
  { email: "coord@maracas.ba.gov.br", nome: "Marina Braga", cargo: "coordenador", ambiente: "interno" },
  { email: "designer@maracas.ba.gov.br", nome: "Ana Ribeiro", cargo: "designer", ambiente: "interno" },
  { email: "video@maracas.ba.gov.br", nome: "Rafael Souza", cargo: "videomaker", ambiente: "interno" },
  { email: "social@maracas.ba.gov.br", nome: "Time Social", cargo: "social_media", ambiente: "interno" },
  { email: "saude@maracas.ba.gov.br", nome: "João Meireles", cargo: "solicitante", ambiente: "solicitante", secretaria: "Saúde" },
  { email: "educacao@maracas.ba.gov.br", nome: "Rita Alves", cargo: "solicitante", ambiente: "solicitante", secretaria: "Educação" },
  { email: "grafica@boaimpressao.com.br", nome: "Gráfica Boa Impressão", cargo: "grafica", ambiente: "grafica" },
  { email: "leitura@maracas.ba.gov.br", nome: "Visualizador", cargo: "visualizador", ambiente: "interno" },
];

async function main() {
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: SENHA, email_confirm: true });
    if (error) { console.warn(`skip ${u.email}: ${error.message}`); continue; }
    const uid = data.user!.id;
    let secretaria_id: string | null = null;
    if (u.secretaria) {
      const { data: s } = await admin.from("secretarias").select("id").eq("nome", u.secretaria).single();
      secretaria_id = s?.id ?? null;
    }
    await admin.from("usuarios").insert({ id: uid, nome: u.nome, email: u.email, ambiente_principal: u.ambiente, secretaria_id, situacao: "ativa" });
    const { data: c } = await admin.from("cargos").select("id").eq("chave", u.cargo).single();
    if (c) await admin.from("usuario_cargos").insert({ usuario_id: uid, cargo_id: c.id });
    console.log(`ok ${u.email}`);
  }
}
main().then(() => process.exit(0));
