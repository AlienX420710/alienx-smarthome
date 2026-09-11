module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:4321/',
        'http://127.0.0.1:4321/work/',
        'http://127.0.0.1:4321/experience/',
        'http://127.0.0.1:4321/technology/',
        'http://127.0.0.1:4321/status/',
        'http://127.0.0.1:4321/about/',
        'http://127.0.0.1:4321/contact/'
      ],
      numberOfRuns: 1,
      settings: { onlyCategories: ['accessibility'] }
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }]
      }
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' }
  }
};
