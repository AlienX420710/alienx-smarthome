// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://alienxsmarthome.com",
	integrations: [sitemap(), icon()],
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"base-uri 'self'",
				"object-src 'none'",
				"frame-ancestors 'none'",
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
					"sha256-5UMx6ku4jbaBBQqiD0rwW4D6DYDarGNFDtOVEI5u04Y=",
			],
		},
	},
	adapter: cloudflare(),
});
