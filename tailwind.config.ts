import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
	content: [
		"./src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}",
		"!./src/pages/og-image/[slug].png.ts",
	],
	corePlugins: {
		borderOpacity: false,
		fontVariantNumeric: false,
		ringOffsetColor: false,
		ringOffsetWidth: false,
		scrollSnapType: false,
		textOpacity: false,
		touchAction: false,
	},
	darkMode: "class",
	plugins: [
		require("@tailwindcss/typography"),
		plugin(({ addComponents }) => {
			addComponents({
				".title": {
					fontFamily: "'Space Grotesk', system-ui, sans-serif",
					fontSize: "1.875rem",
					fontWeight: "600",
					letterSpacing: "-0.025em",
					lineHeight: "1.15",
					"@media (min-width: 768px)": {
						fontSize: "2.25rem",
						lineHeight: "1.1",
					},
				},
			});
		}),
	],
	theme: {
		extend: {
			colors: {
				// OKLCH-based colors
				bg: "oklch(var(--theme-bg) / <alpha-value>)",
				"bg-elevated": "oklch(var(--theme-bg-elevated) / <alpha-value>)",
				"bg-surface": "oklch(var(--theme-bg-surface) / <alpha-value>)",
				text: "oklch(var(--theme-text) / <alpha-value>)",
				"text-muted": "oklch(var(--theme-text-muted) / <alpha-value>)",
				"text-subtle": "oklch(var(--theme-text-subtle) / <alpha-value>)",
				accent: "oklch(var(--theme-accent) / <alpha-value>)",
				"accent-2": "oklch(var(--theme-accent-2) / <alpha-value>)",
				link: "oklch(var(--theme-link) / <alpha-value>)",
				quote: "oklch(var(--theme-quote) / <alpha-value>)",
				border: "oklch(var(--theme-border) / <alpha-value>)",
			},
			fontFamily: {
				display: ["'Space Grotesk'", "system-ui", "sans-serif"],
				serif: ["'Source Serif 4'", "Georgia", "serif"],
				mono: [
					"ui-monospace",
					"SFMono-Regular",
					"Menlo",
					"Monaco",
					"Consolas",
					"'Liberation Mono'",
					"'Courier New'",
					"monospace",
				],
			},
			transitionTimingFunction: {
				"out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
				"out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
				"out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
			},
			typography: () => ({
				cactus: {
					css: {
						"--tw-prose-body": "oklch(var(--theme-text-muted))",
						"--tw-prose-headings": "oklch(var(--theme-text))",
						"--tw-prose-lead": "oklch(var(--theme-text-muted))",
						"--tw-prose-links": "oklch(var(--theme-text))",
						"--tw-prose-bold": "oklch(var(--theme-text))",
						"--tw-prose-counters": "oklch(var(--theme-text-subtle))",
						"--tw-prose-bullets": "oklch(var(--theme-text-subtle))",
						"--tw-prose-hr": "oklch(var(--theme-border))",
						"--tw-prose-quotes": "oklch(var(--theme-text-muted))",
						"--tw-prose-quote-borders": "oklch(var(--theme-border))",
						"--tw-prose-captions": "oklch(var(--theme-text-subtle))",
						"--tw-prose-code": "oklch(var(--theme-accent-2))",
						"--tw-prose-pre-code": "oklch(var(--theme-text-muted))",
						"--tw-prose-pre-bg": "oklch(var(--theme-bg-elevated))",
						"--tw-prose-th-borders": "oklch(var(--theme-border))",
						"--tw-prose-td-borders": "oklch(var(--theme-border))",
					},
				},
			}),
		},
	},
} satisfies Config;
