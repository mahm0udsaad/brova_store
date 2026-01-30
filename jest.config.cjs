const { pathsToModuleNameMapper } = require("ts-jest")
const { compilerOptions } = require("./tsconfig.json")

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: "<rootDir>/" }),
  },
  modulePathIgnorePatterns: ["<rootDir>/clothing_store-main/"],
}
