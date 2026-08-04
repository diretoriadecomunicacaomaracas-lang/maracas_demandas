import type { Config } from "tailwindcss";

// Tokens derivados de 02_design_system.md (protótipo aprovado). Não alterar por preferência.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          azul: "#028EFF", ciano: "#0EC7FF", verdelimao: "#8EEA00",
          amarelo: "#FFC605", laranja: "#FF9E22", laranjaverm: "#FF6729",
          vermelho: "#FF3B2B", verde: "#4ED980",
        },
        neutro: {
          bg: "#F7F8FA", surface: "#FFFFFF", surface2: "#F2F4F7", border: "#E6E9EF",
          text: "#1F2430", text2: "#5B6472", text3: "#98A1B0", disabled: "#EEF1F5",
        },
      },
      borderRadius: { md: "10px", lg: "14px" },
      boxShadow: {
        sm: "0 1px 2px rgba(16,24,40,.06)",
        md: "0 6px 20px rgba(16,24,40,.08)",
        lg: "0 16px 40px rgba(16,24,40,.16)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
