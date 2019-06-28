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
        '^foundationdb$': '<rootDir>/node_modules/foundationdb',
        '^@openland/foundationdb$': '<rootDir>/packages/foundationdb/src',
        '^@openland/foundationdb-locks$': '<rootDir>/packages/foundationdb-locks/src',
        '^@openland/foundationdb-random$': '<rootDir>/packages/foundationdb-random/src',
        '^@openland/foundationdb-singleton$': '<rootDir>/packages/foundationdb-singleton/src',
        '^@openland/foundationdb-utils$': '<rootDir>/packages/foundationdb-utils/src',
        '^@openland/foundationdb-compiler$': '<rootDir>/packages/foundationdb-compiler/src',
        '^@openland/foundationdb-entity$': '<rootDir>/packages/foundationdb-entity/src',
        '^@openland/foundationdb-tuple$': '<rootDir>/packages/foundationdb-tuple/src'
    }
};