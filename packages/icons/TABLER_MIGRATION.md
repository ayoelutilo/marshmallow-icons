# Tabler Migration

This package was compared against the locally installed `@tabler/icons-react@3.35.0`.

## Compatibility Summary

- Tabler React exports checked: 6,019
- Direct Marshmallow matches: 290
- Unmatched Tabler exports: 5,729
- Machine-readable report: `dist/tabler-compat-map.json`

## Import Switch

For matched icons, switch the import source and keep the Tabler-style component name:

```tsx
// Before
import { IconHome, IconUser, IconSettings } from "@tabler/icons-react";

// After
import { IconHome, IconUser, IconSettings } from "marshmallow-icons";
```

The compatibility wrappers support common Tabler props:

```tsx
<IconHome size={20} color="currentColor" title="Home" />
<IconUser size={18} stroke="#111827" />
```

## Migration Command

The package includes a codemod for app code:

```bash
npx marshmallow-icons migrate .
```

It rewrites supported `@tabler/icons-react` named imports to `marshmallow-icons`, updates old Marshmallow export names from `0.3.0`, and rewrites renamed `icons[id]` catalog strings. Run `--dry-run` to preview changes, or `--no-tabler` to skip Tabler import rewrites.

## Lookup APIs

```tsx
import { tablerIconAliases, tablerIconsByName } from "marshmallow-icons";

console.log(tablerIconAliases.IconHome); // IconHomeLinear

const Icon = tablerIconsByName.IconHome;
```

## Match Rules

The compatibility layer only creates direct exports for clear name matches. Outline-style Tabler icons prefer clean linear names first, then other outline-like styles. Tabler `Filled` names prefer bold or bulk styles.

Unmatched names are intentionally not guessed. Use `dist/tabler-compat-map.json` to review the missing list and decide whether a synonym mapping should be added.
