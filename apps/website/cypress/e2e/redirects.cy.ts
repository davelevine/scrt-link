/// <reference types="cypress" />

const emojiUrl = 'https://🤫.st/'
const productionDomain = 'scrt-links.vercel.app'

context('Redirects', function () {
  it('should redirect to scrt-links.vercel.app', function () {
    cy.visit('/file')
    cy.location('pathname').should('contain', 'files')
  })

  it('redirects to scrt-links.vercel.app from 🤫.st', function () {
    cy.request({
      url: emojiUrl,
      followRedirect: false, // turn off following redirects
    }).then((resp) => {
      // redirect status code is 308
      expect(resp.status).to.eq(308)
      expect(resp.redirectedToUrl).to.contain(productionDomain)
    })
  })

  it('redirects secrets from 🤫 domain', function () {
    cy.visit('https://🤫.st/en#some-secret')
    cy.url().should('contain', productionDomain)
    cy.location('pathname').should('contain', 'en/l')
    cy.location('hash').should('contain', '#some-secret')
  })
})

export {}
