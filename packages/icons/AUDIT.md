# Marshmallow Icons Audit

Audit date: 2026-05-28

## Status

- Total icon IDs: 2,826
- Total metadata rows: 2,826
- Duplicate `componentName` groups: 0
- Duplicate `canonicalName` groups: 0
- ESM import: passing
- CJS require: passing
- Type declarations: passing
- SSR render sweep: passing
- Visual raster sweep: passing
- Tabler compatibility exports: 290 direct matches from `@tabler/icons-react@3.35.0`

## Fixed

- Generator now produces globally unique primary component names.
- Primary names are semantic and Tabler-style: `Icon{Name}` for the default icon, and `Icon{Name}{Style}` for style-specific variants.
- Source collection details remain in metadata as `family` and are not part of the preferred public name.
- Primary names correct obvious source typos such as `brifecase`, `buliding`, `sqaure`, `cricle`, `designtools`, `recive`, and `trush`.
- Legacy exports remain in place for compatibility.
- Corrected spelling aliases are additive, including `Briefcase*`, `Building*`, `TrashSquare*`, `ParagraphSpacing*`, `TextAlign*`, and related names.
- App-facing aliases `Loading`, `Balance`, and `Wrench` are exported because the web app imports them.
- Tabler-compatible `Icon*` wrappers are exported for direct exact matches and support common Tabler props.
- `iconsByName` and `iconAliases` provide name-based lookup without changing raw `icons[id]`.
- React SVG attributes are camelCased to avoid React dev/SSR warnings.
- Source SVGs, generator scripts, and build config are included so the package is inspectable and rebuildable.
- Package licensing metadata now matches the proprietary license by using `UNLICENSED` and `private: true`.
- Build removes duplicate sourcemap comments.
- Full visual pass completed across all 2,826 rendered exports, with six independent review ranges plus a final local pass.
- Misleading source filenames were normalized so source paths now match public names for the inspected shuffled twotone set, chevrons, barbell/battery exports, Google Drive/Play exports, split panel, sparkle-eye variants, play-circle-dashed, align-top/bottom, brightness-meter, battery-3-full, frame/group placeholders, generic `icon`/`icon-1` placeholders, and brand support assets.
- `marshmallow-logo.svg` was renamed to `marshmallow-shadow.svg` because the rendered asset is a shadow/base mark, not a logo.
- `marshmallow-symbols-spec.svg` is intentionally documented as a brand symbols specification sheet and multi-color assets now preserve their original palette by default.

## Protected Icons

Losi and assistant icons were intentionally not renamed or visually modified:

- `LosiAssistantDefault`
- `LosiAssistantStarEye`
- `LosiAssistantStarFace`
- `LosiAssistant`
- `LosiMain`
- `LosiNexus`
- `LosiSpaces`
- `LosiBold`
- `LosiBroken`
- `LosiBulk`
- `LosiOutline`
- `LosiTwotone`

## Visual Review

Automated raster review found no blank icons, invalid viewBoxes, or rendering exceptions. Final rendered contact sheets and machine-readable visual results are in `audit/`.

Recommendation-eligible items for future design cleanup:

- `Cd2` / `assets/svg/vuesax/linear/cd`: tight 22x22 viewBox touches top/left edges.
- `Mobile2` / `assets/svg/vuesax/linear/mobile`: tight 18x22 viewBox touches top edge.
- `BlackS`, `RegularS`, `UltralightS`: brand-mark style icons use a 69x69 viewBox and fill bounds.
- `HederaHashgraphHbar3`: circular badge fills all edges.

Protected Losi/assistant edge flags were excluded from recommendations.

## Catalog

- Summary: `CATALOG.md`
- Full machine-readable catalog: `dist/icons-catalog.json`
- Tabler comparison: `TABLER_MIGRATION.md` and `dist/tabler-compat-map.json`
- Visual audit artifacts: `audit/final-contact-page-01.png` through `audit/final-contact-page-30.png`, with `audit/final-manifest.json`
