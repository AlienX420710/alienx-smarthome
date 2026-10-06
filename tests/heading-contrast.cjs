const sharp = require('sharp');

function contrast(foreground, background) {
  const luminance = (rgb) =>
    rgb.reduce((sum, value, index) => {
      const channel = value / 255;
      return (
        sum +
        [0.2126, 0.7152, 0.0722][index] *
          (channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4)
      );
    }, 0);
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Measure the painted backdrop, including images, gradients and overlays. Test
// every pixel in each text run's rectangle conservatively; no guessed ancestor
// background and no gradient/image exemption. Screenshot scale is CSS pixels.
async function headingContrast(page) {
  await page.evaluate(() => document.fonts.ready);
  const headings = page.locator('h1,h2,h3');
  const results = [];
  for (let index = 0; index < (await headings.count()); index++) {
    const heading = headings.nth(index);
    await heading.scrollIntoViewIfNeeded();
    const runs = await heading.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const runs = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const style = getComputedStyle(node.parentElement);
        const color = style.color.match(/^rgba?\(([^)]+)\)$/);
        if (!color) throw new Error(`Unsupported text color: ${style.color}`);
        const rgba = color[1].split(',').map(Number);
        let opacity = rgba[3] ?? 1;
        for (
          let ancestor = node.parentElement;
          ancestor;
          ancestor = ancestor.parentElement
        )
          opacity *= Number(getComputedStyle(ancestor).opacity);
        const range = document.createRange();
        range.selectNodeContents(node);
        const size = parseFloat(style.fontSize);
        const weight = Number(style.fontWeight) || 400;
        runs.push({
          text: node.textContent.trim().slice(0, 100),
          foreground: rgba.slice(0, 3),
          opacity,
          required: size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5,
          rects: [...range.getClientRects()].map((rect) => ({
            left: rect.left - box.left,
            top: rect.top - box.top,
            right: rect.right - box.left,
            bottom: rect.bottom - box.top,
          })),
        });
      }
      return runs;
    });
    if (!runs.length) continue;
    // CSSOM property edits work under the production CSP; an injected inline
    // stylesheet is correctly blocked there. Preserve and restore exact styles.
    const originalStyles = await heading.evaluate((element) =>
      [element, ...element.querySelectorAll('*')].map((node) => {
        const original = node.getAttribute('style');
        node.style.setProperty(
          '-webkit-text-fill-color',
          'transparent',
          'important',
        );
        node.style.setProperty('text-shadow', 'none', 'important');
        if (getComputedStyle(node).webkitTextFillColor !== 'rgba(0, 0, 0, 0)')
          throw new Error('Heading text masking did not apply');
        return original;
      }),
    );
    let png;
    try {
      png = await heading.screenshot({ scale: 'css', animations: 'disabled' });
    } finally {
      await heading.evaluate((element, styles) => {
        [element, ...element.querySelectorAll('*')].forEach((node, index) => {
          if (styles[index] === null) node.removeAttribute('style');
          else node.setAttribute('style', styles[index]);
        });
      }, originalStyles);
    }
    const { data, info } = await sharp(png)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const run of runs) {
      let minimum = Infinity;
      for (const rect of run.rects) {
        for (
          let y = Math.max(0, Math.ceil(rect.top));
          y < Math.min(info.height, Math.floor(rect.bottom));
          y++
        ) {
          for (
            let x = Math.max(0, Math.ceil(rect.left));
            x < Math.min(info.width, Math.floor(rect.right));
            x++
          ) {
            const offset = (y * info.width + x) * info.channels;
            const background = [...data.subarray(offset, offset + 3)];
            const foreground = run.foreground.map(
              (value, i) =>
                value * run.opacity + background[i] * (1 - run.opacity),
            );
            minimum = Math.min(minimum, contrast(foreground, background));
          }
        }
      }
      if (!Number.isFinite(minimum))
        throw new Error(`No rendered text pixels: ${run.text}`);
      results.push({ text: run.text, ratio: minimum, required: run.required });
    }
  }
  await page.evaluate(() => scrollTo(0, 0));
  return results;
}

module.exports = { contrast, headingContrast };
