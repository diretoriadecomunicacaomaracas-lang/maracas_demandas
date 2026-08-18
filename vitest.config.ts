import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // Vitest cobre os testes unitários (formato describe/it). Os arquivos em
  // tests/integration/ são scripts próprios executados por `npm run test:local`
  // (runner tsx), não seguem o formato do Vitest — por isso ficam fora do glob.
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"] },
});
