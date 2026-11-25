module.exports = {

  testEnvironment: 'node',

  roots: ['<rootDir>/backend'],

  testMatch: [
    '**/*.test.js'
  ],

  verbose: true,

  testTimeout: 30000,

  maxWorkers: 1,

  clearMocks: true,

  restoreMocks: true,

  reporters: [

    'default',

    [
      'jest-html-reporters',
      {
        publicPath: './jest-report',
        filename: 'index.html',
        pageTitle: 'UserManager - Pruebas Backend',
        expand: true,
        openReport: false
      }
    ],

    [
      'jest-junit',
      {
        outputDirectory: './jest-results',
        outputName: 'junit.xml'
      }
    ]

  ]
};