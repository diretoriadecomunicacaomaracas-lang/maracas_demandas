# CONFIGURAÇÃO DE E-MAIL

E-mail em **camada desacoplada** (`src/server/email.ts`). Provedor via `EMAIL_PROVIDER` (`resend` padrão, ou `smtp`). Toda tentativa é registrada em `emails_enviados` (tentativas, situação, erro) para auditoria.

## Resend (recomendado)
1. Crie conta em Resend e **verifique um domínio** de envio.
2. Defina no `.env.local`: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY=...`, `EMAIL_FROM="Comunicação Maracás <no-reply@SEU-DOMINIO>"`.

## SMTP (alternativa)
Defina `EMAIL_PROVIDER=smtp` e `SMTP_HOST/PORT/USER/PASSWORD`. O provider SMTP está abstraído; implementar com nodemailer mantendo a interface `EmailProvider`.

## Quando o sistema envia e-mail (apenas eventos importantes — v2.2)
Convite de ativação; recuperação de senha; pedido de informações; solicitação aprovada/recusada/cancelada; material aguardando aprovação; correção formal; demanda atrasada (1ª vez); versão liberada para impressão; versão substituída; problema/divergência na gráfica; reimpressão; entrega; reabertura. **Resumo diário de atrasos às 8h (America/Sao_Paulo)**, agrupado, via cron protegido por `CRON_SECRET`.

## Segurança
`SUPABASE_SERVICE_ROLE_KEY` e chaves de e-mail são **somente do servidor**. Nunca expor no frontend. Nunca enviar senha em texto aberto (convite/recuperação usam link seguro de uso único, validade 24h).
