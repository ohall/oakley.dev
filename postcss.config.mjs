import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import tailwindNesting from "tailwindcss/nesting/index.js";
import cssnano from "cssnano";

// ESM config: cssnano 9 is ESM-only, so it has to be imported rather than require()d.
// Tailwind runs here directly (it used to be wired in by @astrojs/tailwind, which does not support Astro 7).
export default {
	plugins: [tailwindNesting, tailwindcss, autoprefixer, ...(process.env.NODE_ENV === "production" ? [cssnano] : [])],
};
