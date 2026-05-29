# marshmallow-icons

Internal Marshmallow UDS React icon package.

This package exposes SVG icons as React components, plus metadata for building icon pickers, search, and documentation. Losi and assistant icons are protected brand assets and should not be renamed or visually changed without brand approval.

## Install

```bash
npm install marshmallow-icons
```

Peer requirement: `react >=17`.

## Use A Named Icon

Named imports are preferred for application UI because bundlers can tree-shake them more effectively than the full icon map.

```tsx
import { IconPlay } from "marshmallow-icons";

export function PlayButtonIcon() {
  return <IconPlay size={20} aria-hidden="true" />;
}
```

## Use The Catalog Map

Use `icons` when you need dynamic lookup, icon pickers, or docs pages. `IconName` values are stable raw asset IDs such as `assets/svg/linear-play`, not component export names.

```tsx
import { icons, iconsMeta, type IconName } from "marshmallow-icons";

export function AnyIcon({ name }: { name: IconName }) {
  const Icon = icons[name];
  return <Icon width={24} height={24} aria-hidden="true" />;
}

console.log(iconsMeta[0]);
```

## Naming

Primary names are semantic and Tabler-style:

- Default imports use `Icon{Name}`, for example `IconHome`.
- Style-specific imports use `Icon{Name}{Style}`, for example `IconHomeLinear`, `IconHomeBold`, and `IconHomeTwotone`.
- Protected Losi and assistant assets keep their approved names, for example `LosiMain` and `LosiAssistant`.
- Source collection details stay in metadata as `family`, not in the public name.

The generator corrects obvious source typos in primary names, so `brifecase` becomes `Briefcase`, `sqaure` becomes `Square`, `designtools` becomes `DesignTools`, and similar source mistakes are not carried into the canonical API.

```tsx
import { IconArchive, IconArchiveBold, IconBriefcaseCross } from "marshmallow-icons";
```

Legacy generated names remain as additive aliases so existing app imports continue to work.

The metadata includes:

- `componentName`: preferred canonical export name.
- `canonicalName`: same preferred canonical name.
- `legacyNames`: older generated names and corrected aliases kept for compatibility.
- `id`: stable raw asset ID used by `icons[id]`.
- `family`, `style`, `baseName`: source-aware naming fields.
- `category`, `tags`, `name`: catalog/search metadata.
- `colorInfo`: supported color prop shape.

The full machine-readable catalog is in `dist/icons-catalog.json`; a count summary is in `CATALOG.md`.

## Tabler Migration

This package includes direct Tabler-compatible exports for exact local matches from `@tabler/icons-react@3.35.0`. These wrappers support common Tabler props such as `size`, `color`, `stroke`, and `title`.

```tsx
// Before
import { IconHome } from "@tabler/icons-react";

// After
import { IconHome } from "marshmallow-icons";

<IconHome size={20} stroke="currentColor" />
```

The direct compatibility layer currently maps 290 Tabler exports. Use `tablerIconAliases`, `tablerIconsByName`, and `dist/tabler-compat-map.json` to audit matched and unmatched icons.

## Upgrade From 0.3.0

Version `0.3.1` keeps legacy exports as compatibility aliases, so existing imports should continue to compile after a normal package update.

To rewrite old names and renamed catalog IDs to the clean canonical API, run the included migration command from your app root:

```bash
npx marshmallow-icons migrate .
```

Preview first without writing:

```bash
npx marshmallow-icons migrate . --dry-run
```

The same command also moves matched `@tabler/icons-react` named imports to `marshmallow-icons`. Use `--no-tabler` if you only want Marshmallow icon cleanup.

## Colors

Most icons are single-color and inherit `currentColor`.

```tsx
import { IconPlay } from "marshmallow-icons";

<IconPlay className="text-blue-600" />
<IconPlay color="#2563eb" />
```

Duotone icons accept `primaryColor` and `secondaryColor` when listed that way in `colorInfo`.

```tsx
import { LosiTwotone } from "marshmallow-icons";

<LosiTwotone primaryColor="#ffffff" secondaryColor="#707276" />
```

Multi-color icons preserve their original palette by default and accept a `colors` array when listed that way in `colorInfo`.

```tsx
import { LosiBold } from "marshmallow-icons";

<LosiBold colors={["#d9d9d9", "#ffffff", "#000000"]} />
```

## Accessibility

Decorative icons should use `aria-hidden="true"`.

```tsx
<IconPlay aria-hidden="true" />
```

Meaningful standalone icons should provide an accessible name.

```tsx
<IconPlay role="img" aria-label="Play" />
```

## Development

This folder includes the original SVG inputs and generator.

```bash
npm run generate
npm run build
```

The build regenerates React components, creates ESM/CJS/type outputs, and removes duplicate sourcemap comments from emitted JS files.

## License

This is proprietary Marshmallow Studio software and `UNLICENSED`; see `LICENSE`.
