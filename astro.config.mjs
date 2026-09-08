// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://alienxsmarthome.com",
	integrations: [sitemap(), icon()],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
