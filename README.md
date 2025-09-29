# Translate Migrator

Translation migration tool using Monaco Editor for diff visualization.

## GitHub Pages Deployment

This project is automatically deployed to GitHub Pages at: **[meatwo310.github.io/translate-migrator](https://meatwo310.github.io/translate-migrator)**

### How it works

1. When changes are pushed to the `main` branch, GitHub Actions automatically builds and deploys the project
2. The build process uses webpack to generate optimized static files in the `dist/` directory
3. These files are then deployed to GitHub Pages using the `gh-pages` branch

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:
- Node.js environment setup
- Dependency installation  
- Production build
- Deployment to GitHub Pages

The webpack configuration is optimized for GitHub Pages subpath deployment with the correct `publicPath` setting.