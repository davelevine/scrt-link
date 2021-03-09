module.exports = {
  async headers() {
    return [
      {
        source: '/:alias',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'DNT',
            value: '1',
          },
        ],
      },
    ]
  },
}
