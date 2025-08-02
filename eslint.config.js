import eslintPluginPrettier from "eslint-plugin-prettier";

export default [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      //'no-console': 'warn',
      "prettier/prettier": "error",
    },
  },
];
