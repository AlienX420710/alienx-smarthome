# Media Audit

Last audited: 2026-09-13.

## Current pipeline

`scripts/optimize-images.mjs` runs before every Astro build. It now decodes every public raster asset with Sharp and prints dimensions, format, and byte size into the build log. A corrupt image therefore fails before deployment.

The social preview source remains preserved as JPEG artwork, while the reproducible build generates `public/alienx-social-preview.webp` at a maximum width of 1600 px and WebP quality 85.

## Production rules

- Do not lazy-load LCP/hero imagery by default.
- Below-the-fold content imagery should use native lazy loading when added.
- Rendered media must carry intrinsic dimensions or an explicit aspect ratio to prevent layout shift.
- Prefer responsive image selection (`picture`/`srcset` or Astro image tooling) when a page actually needs multiple source sizes.
- Video surfaces require a useful poster rather than an empty pre-play state.
- Decorative experiments should prefer CSS/SVG/canvas when that is the actual rendering primitive instead of shipping raster screenshots.
- Do not add image transformations merely to increase format count; each derivative must serve a production request.

## Current asset note

The repository includes brand/favicon assets, social artwork, and historical JPEG artwork. The site currently relies heavily on CSS/SVG/canvas rather than content photography, so this pass does not force unused JPEGs into production UI. New media should be introduced only where it improves the content.
