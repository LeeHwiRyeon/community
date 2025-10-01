// E2E Tests
// Generated at: 2025-09-28T20:23:46.144Z


// User journey E2E test
describe('User Journey E2E', () => {
  it('should complete full user journey', () => {
    // Step 1: Visit homepage
    cy.visit('/')
    cy.get('[data-testid="homepage"]').should('be.visible')
    
    // Step 2: Navigate to input page
    cy.get('[data-testid="input-link"]').click()
    cy.url().should('include', '/input')
    
    // Step 3: Enter input
    cy.get('[data-testid="input-field"]').type('test input')
    cy.get('[data-testid="submit-button"]').click()
    
    // Step 4: Wait for processing
    cy.get('[data-testid="processing"]').should('be.visible')
    
    // Step 5: Verify result
    cy.get('[data-testid="result"]').should('contain', 'test input')
    
    // Step 6: Navigate back
    cy.get('[data-testid="back-button"]').click()
    cy.url().should('include', '/')
  })
})

// Cross-browser E2E test
describe('Cross-browser E2E', () => {
  it('should work in Chrome', () => {
    cy.visit('/')
    cy.get('[data-testid="input-field"]').type('chrome test')
    cy.get('[data-testid="submit-button"]').click()
    cy.get('[data-testid="result"]').should('contain', 'chrome test')
  })
  
  it('should work in Firefox', () => {
    cy.visit('/')
    cy.get('[data-testid="input-field"]').type('firefox test')
    cy.get('[data-testid="submit-button"]').click()
    cy.get('[data-testid="result"]').should('contain', 'firefox test')
  })
})
