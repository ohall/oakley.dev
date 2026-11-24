import cssnano from "cssnano";

// Tailwind runs through @tailwindcss/vite (Lightning CSS handles prefixing).
// cssnano still minifies the production stylesheet, as it did under v3.
export default {
	plugins: process.env.NODE_ENV === "production" ? [cssnano] : [],
};
