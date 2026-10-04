/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: [],
  globalSetup: undefined,
  setupFiles: ['./tests/setup.js'],
  testTimeout: 30000,
};
