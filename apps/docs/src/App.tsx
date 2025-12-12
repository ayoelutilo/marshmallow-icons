import React, { useMemo, useState } from "react";
import { icons, iconsMeta, type IconName } from "marshmallow-icons";

function copy(text: string) {
  return navigator.clipboard?.writeText(text);
}

export function App() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(28);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconsMeta;
    return iconsMeta.filter((m) => {
      return (
        m.id.toLowerCase().includes(q) ||
        m.componentName.toLowerCase().includes(q) ||
        m.filePath.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="page">
      <header className="header">
        <div className="title">
          <h1>Marshmallow UDS Icons</h1>
          <p>Browse and preview SVG icons exported as React components.</p>
        </div>

        <div className="controls">
          <label className="control">
            <span>Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type an icon id / component name..."
            />
          </label>

          <label className="control">
            <span>Size</span>
            <input
              type="range"
              min={12}
              max={96}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <span className="mono">{size}px</span>
          </label>
        </div>
      </header>

      <main className="grid">
        {filtered.length === 0 ? (
          <div className="empty">
            <h2>No icons found</h2>
            <p className="muted">
              If you haven’t generated icons yet, run{" "}
              <code>npm run icons:generate</code> at the repo root.
            </p>
          </div>
        ) : (
          filtered.map((m) => {
          const Comp = icons[m.id as IconName];
          const importLine = `import { ${m.componentName} } from "marshmallow-icons";`;
          return (
            <button
              key={m.id}
              className="card"
              onClick={() => copy(importLine)}
              title="Click to copy import"
              type="button"
            >
              <div className="iconWrap">
                {Comp ? <Comp width={size} height={size} /> : <span>?</span>}
              </div>
              <div className="meta">
                <div className="name mono">{m.componentName}</div>
                <div className="id mono">{m.id}</div>
              </div>
            </button>
          );
          })
        )}
      </main>
    </div>
  );
}


