import { defineConfig, globalIgnores } from 'eslint/config';
import sharedConfig from '@n2base/eslint-config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...sharedConfig,
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'dist/**',
    'playwright-report/**',
    'test-results/**',
    '*.config.js',
    '*.config.mjs',
  ]),

  {
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'array-callback-return': 'error',
      eqeqeq: 'error',
      'no-alert': 'error',
      'no-return-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-empty-pattern': 'error',
      'no-unused-vars': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=required][callee.object.callee.property.name=nullable]',
          message:
            '.nullable() should be after .required() for correct validation and type inference. Example: id: yup.string().required().nullable()',
        },
        {
          selector:
            'CallExpression[callee.name=watch], MemberExpression[object.name=methods][property.name=watch]',
          message:
            '"watch" re-render the whole form component. Use hook "useWatch" instead.',
        },
        {
          selector:
            'VariableDeclarator > ObjectPattern > Property[key.name=formState]',
          message:
            '"formState" re-render the whole form component. Use hook "useFormState" instead.',
        },
        {
          selector: 'MemberExpression[object.name=React][property.name=/^use/]',
          message:
            'Use hooks without "React" prefix. Example: "useEffect" instead of "React.useEffect".',
        },
        {
          selector:
            'ConditionalExpression[consequent.type=Literal][consequent.value=true][alternate.type=Literal][alternate.value=false]',
          message:
            'Do not use "condition ? true : false". Simplify "someVariable === 42 ? true : false" to "someVariable === 42"',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mui/material',
              message:
                "Please use \"import ComponentName from '@mui/material/ComponentName'\" instead.",
            },
            {
              name: '@mui/icons-material',
              message:
                "Please use \"import IconName from '@mui/icons-material/IconName'\" instead.",
            },
            {
              name: 'next/link',
              message:
                'Please use "import Link from \'@/components/link\'" instead. This is needed for "leave page" logic.',
            },
          ],
        },
      ],
    },
  },

  prettierConfig,
]);

export default eslintConfig;
