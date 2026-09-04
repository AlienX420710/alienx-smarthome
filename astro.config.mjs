// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://alienxsmarthome.com",
	integrations: [mdx(), sitemap(), icon()],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
