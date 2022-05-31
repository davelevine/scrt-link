const path = require('path')

// Make sure to match supported locales from src/constants.ts
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'fr', 'it', 'pl'],
  },
  localePath: path.resolve('./public/locales'),
}
