# Security comparison — September 26, 2026

Requested by the owner during PR closeout. This is a dated comparison, not a
claim that either security audit is complete. Cleaning-by-Cassi was inspected
read-only; no changes or messages were made to that repository.

## Revisions and observed deployment

- AlienX comparison source: `0721ca6de7fb5a8e624a378c1d11c5a65c426d6b`,
  after PR #45 passed all five gates at
  `d31f8249ba82c6314654171e4b7148c05715c93c`. Main rollout was still in progress
  at the initial scan; `/api/status` returned the preceding main
  `df95e07a6110e5cbc9e359b3a339266c25978219` at 18:23 UTC.
- Cleaning source: `e058d7cb44a35f8abb55862840287eec4684d9ef`.
  Its live `/api/release` returned the preceding revision
  `286bf4a57f84b9b6f43d48eec5635353873bfade`. Current-main Lighthouse run
  `36170839528` failed homepage performance: 0.71 against 0.85. Smoke run
  `36248892692` exhausted its 15-minute exact-revision wait. Do not report the
  latest Cleaning source as successfully deployed or its audit as finished.
- Cleaning Quality job `108189694700` did verify fresh CodeQL analyses and zero
  open main code-scanning alerts for `e058d7c` on September 25. This is distinct
  from deployment success or private Dependabot/secret-scanning inventory.

## External header observations

The owner's references are [MDN Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=alienxsmarthome.com)
and [SSL.org Security Headers](https://www.ssl.org/security-headers).
Fresh requests used MDN's documented v2 scan API. These are timestamped public
homepage scans, not exact-SHA certification of every route.

| Site     | Scan ID / UTC time              | Grade / score | Tests        |
| -------- | ------------------------------- | ------------- | ------------ |
| AlienX   | 123632804 / 2026-09-26 18:21:26 | A+ / 125      | 12/12 passed |
| Cleaning | 123632923 / 2026-09-26 18:22:23 | A+ / 140      | 12/12 passed |

SSL.org's reference explains header values and applicability rather than issuing
a letter grade. Its guidance was reviewed; no fresh SSL.org form result is claimed.
Independent HTTP GETs confirmed both sites return HTTPS, HSTS, nosniff, DENY
framing, and strict-origin-when-cross-origin referrer policy. The observed HSTS
contains `preload`; that does not establish preload-list enrollment.

AlienX sends frame protection in a response CSP header and Astro's generated
resource policy in active head metadata, including build-generated script/style
hashes. Both layers are required by its integrity contract. Do not replace this
with a frame-only check or blindly copy Cleaning's host-only script policy.
Cleaning sends its full resource CSP in the response header, COOP and CORP
`same-origin`, and denies camera, microphone, USB and browsing topics in addition
to geolocation/payment. AlienX currently denies only geolocation/payment.
Header differences alone do not establish the cause of every scoring bonus.

## Architecture comparison and disposition

| Control                  | Comparison / decision                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protected merges         | Both live rulesets require PRs and the same five GitHub Actions check names, strict up-to-date branches, no bypass, and no force push/deletion. Review-thread resolution is not currently mandatory.                                                                                                                                                                   |
| Workflow execution       | Both use pinned Actions, non-persisted checkout credentials, origin guards, trusted Integrity controller revisions, disabled Integrity caches and Smoke-to-Integrity sequencing. Preserve AlienX's committed policy mutation tests.                                                                                                                                    |
| Release authorization    | AlienX uses ephemeral GitHub approval/rejection refs consumed by Cloudflare through Git. Cleaning queries GitHub REST, optionally with a read-only build token. Preserve AlienX's stronger separation and no long-lived build token requirement.                                                                                                                       |
| Code-scanning inventory  | Both require exact-main language analyses and zero open alerts. Cleaning additionally rejects analysis warnings and sanitizes transport failures. Adopt these defensive checks in a scoped follow-up with regressions; never ignore warnings or API errors.                                                                                                            |
| Dependency/history audit | Both enforce dependency auditing and reachable-history credential scanning. Preserve AlienX's suite and history coverage; no scanner certifies every possible secret format.                                                                                                                                                                                           |
| Browser/keyboard         | Both run native Safari plus actual Playwright WebKit, Chromium, keyboard and accessibility checks. AlienX retains its broader multipage traversal and mobile active-navigation bounds tests.                                                                                                                                                                           |
| Email health             | Cleaning has a shared production mail transport, dual UTC cron candidates with an America/Chicago 05:00 guard, stable idempotency, bounded retry, and documented September 21/22 delivery evidence. AlienX still needs this implemented plus CI success/failure and independent delivery evidence. A provider send outside the real production path is not sufficient. |
| Deployment rehearsal     | Cleaning tests the actual npm deploy command with mocked GitHub evidence and a non-deploying Wrangler sentinel. Adapt the command-chain technique to AlienX's real approval-ref design. This would supplement, not replace, AX-005's real negative-path evidence or AX-006's live rollback requirement.                                                                |
| Remaining operations     | Both still distinguish notification receipt, rollback, account/credential controls and real assistive-technology testing from automated checks. Cleaning's own register keeps these open.                                                                                                                                                                              |

## Header follow-up acceptance

1. Inventory page/API/static response coverage before extending headers. Evaluate
   COOP/CORP, a broader Permissions Policy, and `X-Permitted-Cross-Domain-Policies:
none` against actual AlienX features and external resources. Match middleware
   and static asset responses, with positive and removal/mutation regressions.
2. Preserve generated CSP hashes, exact allowlists, Turnstile, navigation and
   external links. Evaluate strict-dynamic/default-deny changes separately with
   emitted-script and real-widget compatibility evidence. Do not broaden CSP to
   fix a browser test.
3. A CSP reporting endpoint needs an accountable recipient, privacy/redaction,
   bounded input, rate limits, retention and a proven synthetic receipt. Do not
   create an unbounded public ingestion endpoint just to satisfy a scanner.
4. Avoid blanket COEP, global Clear-Site-Data, deprecated XSS filtering, or HSTS
   preload enrollment simply to raise a score. Apply optional headers according
   to response type and demonstrated compatibility.
5. Before closure, require all five exact-head gates and the exact-main approval,
   build, Smoke and Integrity chain; verify applicable headers on both hosts and
   repeat external scans. Keep actual email delivery and account evidence separate.

Sources: [MDN FAQ and v2 API](https://developer.mozilla.org/en-US/observatory/docs/faq),
[MDN scoring](https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring),
[OWASP HTTP headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html),
and the SSL.org reference above. MDN explicitly cautions that A+ does not test
every class of vulnerability; do not equate scanner grades with audit completion.
