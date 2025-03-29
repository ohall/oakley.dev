# Oakley.dev Development Guide

## Commands
- `pnpm dev` or `pnpm start`: Start development server
- `pnpm build`: Build production site (with `postbuild` PageFind indexing)
- `pnpm preview`: Preview production build
- `pnpm lint`: Run Biome linter
- `pnpm format`: Format code and imports
- `pnpm check`: Run Astro type checking

## Code Style Guidelines
- **Formatting**: Uses Biome with tabs (width: 2), line width 100
- **Imports**: Auto-organized with Biome, path aliases available (e.g., `@/components/*`)
- **TypeScript**: Follows strictest config, explicit types preferred
- **Naming**: Follow Astro conventions, component files use PascalCase
- **Components**: Astro components with minimal client JS
- **Error Handling**: Clear error states, graceful fallbacks
- **Comments**: Keep JSDoc comments for exported functions
- **Styling**: Tailwind CSS with typography plugin
- **Accessibility**: Ensure all components are a11y compliant

## Project Structure
- `src/components`: UI components organized by feature
- `src/content`: MDX/Markdown files with front matter
- `src/layouts`: Base page layouts
- `src/pages`: File-based routing
- `src/utils`: Shared utility functions