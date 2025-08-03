import eslintPluginPrettier from "eslint-plugin-prettier";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      env: {
        node: true,
        es2024: true,
        jest: true,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    extends: ["eslint:recommended"],
    rules: {
      "no-console": "warn",
      eqeqeq: "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prettier/prettier": "error",
    },
  },
];
