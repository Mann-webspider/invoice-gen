module.exports = {
  root: true,
  env: { browser: true, node: true, es2023: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['node_modules', 'out', 'dist', 'release', '*.cjs'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true, allowTypedFunctionExpressions: true }
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }
    ],
    'no-console': ['error', { allow: ['warn', 'error'] }]
  },
  overrides: [
    {
      // Developer CLIs: their whole output is stdout.
      files: ['scripts/**/*.ts'],
      rules: { 'no-console': 'off' }
    },
    {
      // shadcn primitives are generated: keep them byte-comparable with
      // upstream rather than reformatting them to local house style.
      files: ['src/renderer/src/components/ui/**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-empty-object-type': 'off'
      }
    }
  ]
}
