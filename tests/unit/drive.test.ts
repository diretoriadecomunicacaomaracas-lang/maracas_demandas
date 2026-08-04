import { describe, it, expect } from "vitest";
import { normalizarLinkDrive, driveFileId, mesmoArquivoDrive } from "@/lib/drive";

describe("normalização de links do Google Drive", () => {
  const f = "https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jKLmnOpQ/view?usp=sharing";
  const open = "https://drive.google.com/open?id=1A2b3C4d5E6f7G8h9I0jKLmnOpQ";
  const uc = "https://drive.google.com/uc?export=download&id=1A2b3C4d5E6f7G8h9I0jKLmnOpQ";

  it("extrai o mesmo ID de formatos diferentes do mesmo arquivo", () => {
    expect(driveFileId(f)).toBe("1A2b3C4d5E6f7G8h9I0jKLmnOpQ");
    expect(mesmoArquivoDrive(f, open)).toBe(true);
    expect(mesmoArquivoDrive(f, uc)).toBe(true);
  });
  it("reconhece docs/sheets/slides/folders", () => {
    expect(normalizarLinkDrive("https://docs.google.com/document/d/1zzzXXXyyy0000AAAbbb/edit")).toMatchObject({ ok: true, tipo: "documento" });
    expect(normalizarLinkDrive("https://drive.google.com/drive/folders/1FolderIDfolderIDfolder")).toMatchObject({ ok: true, tipo: "pasta" });
  });
  it("gera URL canônica", () => {
    const r = normalizarLinkDrive(open);
    expect(r.ok && r.canonical).toBe("https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jKLmnOpQ/view");
  });
  it("informa claramente quando não é um arquivo do Drive", () => {
    expect(normalizarLinkDrive("https://exemplo.com/arquivo.pdf").ok).toBe(false);
    expect(normalizarLinkDrive("https://drive.google.com/algo-sem-id").ok).toBe(false);
  });
});
