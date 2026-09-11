// @ts-check
import { defineConfig } from "astro/config";
import { execFileSync } from "node:child_process";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	vite: { define: { __ALIENX_BUILD_SHA__: JSON.stringify(process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()) } },
	site: "https://alienxsmarthome.com",
	integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith("/contact/success") }), icon()],
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"base-uri 'self'",
				"object-src 'none'",
				"form-action 'self'",
				"img-src 'self' data: blob:",
				"font-src 'self'",
				"connect-src 'self' https://challenges.cloudflare.com",
				"frame-src https://challenges.cloudflare.com",
			],
			scriptDirective: {
				resources: ["'self'", "https://challenges.cloudflare.com"],
				hashes: [
					"sha256-6X1+jmZLs/WOvx97u4NMEamhfcaYlaIi0kwtWmTuojg=",
					"sha256-RPJQjhqRTh8k5XtuKuYf/W//EtaouYMGfMXBF1BE6ak=",
					"sha256-aNGoVdyuJpFmZwl4BowEme7vQ2WzQaE0Sja5OCOTpmw=",
				],
			},
		},
	},
	adapter: cloudflare(),
});
