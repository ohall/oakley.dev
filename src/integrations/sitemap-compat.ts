import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig, AstroIntegration } from "astro";
import type { SitemapItem, SitemapOptions } from "../../node_modules/@astrojs/sitemap/dist/index.js";
import { ZodError } from "zod/v4";
import { generateSitemap } from "../../node_modules/@astrojs/sitemap/dist/generate-sitemap.js";
import { writeSitemap } from "../../node_modules/@astrojs/sitemap/dist/write-sitemap.js";
import { writeSitemapChunk } from "../../node_modules/@astrojs/sitemap/dist/write-sitemap-chunk.js";
import * as validateOptionsModule from "../../node_modules/@astrojs/sitemap/dist/validate-options.js";

const STATUS_CODE_PAGES = new Set(["404", "500"]);

type ResolvedSitemapOptions = NonNullable<SitemapOptions>;

type AstroPageRoute = {
	type: "page" | string;
	pathname?: string;
	pattern?: string;
	generate: (pathname: string) => string;
	fallbackRoutes?: AstroPageRoute[];
};

const validateOptions = (validateOptionsModule as { validateOptions: (site: string, opts?: SitemapOptions) => ResolvedSitemapOptions }).validateOptions;

function formatConfigErrorMessage(err: ZodError) {
	return err.issues
		.map((issue) => ` ${issue.path.join(".")}  ${issue.message}.`)
		.join("\n");
}

function isStatusCodePage(locales: string[]) {
	const statusPathNames = new Set(
		locales.flatMap((locale) => [...STATUS_CODE_PAGES].map((page) => `${locale}/${page}`)).concat([...STATUS_CODE_PAGES]),
	);

	return (pathname: string) => {
		let normalized = pathname;
		if (normalized.endsWith("/")) {
			normalized = normalized.slice(0, -1);
		}
		if (normalized.startsWith("/")) {
			normalized = normalized.slice(1);
		}
		return statusPathNames.has(normalized);
	};
}

export default function sitemapCompat(options?: Record<string, unknown>): AstroIntegration {
	let routes: AstroPageRoute[] = [];
	let config: AstroConfig | undefined;

	return {
		name: "@astrojs/sitemap-compat",
		hooks: {
			"astro:routes:resolved": ({ routes: resolvedRoutes }: { routes: AstroPageRoute[] }) => {
				routes = resolvedRoutes;
			},
			"astro:config:done": ({ config: resolvedConfig }: { config: AstroConfig }) => {
				config = resolvedConfig;
			},
			"astro:build:done": async ({ dir, pages, logger }) => {
				try {
					const resolvedConfig = config;
					if (!resolvedConfig?.site) {
						logger.warn("The Sitemap integration requires the `site` astro.config option. Skipping.");
						return;
					}

					const opts = validateOptions(resolvedConfig.site, options as SitemapOptions);
					const { filenameBase, filter, customPages, customSitemaps, serialize, entryLimit, chunks } = opts;
					const resolvedFilenameBase = filenameBase ?? "sitemap";
					const outFile = `${resolvedFilenameBase}-index.xml`;
					const finalSiteUrl = new URL(resolvedConfig.base, resolvedConfig.site);
					const shouldIgnoreStatus = isStatusCodePage(Object.keys(opts.i18n?.locales ?? {}));

					let pageUrls = pages
						.filter((page) => !shouldIgnoreStatus(page.pathname))
						.map((page) => {
							if (page.pathname !== "" && !finalSiteUrl.pathname.endsWith("/")) {
								finalSiteUrl.pathname += "/";
							}
							if (page.pathname.startsWith("/")) {
								page.pathname = page.pathname.slice(1);
							}
							const fullPath = finalSiteUrl.pathname + page.pathname;
							return new URL(fullPath, finalSiteUrl).href;
						});

					const addRouteUrl = (urls: string[], route: AstroPageRoute) => {
						if (!route.pathname) {
							return;
						}
						if (shouldIgnoreStatus(route.pathname ?? route.pattern)) {
							return;
						}

						let fullPath = finalSiteUrl.pathname;
						if (fullPath.endsWith("/")) {
							fullPath += route.generate(route.pathname).substring(1);
						} else {
							fullPath += route.generate(route.pathname);
						}

						const newUrl = new URL(fullPath, finalSiteUrl).href;
						if (resolvedConfig.trailingSlash === "never") {
							urls.push(newUrl);
						} else if (resolvedConfig.build.format === "directory" && !newUrl.endsWith("/")) {
							urls.push(`${newUrl}/`);
						} else {
							urls.push(newUrl);
						}
					};

					// Astro 4 can reach build:done without route metadata populated for sitemap 3.7.x.
					const routeUrls = routes.reduce((urls: string[], route) => {
						if (route.type !== "page") {
							return urls;
						}

						addRouteUrl(urls, route);
						for (const fallbackRoute of route.fallbackRoutes ?? []) {
							addRouteUrl(urls, fallbackRoute);
						}
						return urls;
					}, []);

					pageUrls = Array.from(new Set([...pageUrls, ...routeUrls, ...(customPages ?? [])]));

					if (filter) {
						pageUrls = pageUrls.filter((value) => filter(value));
					}

					if (pageUrls.length === 0) {
						logger.warn(`No pages found!\n\`${outFile}\` not created.`);
						return;
					}

					let urlData = generateSitemap(pageUrls, finalSiteUrl.href, opts);
					if (serialize) {
						try {
							const serializedUrls = [];
							for (const item of urlData) {
								const serialized = await Promise.resolve(serialize(item));
								if (serialized) {
									serializedUrls.push(serialized);
								}
							}

							if (serializedUrls.length === 0) {
								logger.warn("No pages found!");
								return;
							}

							urlData = serializedUrls;
						} catch (err) {
							logger.error(`Error serializing pages\n${String(err)}`);
							return;
						}
					}

					const destDir = fileURLToPath(dir);
					const lastmod = opts.lastmod?.toISOString();
					const xslURL = opts.xslURL ? new URL(opts.xslURL, finalSiteUrl).href : undefined;

					if (chunks) {
						try {
							let groupedUrlCollection: string[] = [];
							const chunkItems: Record<string, SitemapItem[]> = {};

							for (const [key, collectChunk] of Object.entries(chunks) as Array<
								[string, NonNullable<ResolvedSitemapOptions["chunks"]>[string]]
							>) {
								const collection: SitemapItem[] = [];
								for (const item of urlData) {
									const collected = await Promise.resolve(collectChunk(item));
									if (collected) {
										collection.push(collected);
									}
								}

								chunkItems[key] = collection;
								groupedUrlCollection = [...groupedUrlCollection, ...collection.map((entry) => entry.url)];
							}

							chunkItems.pages = urlData.filter((item) => !groupedUrlCollection.includes(item.url));

							const chunkConfig = {
								filenameBase: resolvedFilenameBase,
								hostname: finalSiteUrl.href,
								sitemapHostname: finalSiteUrl.href,
								sourceData: chunkItems,
								destinationDir: destDir,
								...(resolvedConfig.base ? { publicBasePath: resolvedConfig.base } : {}),
								...(customSitemaps ? { customSitemaps } : {}),
								...(entryLimit ? { limit: entryLimit } : {}),
								...(xslURL ? { xslURL } : {}),
								...(lastmod ? { lastmod } : {}),
								...(opts.namespaces ? { namespaces: opts.namespaces } : {}),
							};

							await writeSitemapChunk(
								chunkConfig,
								resolvedConfig,
							);
							logger.info(`\`${outFile}\` created at \`${path.relative(process.cwd(), destDir)}\``);
							return;
						} catch (err) {
							logger.error(`Error chunking sitemaps\n${String(err)}`);
							return;
						}
					}

					const sitemapConfig = {
						filenameBase: resolvedFilenameBase,
						hostname: finalSiteUrl.href,
						destinationDir: destDir,
						sourceData: urlData,
						...(resolvedConfig.base ? { publicBasePath: resolvedConfig.base } : {}),
						...(entryLimit ? { limit: entryLimit } : {}),
						...(customSitemaps ? { customSitemaps } : {}),
						...(xslURL ? { xslURL } : {}),
						...(lastmod ? { lastmod } : {}),
						...(opts.namespaces ? { namespaces: opts.namespaces } : {}),
					};

					await writeSitemap(sitemapConfig, resolvedConfig);
					logger.info(`\`${outFile}\` created at \`${path.relative(process.cwd(), destDir)}\``);
				} catch (err) {
					if (err instanceof ZodError) {
						logger.warn(formatConfigErrorMessage(err));
						return;
					}
					throw err;
				}
			},
		},
	};
}
