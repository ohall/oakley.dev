import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

// ESM config: cssnano 9 is ESM-only, so it has to be imported rather than require()d.
export default {
	plugins: [autoprefixer, ...(process.env.NODE_ENV === "production" ? [cssnano] : [])],
};
