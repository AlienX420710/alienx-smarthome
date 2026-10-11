// Run as a parser-blocking body script, after the head's stylesheets and before
// form controls. WebKit 326092 can otherwise cache stale ancestor styles while
// inserting a select. Reading in the earlier head preference script is too soon.
getComputedStyle(document.documentElement).getPropertyValue('--site-canvas');
if (document.body) getComputedStyle(document.body).backgroundColor;
