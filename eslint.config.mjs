import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
export default [
  { ignores: ['dist/**', 'backend/**', 'node_modules/**', 'infra/**', 'work/**'] },
  { files: ['src/**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser }, plugins: { 'react-hooks': hooks },
    rules: { 'react-hooks/exhaustive-deps': 'error', 'no-debugger': 'error', 'no-constant-condition': 'error' } },
];
