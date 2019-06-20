module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'node'
    ],
    testRegex: '.*\\.spec\\.tsx?$',
    testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'packages/**/*.{ts,tsx,js,jsx}',
        '!packages/**/*.d.ts',
        '!packages/**/lib/**/*',
    ],
    moduleDirectories: [
        '.',
        'packages',
        'node_modules'
    ],
    moduleNameMapper: {
        '^@openland/foundationdb$': '<rootDir>/packages/foundationdb/src'
    }
};