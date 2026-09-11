const { test, expect } = require('@playwright/test');

const baseURL = 'http://127.0.0.1:4321';
const routes = ['/', '/work/', '/experience/', '/technology/', '/status/', '/about/', '/contact/'];
const viewports = [
  [320,568],[360,800],[375,667],[390,844],[430,932],
  [540,720],[768,1024],[820,1180],[1024,768],[1280,800],[1440,900],[1920,1080]
];

for (const [width,height] of viewports) for (const route of routes) {
  test(`${route} @ ${width}x${height}`, async ({page}) => {
    const errors=[];
    // Layout runs without provider secrets. Exercise degraded HTTP handling separately.
    await page.route('**/api/status', route => route.fulfill({ json: {
      status: 'operational', generatedAt: '2026-09-11T00:00:00Z',
      runtime: 'Cloudflare Workers', summary: 'Configured fixture', requestId: 'layout-test',
      checks: Object.fromEntries(['worker', 'inquiry', 'turnstile', 'resend'].map(key =>
        [key, { status: 'configured', detail: 'Layout test fixture' }]))
    } }));
    page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
    page.on('console',m=>{
      if(m.type()==='error') {
        const text=m.text();
        if(!text.includes('frame-ancestors') || !text.includes('meta')) {
          errors.push(`console: ${text}`);
        }
      }
    });

    await page.setViewportSize({width,height});
    await page.addInitScript(() => {
      try { localStorage.setItem('alienx-theme', 'light'); } catch {}
    });
    await page.goto(`${baseURL}${route}`,{waitUntil:'domcontentloaded'});
    await page.evaluate(() => { document.documentElement.dataset.alienxTheme = 'light'; });
    await page.waitForTimeout(500);

    const result=await page.evaluate(()=>{
      const offenders=[];
      for(const el of document.querySelectorAll('*')){
        const r=el.getBoundingClientRect();
        if(r.width>0&&(r.right>innerWidth+1||r.left<-1)) offenders.push({tag:el.tagName,id:el.id,className:String(el.className).slice(0,120),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)});
      }

      const header=document.querySelector('header');
      const nav=document.querySelector('header nav');
      const internal=document.querySelector('.internal-links');
      const heading=document.querySelector('main h1');
      const headerRect=header?.getBoundingClientRect();
      const navRect=nav?.getBoundingClientRect();
      const internalRect=internal?.getBoundingClientRect();
      const headingRect=heading?.getBoundingClientRect();
      const internalStyle=internal ? getComputedStyle(internal) : null;
      const links=internal ? [...internal.querySelectorAll('a')].map((link)=>link.getBoundingClientRect()) : [];
      const headerControls=header ? [...header.querySelectorAll('a,button')].filter((control)=>{
        const rect=control.getBoundingClientRect();
        const style=getComputedStyle(control);
        return rect.width>0 && rect.height>0 && style.visibility!=='hidden' && style.display!=='none';
      }).map((control)=>{
        const rect=control.getBoundingClientRect();
        return {tag:control.tagName,aria:control.getAttribute('aria-label')||'',text:control.textContent?.trim().slice(0,40)||'',width:Math.round(rect.width),height:Math.round(rect.height)};
      }) : [];

      return {
        viewportWidth:innerWidth,
        documentWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
        offenders:offenders.slice(0,12),
        header:{left:headerRect?.left??0,right:headerRect?.right??0,height:headerRect?.height??0},
        nav:{left:navRect?.left??0,right:navRect?.right??0},
        internal:{left:internalRect?.left??0,right:internalRect?.right??0,width:internalRect?.width??0,scrollWidth:internal?.scrollWidth??0,flexWrap:internalStyle?.flexWrap??'',overflowX:internalStyle?.overflowX??'',linkTops:links.map((rect)=>Math.round(rect.top))},
        headerControls,
        heading:heading ? {text:heading.textContent?.trim()??'',width:headingRect?.width??0,height:headingRect?.height??0,top:headingRect?.top??0,color:getComputedStyle(heading).color,visibility:getComputedStyle(heading).visibility,opacity:Number(getComputedStyle(heading).opacity)} : null
      };
    });

    expect(result.documentWidth,`Horizontal overflow: ${JSON.stringify(result.offenders)}`).toBeLessThanOrEqual(result.viewportWidth+1);
    expect(result.header.left,`Header starts outside viewport: ${JSON.stringify(result.header)}`).toBeGreaterThanOrEqual(-1);
    expect(result.header.right,`Header exceeds viewport: ${JSON.stringify(result.header)}`).toBeLessThanOrEqual(result.viewportWidth+1);
    expect(result.nav.left,`Navigation starts outside viewport: ${JSON.stringify(result.nav)}`).toBeGreaterThanOrEqual(-1);
    expect(result.nav.right,`Navigation exceeds viewport: ${JSON.stringify(result.nav)}`).toBeLessThanOrEqual(result.viewportWidth+1);

    if (width <= 900) {
      expect(result.internal.width,`Responsive navigation width exceeds viewport: ${JSON.stringify(result.internal)}`).toBeLessThanOrEqual(result.viewportWidth+1);
      expect(result.internal.flexWrap,`Responsive navigation wrapped instead of using its single-row scroller: ${JSON.stringify(result.internal)}`).toBe('nowrap');
      expect(['auto','scroll']).toContain(result.internal.overflowX);
      expect(new Set(result.internal.linkTops).size,`Responsive navigation links wrapped to multiple rows: ${JSON.stringify(result.internal)}`).toBeLessThanOrEqual(1);
    }

    if (width <= 600) {
      expect(result.headerControls.filter((control)=>control.width < 44 || control.height < 44),`Mobile header hit targets below 44px: ${JSON.stringify(result.headerControls)}`).toEqual([]);
    }

    expect(result.heading,`Missing main heading on ${route}`).not.toBeNull();
    expect(result.heading.width,`Main heading has no rendered width on ${route}`).toBeGreaterThan(0);
    expect(result.heading.height,`Main heading has no rendered height on ${route}`).toBeGreaterThan(0);
    expect(result.heading.visibility,`Main heading is hidden on ${route}`).not.toBe('hidden');
    expect(result.heading.opacity,`Main heading is transparent on ${route}`).toBeGreaterThan(0);

    if (route === '/technology/' && width <= 600) {
      expect(result.heading.text).toContain('Built from the web outward.');
      expect(result.heading.top,`Technology hero heading is pushed too far below the header: ${JSON.stringify(result.heading)}`).toBeLessThanOrEqual(result.header.height + 120);
    }

    expect(errors,`Runtime errors at ${width}x${height}`).toEqual([]);
  });
}
