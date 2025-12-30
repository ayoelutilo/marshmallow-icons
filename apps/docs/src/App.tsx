import React, { useEffect, useMemo, useState } from "react";
import { icons, iconsMeta, type IconName, MarshmallowLogo } from "marshmallow-icons";

function copy(text: string) {
  return navigator.clipboard?.writeText(text);
}

type IconMeta = (typeof iconsMeta)[number];
type IconColorInfo = IconMeta["colorInfo"];

function normalizeColor(c?: string) {
  if (!c) return undefined;
  const v = c.trim();
  if (!v) return undefined;
  return v;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="colorField">
      <span className="colorLabel">{label}</span>
      <div className="colorRow">
        <input
          className="colorSwatch"
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="colorText mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#rrggbb"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

export function App() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(28);
  const [selected, setSelected] = useState<IconMeta | null>(null);

  const [singleColor, setSingleColor] = useState("#ffffff");
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#707276");
  const [multiColors, setMultiColors] = useState<string[]>(["#d9d9d9", "#ffffff", "#000000"]);
  const [logoColor, setLogoColor] = useState("#ffffff");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconsMeta;
    return iconsMeta.filter((m) => {
      return (
        m.id.toLowerCase().includes(q) ||
        m.componentName.toLowerCase().includes(q) ||
        m.filePath.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof iconsMeta>();
    
    for (const icon of filtered) {
      const category = icon.category || "Other";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(icon);
    }
    
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, icons]) => ({ category, icons }));
  }, [filtered]);

  useEffect(() => {
    if (!selected) return;
    const ci = selected.colorInfo as IconColorInfo;
    const originals = ci && "originalColors" in ci ? (ci as any).originalColors as string[] | undefined : undefined;

    if (ci?.type === "single") {
      setSingleColor((originals?.[0] as string) || "#ffffff");
    } else if (ci?.type === "duotone") {
      setPrimaryColor((originals?.[0] as string) || "#ffffff");
      setSecondaryColor((originals?.[1] as string) || "#707276");
    } else if (ci?.type === "multi") {
      setMultiColors((originals && originals.length ? originals : ["#d9d9d9", "#ffffff", "#000000"]).slice(0, 8));
    }
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const selectedCode = useMemo(() => {
    if (!selected) return null;

    const componentName = selected.componentName;
    const ci = selected.colorInfo as IconColorInfo;

    const importLine = `import { ${componentName} } from "marshmallow-icons";`;

    let props: Record<string, any> = { width: size, height: size };
    let propsCode = `width={${size}} height={${size}}`;

    if (ci?.type === "single") {
      const v = normalizeColor(singleColor);
      if (v) {
        props.color = v;
        propsCode += ` color="${v}"`;
      }
    } else if (ci?.type === "duotone") {
      const p = normalizeColor(primaryColor);
      const s = normalizeColor(secondaryColor);
      if (p) {
        props.primaryColor = p;
        propsCode += ` primaryColor="${p}"`;
      }
      if (s) {
        props.secondaryColor = s;
        propsCode += ` secondaryColor="${s}"`;
      }
    } else if (ci?.type === "multi") {
      const list = multiColors.map(normalizeColor).filter(Boolean) as string[];
      if (list.length) {
        props.colors = list;
        propsCode += ` colors={${JSON.stringify(list)}}`;
      }
    }

    const jsx = `<${componentName} ${propsCode} />`;
    const full = `${importLine}\n\n${jsx}`;

    return { importLine, jsx, full, props };
  }, [selected, size, singleColor, primaryColor, secondaryColor, multiColors]);

  return (
    <div className="page">
      <header className="header">
        <div className="title">
          <div className="logo-row">
            <button
              className="logo-button"
              onClick={() => {
                const logoMeta = iconsMeta.find(m => m.id === "assets/svg/marshmallow-logo");
                if (logoMeta) setSelected(logoMeta as IconMeta);
              }}
              title="Click to customize logo color"
              type="button"
            >
              <MarshmallowLogo width={32} height={32} color="#ffffff" />
            </button>
            <h1>Marshmallow UDS Icons</h1>
          </div>
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

      <main className="content">
        {filtered.length === 0 ? (
          <div className="empty">
            <h2>No icons found</h2>
            <p className="muted">
              If you haven't generated icons yet, run{" "}
              <code>npm run icons:generate</code> at the repo root.
            </p>
          </div>
        ) : (
          grouped.map(({ category, icons: categoryIcons }) => (
            <section key={category} className="category-section">
              <h2 className="category-title">{category}</h2>
              <div className="grid">
                {categoryIcons.map((m) => {
                  const Comp = icons[m.id as IconName];
                  return (
                    <button
                      key={m.id}
                      className="card"
                      onClick={() => setSelected(m as IconMeta)}
                      title="Click to customize"
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
                })}
              </div>
            </section>
          ))
        )}
      </main>


      {selected && selectedCode ? (
        <div className="modalOverlay" onMouseDown={() => setSelected(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">
                <div className="mono">{selected.componentName}</div>
                <div className="muted mono">{selected.id}</div>
              </div>
              <button className="modalClose" type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <div className="modalBody">
              <div className="previewRow">
                <div className="previewIcon">
                  {(() => {
                    const Comp = icons[selected.id as IconName] as any;
                    if (!Comp) return <span>?</span>;
                    return (
                      <Comp
                        width={size}
                        height={size}
                        {...(selectedCode.props as any)}
                      />
                    );
                  })()}
                </div>

                <div className="copyRow">
                  <button className="copyBtn" type="button" onClick={() => copy(selectedCode.importLine)}>
                    Copy import
                  </button>
                  <button className="copyBtn" type="button" onClick={() => copy(selectedCode.jsx)}>
                    Copy JSX
                  </button>
                  <button className="copyBtn" type="button" onClick={() => copy(selectedCode.full)}>
                    Copy import + JSX
                  </button>
                </div>
              </div>

              {selected.colorInfo?.type === "single" ? (
                <div className="controlsPanel">
                  <ColorField label="Color" value={singleColor} onChange={setSingleColor} />
                </div>
              ) : null}

              {selected.colorInfo?.type === "duotone" ? (
                <div className="controlsPanel">
                  <ColorField label="Primary" value={primaryColor} onChange={setPrimaryColor} />
                  <ColorField label="Secondary" value={secondaryColor} onChange={setSecondaryColor} />
                </div>
              ) : null}

              {selected.colorInfo?.type === "multi" ? (
                <div className="controlsPanel">
                  <div className="multiHeader">
                    <span className="muted">Colors</span>
                    <button
                      className="miniBtn"
                      type="button"
                      onClick={() => setMultiColors((c) => [...c, "#ffffff"].slice(0, 8))}
                    >
                      + Add
                    </button>
                  </div>
                  <div className="multiGrid">
                    {multiColors.map((c, idx) => (
                      <div key={idx} className="multiItem">
                        <ColorField
                          label={`#${idx + 1}`}
                          value={c}
                          onChange={(next) =>
                            setMultiColors((prev) => prev.map((p, i) => (i === idx ? next : p)))
                          }
                        />
                        <button
                          className="miniBtn danger"
                          type="button"
                          onClick={() => setMultiColors((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={multiColors.length <= 1}
                          title="Remove color"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="codeBlock mono">
                <div className="codeLine">{selectedCode.importLine}</div>
                <div className="codeLine">&nbsp;</div>
                <div className="codeLine">{selectedCode.jsx}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


