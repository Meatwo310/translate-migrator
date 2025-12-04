# Translate Migrator

Translation migration tool using Monaco Editor for diff visualization.

## GitHub Pages Deployment

This project is automatically deployed to GitHub Pages at: **[meatwo310.github.io/translate-migrator](https://meatwo310.github.io/translate-migrator)**

### How it works

1. When changes are pushed to the `main` branch, GitHub Actions automatically builds and deploys the project
2. The build process uses Vite to generate optimized static files in the `dist/` directory
3. These files are then deployed to GitHub Pages using the `gh-pages` branch

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:
- Node.js environment setup
- Dependency installation via pnpm
- Production build
- Deployment to GitHub Pages

The Vite configuration is optimized for GitHub Pages subpath deployment using the correct `base` setting.