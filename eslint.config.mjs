import globals from 'globals'
import path from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginJs from '@eslint/js'

// mimic CommonJS variables -- not needed if using CommonJS
const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)
const compat = new FlatCompat({ baseDirectory: _dirname, recommendedConfig: pluginJs.configs.recommended })

export default [
  { languageOptions: { globals: globals.node } },
  ...compat.extends('standard-with-typescript'),
  ...compat.config({
    rules: {
      '@typescript-eslint/space-before-function-paren': 'off'
    },
    parserOptions: {
      project: './tsconfig.eslint.json'
    },
    overrides: [
      {
        files: ['src/**/*.ts']
      }
    ]
  })
]
