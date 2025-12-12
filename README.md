# Marshmallow Unified Design System (Icons)

This repo contains a large set of SVG icons (now organized under `assets/svg/`) and provides:

- **`marshmallow-icons`**: an npm module exporting every SVG as a React component.
- **`@marshmallow/uds-docs`**: a small frontend for searching and visually previewing icons.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Generate icon components (from all `.svg` files in `assets/svg`):

```bash
npm run icons:generate
```

3. Run the docs site:

```bash
npm run docs:dev
```

## Publishing the npm module

The package is in `packages/icons`.

```bash
cd packages/icons
npm publish
```

> Before publishing, make sure you update the package name/version in `packages/icons/package.json`.


