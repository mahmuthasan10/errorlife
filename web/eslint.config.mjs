import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
//tamam mobil açılıoyr keşfettiğim hatalar ai özelliğinin çalışmaması bilidirmler kısmında biri gönderini beğendi diyordu ama yorumları açıyordu oralarda falan düzeltme yapılması lazım bir de sen kendinde kontroller yapmalısın tabi önce bu mu web deployu düzeltmek mi o da var plan yapmanı istiyorum 