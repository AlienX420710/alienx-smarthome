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
        'http://127.0.0.1:4321/contact/',
      ],
      numberOfRuns: 3,
      settings: {
        onlyCategories: [
          'accessibility',
          'best-practices',
          'performance',
          'seo',
        ],
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
