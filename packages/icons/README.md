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

## Customizing Colors

Icons support customizable colors through props. All color props are optional and fall back to `currentColor` if not provided.

### Single-Color Icons

Single-color icons (like `LosiBroken`) accept a `color` prop:

```tsx
import { LosiBroken } from "marshmallow-icons";

// Using the color prop
<LosiBroken color="#ff0000" />

// Or use currentColor (inherits text color)
<LosiBroken style={{ color: '#ff0000' }} />
```

### Duotone Icons

Duotone icons (like `LosiTwotone`, `LosiOutline`, `LosiBulk`) accept `primaryColor` and `secondaryColor` props:

```tsx
import { LosiTwotone } from "marshmallow-icons";

<LosiTwotone 
  primaryColor="#ff0000" 
  secondaryColor="#00ff00" 
/>
```

### Multi-Color Icons

Multi-color icons (like `LosiBold`) accept a `colors` array prop:

```tsx
import { LosiBold } from "marshmallow-icons";

<LosiBold colors={["#ff0000", "#00ff00", "#0000ff"]} />
```

## Dev

```bash
npm run -w marshmallow-icons generate
npm run -w marshmallow-icons build
```