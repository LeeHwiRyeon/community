module.exports = {
  "baseUrl": "http://localhost:3000",
  "video": true,
  "screenshot": true,
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "e2e": {
    "baseUrl": "http://localhost:3000",
    "specPattern": "cypress/e2e/**/*.cy.js",
    "supportFile": "cypress/support/e2e.js"
  },
  "component": {
    "devServer": {
      "framework": "create-react-app",
      "bundler": "webpack"
    }
  }
}