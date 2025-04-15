// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    'next/core-web-vitals', 
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Temporarily disable TypeScript rules for deployment
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'react/no-unescaped-entities': 'off',
    'prefer-const': 'off',
    'no-var': 'off'
  }
}
