// Jest settings for the React app (Week 5 tooling)
export default {
  testEnvironment: 'jsdom',                                       // a pretend browser page
  setupFiles: ['<rootDir>/test/textEncoder.js'],                  // add TextEncoder before tests load (Week 8)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],                // load extra checks before each test file
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/styleMock.js',      // CSS imports → empty stand-in
    '^(\\.{1,2}/)+env$': '<rootDir>/test/envMock.js', // src/env.js → fake key (Week 8: Jest can't read import.meta)
  },
};
