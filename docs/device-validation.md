# Real-device accessibility acceptance

Protocol prepared; no physical-device results are asserted. Automated Chromium,
WebKit, SafariDriver and axe coverage remain separate evidence for AX-008.

Record the full revision from `/api/status`, date, tester, device, OS/browser,
assistive technology, theme, text scale and reduced-motion setting. Mark each
case pass/fail/not-tested and attach sanitized evidence; not-tested is not pass.

1. Traverse all public routes with VoiceOver or another actual screen reader.
   Check headings, landmarks, meaningful names, active navigation and reading
   order; decorative artwork must not obscure essential content.
2. With a physical keyboard, use Tab and Shift+Tab in both directions, Enter
   for links/buttons, Space for appropriate controls, and Escape for overlays.
   Check visible focus, skip-to-content, modal containment and focus restoration.
3. On narrow screens, ensure the current navigation link is visible after direct
   load, page navigation, reload and Back/Forward. Scrolling the navigation rail
   must not unexpectedly move document focus or trap page scrolling.
4. Exercise command palette, theme/motion controls, technology controls and
   Experience exhibits without a pointer. Repeat navigation to detect stale
   handlers or lost focus. Keep experimental `/lab` results separately labeled.
5. On Contact, verify labels, grouped choices, errors, consent and status
   announcements. Submit only an empty form for required-field validation;
   do not send a populated real inquiry without authorization. Leave the hidden
   honeypot untouched. CI mocks provider success/retry cases.
6. Test 200% zoom, large text, 320 CSS-pixel equivalent width and rotation in
   both themes. Confirm readable content, operable controls and unobscured focus.
7. Repeat with reduced motion. Record exact reproduction steps and route for
   every defect. Do not include customer data, tokens or private account screens.

Closing AX-008 requires actual results and resolution of discovered defects,
not merely committing this protocol.
