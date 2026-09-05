// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

const experienceLifecyclePlugin = {
	name: "alienx-experience-lifecycle",
	enforce: "pre",
	transform(code, id) {
		if (!id.includes("/src/pages/experience.astro")) return;

		const opening = "    <script>\n";
		const closing = "\n    </script>";
		if (!code.includes(opening) || !code.includes(closing)) return;

		return code
			.replace(
				opening,
				`${opening}      const initExperience = () => {\n`,
				1,
			)
			.replace(
				closing,
				`\n      };\n      document.addEventListener('astro:page-load', initExperience);\n      initExperience();\n    </script>`,
				1,
			);
	},
};

// https://astro.build/config
export default defineConfig({
	site: "https://alienxsmarthome.com",
	integrations: [mdx(), sitemap(), icon()],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	vite: {
		plugins: [experienceLifecyclePlugin],
	},
});
