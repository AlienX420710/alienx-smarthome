const site = require('./engineering.config.json');
module.exports = {
  origin: 'http://127.0.0.1:4321',
  routes: site.routes,
  noindexRoutes: site.noindexRoutes,
  samples: 3,
  thresholds: {
    accessibility: 0.95,
    'best-practices': 0.95,
    performance: 0.85,
    seo: 0.95,
  },
};
