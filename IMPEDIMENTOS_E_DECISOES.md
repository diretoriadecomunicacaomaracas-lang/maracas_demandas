# IMPEDIMENTOS E DECISÕES

Contradições reais e decisões tomadas sem alterar silenciosamente a v2.2. Até o momento, **nenhuma contradição** entre a v2.2, o protótipo e o adendo foi encontrada.

## Decisões de implementação (coerentes com a v2.2)
1. **Admin × reabertura:** a v2.2 restringe a reabertura a Diretor/Coordenador. O Administrador tem governança de contas/permissões, mas **não** recebe `reabrir_demanda`. Mantido conforme a v2.2 (a sugestão de tornar ações de segurança exclusivas do Admin ficou em "Sugestões", não aplicada).
2. **Impresso — liberação:** modelada como `liberacoes(tipo='impressao')` habilitada só quando `pode_liberar_impressao(versao)` for verdadeira; executável por Diretor OU Coordenador; nunca automática.
3. **Link único por versão:** garantido por índice parcial (versões ativas). A app deve alertar antes de tentar reusar um link (mensagem amigável) — o banco é a rede de segurança.
4. **Storage:** nenhum arquivo pesado no sistema; apenas links do Drive (sem Supabase Storage para artes/vídeos/impressão), conforme v2.2.

## Impedimentos operacionais (ação humana necessária)
- **Credenciais externas** (Supabase, Resend/SMTP, Vercel) não podem ser geradas pela automação. A fundação está pronta com variáveis de ambiente; ao fornecê-las, as fases seguintes rodam de ponta a ponta. Ver `ARQUITETURA.md §7` e `IMPLANTACAO.md`.
- **Execução/homologação** (aplicar migrations num Supabase real, criar usuários, deploy Vercel) depende das credenciais acima.

## Decisões aprovadas pelo cliente (confirmadas nesta rodada)
1. Reabertura de demanda exclusivamente por Diretor ou Coordenador — Administrador **não** recebe `reabrir_demanda`. (Mantido.)
2. Liberação de impressão como ação **única e manual**, habilitada só após aprovação do Diretor **e** do Coordenador na mesma versão. (Reforçada em `validar_liberacao_impressao`.)
3. Armazenamento **somente de links e metadados**; sem Supabase Storage para artes, vídeos, impressos ou arquivos pesados. (Mantido.)
4. Aplicação e homologação reais **somente após** o fornecimento das credenciais externas. (Estrutura pronta; execução aguarda credenciais.)
