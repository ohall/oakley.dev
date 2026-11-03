/** @type {import("@types/prettier").Options} */
module.exports = {
	printWidth: 100,
	semi: true,
	singleQuote: false,
	tabWidth: 2,
	useTabs: true,
	plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss" /* Must come last */],
	// Tailwind v4 reads theme and class order from the CSS entry instead of a JS config.
	tailwindStylesheet: "./src/styles/global.css",
	overrides: [
		{
			files: "**/*.astro",
			options: {
				parser: "astro",
			},
		},
		{
			files: ["*.mdx", "*.md"],
			options: {
				printWidth: 80,
			},
		},
	],
};
