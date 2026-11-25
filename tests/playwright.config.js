const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  testDir: './frontend',

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: 0,

  workers: 1,

  timeout: 30000,

  expect: {
    timeout: 5000
  },

  reporter: [

    ['list'],

    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }],

    ['json', {
      outputFile: 'test-results/results.json'
    }],

    ['junit', {
      outputFile: 'test-results/junit.xml'
    }]

  ],

  use: {

    baseURL: process.env.FRONTEND_URL ||
      'http://localhost:4200',

    headless: true,

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure'

  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]

});
