# marshmallow-icons

React components generated from all `.svg` files under `assets/svg` in the repo.

## Usage

```tsx
import { icons, type IconName } from "marshmallow-icons";

export function AnyIcon({ name }: { name: IconName }) {
  const Icon = icons[name];
  return <Icon width={24} height={24} />;
}
```

Or import a specific icon component (after running generation):

```tsx
import { LinearPlay } from "marshmallow-icons";
```

## Dev

```bash
npm run -w marshmallow-icons generate
npm run -w marshmallow-icons build
```