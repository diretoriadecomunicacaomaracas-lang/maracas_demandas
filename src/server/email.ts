// Camada de e-mail desacoplada (v2.2): eventos importantes apenas. Sem fornecedor fixo.
import { createSupabaseAdmin } from "@/lib/supabase-admin";

type EmailInput = { para: string; assunto: string; html: string; tipo: string };

interface EmailProvider { enviar(i: EmailInput): Promise<void>; }

class ResendProvider implements EmailProvider {
  async enviar(i: EmailInput) {
    const { Resend } = await import("resend");
    const r = new Resend(process.env.RESEND_API_KEY!);
    await r.emails.send({ from: process.env.EMAIL_FROM!, to: i.para, subject: i.assunto, html: i.html });
  }
}
class SmtpProvider implements EmailProvider {
  async enviar(_i: EmailInput) {
    // Implementar via nodemailer quando SMTP_* estiver configurado. Mantém a abstração.
    throw new Error("SMTP não configurado — defina EMAIL_PROVIDER=resend ou implemente o provider SMTP.");
  }
}
function provider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "smtp" ? new SmtpProvider() : new ResendProvider();
}

// Envia e registra tentativa/situação em emails_enviados (auditável).
export async function enviarEmail(i: EmailInput) {
  const admin = createSupabaseAdmin();
  const { data: reg } = await admin.from("emails_enviados")
    .insert({ destinatario: i.para, assunto: i.assunto, tipo: i.tipo, tentativas: 1, situacao: "pendente" })
    .select("id").single();
  try {
    await provider().enviar(i);
    await admin.from("emails_enviados").update({ situacao: "enviado", enviado_em: new Date().toISOString() }).eq("id", reg?.id);
  } catch (e: any) {
    await admin.from("emails_enviados").update({ situacao: "falha", ultimo_erro: String(e?.message ?? e) }).eq("id", reg?.id);
    throw e;
  }
}
