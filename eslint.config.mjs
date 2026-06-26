import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { files: ['src/**/*.{ts,tsx}'] },
  tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.recommended,
  {
    languageOptions: { ...reactPlugin.configs.flat.recommended.languageOptions },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
    },
  },
  { ignores: ['src/grammar/ceql/**'] }
);
