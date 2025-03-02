module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
    collectCoverageFrom: [
      'app/actions/**/*.ts',
      'lib/**/*.ts',
      '!**/*.d.ts',
      '!**/node_modules/**'
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };