import js from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"

export default [
  {
    ignores: ["node_modules/**", ".next/**", "clothing_store-main/**"],
  },
  js.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: nextPlugin.configs["core-web-vitals"].rules,
  },
]
