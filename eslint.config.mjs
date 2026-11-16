import eslintPluginImport from "eslint-plugin-import"
import eslintPluginNext from "@next/eslint-plugin-next"
import typescriptEslint from "typescript-eslint"

export default typescriptEslint.config(
  {
    ignores: [
      ".git/",
      ".next/",
      ".next-performance*/",
      ".next-test-cache/",
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "playwright-report/",
      "test-results/",
      "public/jiangshan-atlas/**",
      "*.min.js",
      "*.config.js",
      "**/*.d.ts",
    ],
  },
  typescriptEslint.configs.recommended,
  eslintPluginImport.flatConfigs.recommended,
  {
    plugins: { "@next/next": eslintPluginNext },
    settings: {
      "import/resolver": { typescript: true, node: true },
      // Next.js resolves this framework-provided marker during compilation.
      "import/core-modules": ["server-only"],
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "sort-imports": ["error", { ignoreCase: true, ignoreDeclarationSort: true }],
      "import/order": "off",
    },
  }
)
