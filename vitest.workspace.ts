import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
])