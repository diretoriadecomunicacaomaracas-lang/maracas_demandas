// Normalização de links do Google Drive (ajuste obrigatório da Etapa 3).
// O mesmo arquivo pode ter várias URLs; a duplicidade é detectada pelo ID do arquivo.

export type DriveTipo = "arquivo" | "documento" | "planilha" | "apresentacao" | "pasta";
export type DriveResultado =
  | { ok: true; fileId: string; tipo: DriveTipo; canonical: string }
  | { ok: false; motivo: string };

// IDs do Drive: normalmente 25–44 chars [A-Za-z0-9_-]. Aceitamos >= 10 por segurança.
const ID = "[A-Za-z0-9_-]{10,}";

const PADROES: { re: RegExp; tipo: DriveTipo }[] = [
  { re: new RegExp(`/file/d/(${ID})`), tipo: "arquivo" },
  { re: new RegExp(`/document/d/(${ID})`), tipo: "documento" },
  { re: new RegExp(`/spreadsheets/d/(${ID})`), tipo: "planilha" },
  { re: new RegExp(`/presentation/d/(${ID})`), tipo: "apresentacao" },
  { re: new RegExp(`/drive/folders/(${ID})`), tipo: "pasta" },
  { re: new RegExp(`[?&]id=(${ID})`), tipo: "arquivo" }, // open?id=, uc?id=, ...
];

const CANONICO: Record<DriveTipo, (id: string) => string> = {
  arquivo: (id) => `https://drive.google.com/file/d/${id}/view`,
  documento: (id) => `https://docs.google.com/document/d/${id}/edit`,
  planilha: (id) => `https://docs.google.com/spreadsheets/d/${id}/edit`,
  apresentacao: (id) => `https://docs.google.com/presentation/d/${id}/edit`,
  pasta: (id) => `https://drive.google.com/drive/folders/${id}`,
};

// Extrai fileId + tipo + URL canônica. Erro claro se não for um arquivo do Drive.
export function normalizarLinkDrive(urlBruta: string): DriveResultado {
  const url = (urlBruta || "").trim();
  if (!url) return { ok: false, motivo: "Informe um link do Google Drive." };
  const ehDrive = /(?:drive|docs)\.google\.com/i.test(url);
  if (!ehDrive) {
    return { ok: false, motivo: "Este link não parece ser do Google Drive. Cole o link de compartilhamento do arquivo no Drive." };
  }
  for (const { re, tipo } of PADROES) {
    const m = url.match(re);
    if (m && m[1]) {
      const fileId = m[1];
      return { ok: true, fileId, tipo, canonical: CANONICO[tipo](fileId) };
    }
  }
  return { ok: false, motivo: "Não foi possível identificar o arquivo neste link do Drive. Use o link de compartilhamento (ex.: .../file/d/ID/view)." };
}

// Só o ID (para comparação/dedupe). Null quando não identificável.
export function driveFileId(url: string): string | null {
  const r = normalizarLinkDrive(url);
  return r.ok ? r.fileId : null;
}

// Mesmo arquivo? (compara por ID, não pela URL textual).
export function mesmoArquivoDrive(a: string, b: string): boolean {
  const ida = driveFileId(a), idb = driveFileId(b);
  return !!ida && ida === idb;
}
