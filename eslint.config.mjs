import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: ["dist/**", "backend/**", "node_modules/**"] },
  ...compat.extends("eslint:recommended"),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
    },
  },
];

export default eslintConfig;
