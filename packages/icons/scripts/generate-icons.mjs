import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "@svgr/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// packages/icons/scripts -> repo root
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const assetsRoot = path.resolve(repoRoot, "assets", "svg");
const pkgRoot = path.resolve(repoRoot, "packages", "icons");
const outDir = path.resolve(pkgRoot, "src", "generated");
const indexFile = path.resolve(outDir, "index.ts");

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "packages",
  "apps"
]);

function toPascalCase(input) {
  const parts = input
    .replace(/\.svg$/i, "")
    .replace(/^Property\s*1=/i, "") // common Figma export prefix
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean);

  const name = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("");

  if (!name) return "Icon";
  if (/^\d/.test(name)) return `Icon${name}`;
  return name;
}

function posixify(p) {
  return p.split(path.sep).join("/");
}

function processSvgColors(svgContent, isLosiVariant, variantType) {
  // Extract all unique fill and stroke colors
  const fillMatches = svgContent.matchAll(/fill="([^"]+)"/g);
  const strokeMatches = svgContent.matchAll(/stroke="([^"]+)"/g);
  
  const colors = new Set();
  for (const match of fillMatches) {
    if (match[1] !== "none") colors.add(match[1]);
  }
  for (const match of strokeMatches) {
    if (match[1] !== "none") colors.add(match[1]);
  }
  
  const uniqueColors = Array.from(colors);
  let processedContent = svgContent;
  let colorInfo = null;
  
  // Single color icon - use color prop
  if (uniqueColors.length === 1) {
    const color = uniqueColors[0];
    processedContent = processedContent.replace(new RegExp(`fill="${color}"`, 'g'), 'fill={color || "currentColor"}');
    processedContent = processedContent.replace(new RegExp(`stroke="${color}"`, 'g'), 'stroke={color || "currentColor"}');
    colorInfo = { type: 'single', prop: 'color', originalColors: [color] };
  }
  // Duotone icon - use primaryColor and secondaryColor props
  else if (uniqueColors.length === 2) {
    const [primary, secondary] = uniqueColors;
    processedContent = processedContent.replace(new RegExp(`fill="${primary}"`, 'g'), 'fill={primaryColor || "currentColor"}');
    processedContent = processedContent.replace(new RegExp(`stroke="${primary}"`, 'g'), 'stroke={primaryColor || "currentColor"}');
    processedContent = processedContent.replace(new RegExp(`fill="${secondary}"`, 'g'), 'fill={secondaryColor || "currentColor"}');
    processedContent = processedContent.replace(new RegExp(`stroke="${secondary}"`, 'g'), 'stroke={secondaryColor || "currentColor"}');
    colorInfo = { type: 'duotone', props: ['primaryColor', 'secondaryColor'], originalColors: [primary, secondary] };
  }
  // Multi-color icon - use colors array prop
  else if (uniqueColors.length > 2) {
    uniqueColors.forEach((color, index) => {
      processedContent = processedContent.replace(new RegExp(`fill="${color}"`, 'g'), `fill={colors?.[${index}] || "currentColor"}`);
      processedContent = processedContent.replace(new RegExp(`stroke="${color}"`, 'g'), `stroke={colors?.[${index}] || "currentColor"}`);
    });
    colorInfo = { type: 'multi', prop: 'colors', originalColors: uniqueColors };
  }
  
  return { processedContent, colorInfo };
}

async function walk(dir, results) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.has(ent.name)) continue;
      await walk(full, results);
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".svg")) {
      results.push(full);
    }
  }
}

async function main() {
  const assetsRoot = path.resolve(repoRoot, "assets", "svg");
  const svgFiles = [];
  await walk(assetsRoot, svgFiles);
  console.log(`Found ${svgFiles.length} SVG files`);

  await fs.mkdir(outDir, { recursive: true });

  // Clear previous generated files
  const existing = await fs.readdir(outDir).catch(() => []);
  await Promise.all(
    existing.map((f) => fs.rm(path.join(outDir, f), { force: true }))
  );

  const usedComponentNames = new Map(); // name -> count
  const normalizedNames = new Map(); // lowercase name -> canonical name
  const items = [];

  for (const svgAbsPath of svgFiles.sort()) {
    const relFromRepo = posixify(path.relative(repoRoot, svgAbsPath));
    const base = path.basename(svgAbsPath);
    const rawName = base.replace(/\.svg$/i, "");

    let componentName = toPascalCase(rawName);
    
    // Check if this is a Losi variant icon and rename accordingly
    const losiVariantMatch = componentName.match(/^(Bold|Broken|Bulk|Twotone|Outline)(\d+)$/);
    let isLosiVariant = false;
    let losiVariantType = null;
    if (losiVariantMatch) {
      const variant = losiVariantMatch[1];
      componentName = `Losi${variant}`;
      isLosiVariant = true;
      losiVariantType = variant.toLowerCase();
    }
    
    // Also check if it's a Losi or LosiMain component
    if (componentName === "Losi" || componentName === "LosiMain" || componentName.startsWith("Losi")) {
      isLosiVariant = true;
      if (componentName === "LosiMain") {
        losiVariantType = "main";
      } else if (componentName === "Losi") {
        losiVariantType = "default";
      }
    }
    
    const normalizedKey = componentName.toLowerCase();
    
    // Handle case conflicts - use first casing we see
    if (normalizedNames.has(normalizedKey)) {
      const canonicalName = normalizedNames.get(normalizedKey);
      if (canonicalName !== componentName) {
        // Case conflict - use canonical name
        componentName = canonicalName;
      }
    } else {
      normalizedNames.set(normalizedKey, componentName);
    }
    
    const count = usedComponentNames.get(componentName) ?? 0;
    usedComponentNames.set(componentName, count + 1);
    if (count > 0) componentName = `${componentName}${count + 1}`;

    const svgCode = await fs.readFile(svgAbsPath, "utf8");

    // Simple manual conversion: wrap SVG in React component
    let cleanSvg = svgCode.trim();
    
    if (!cleanSvg || cleanSvg.length === 0) {
      console.warn(`Skipping ${svgAbsPath}: empty file`);
      continue;
    }
    
    // Extract SVG tag and content using regex - be more flexible
    let svgMatch = cleanSvg.match(/<svg\s+([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!svgMatch) {
      // Try with optional whitespace
      svgMatch = cleanSvg.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/i);
    }
    if (!svgMatch) {
      // Try without attributes
      const simpleMatch = cleanSvg.match(/<svg>([\s\S]*?)<\/svg>/i);
      if (!simpleMatch) {
        console.warn(`Skipping ${svgAbsPath}: invalid SVG format - first 100 chars: ${cleanSvg.substring(0, 100)}`);
        continue;
      }
      let svgContent = simpleMatch[1].trim();
      // Process colors to make them customizable
      const { processedContent, colorInfo } = processSvgColors(svgContent, isLosiVariant, losiVariantType);
      svgContent = processedContent;
      
      // Build props interface
      let propsInterface = "SVGProps<SVGSVGElement>";
      let propsDestructure = "props";
      if (colorInfo) {
        if (colorInfo.type === 'single') {
          propsInterface = `SVGProps<SVGSVGElement> & { ${colorInfo.prop}?: string }`;
          propsDestructure = `{ ${colorInfo.prop}, ...props }`;
        } else if (colorInfo.type === 'duotone') {
          propsInterface = `SVGProps<SVGSVGElement> & { ${colorInfo.props[0]}?: string; ${colorInfo.props[1]}?: string }`;
          propsDestructure = `{ ${colorInfo.props[0]}, ${colorInfo.props[1]}, ...props }`;
        } else if (colorInfo.type === 'multi') {
          propsInterface = `SVGProps<SVGSVGElement> & { ${colorInfo.prop}?: string[] }`;
          propsDestructure = `{ ${colorInfo.prop}, ...props }`;
        }
      }
      
      const tsx = `import * as React from "react";
import { SVGProps } from "react";

const ${componentName} = (${propsDestructure}: ${propsInterface}) => (
  <svg {...props}>
${svgContent.split('\n').map(line => `    ${line}`).join('\n')}
  </svg>
);

export default ${componentName};
`;
      const outFile = path.join(outDir, `${componentName}.tsx`);
      await fs.writeFile(outFile, tsx, "utf8");
      items.push({
        id: relFromRepo.replace(/\.svg$/i, ""),
        componentName,
        filePath: relFromRepo,
        category: componentName.startsWith("Losi") ? "Losi" : "Other",
        tags: componentName.startsWith("Losi") ? ["losi"] : [],
        name: componentName.toLowerCase(),
        colorInfo: colorInfo || null
      });
      continue;
    }
    
    const svgAttrs = svgMatch[1].trim();
    let svgContent = svgMatch[2].trim();
    
    // Process colors to make them customizable
    const { processedContent, colorInfo } = processSvgColors(svgContent, isLosiVariant, losiVariantType);
    svgContent = processedContent;
    
    // Build props interface
    let propsInterface = "SVGProps<SVGSVGElement>";
    let propsDestructure = "props";
    if (colorInfo) {
      if (colorInfo.type === 'single') {
        propsInterface = `SVGProps<SVGSVGElement> & { ${colorInfo.prop}?: string }`;
        propsDestructure = `{ ${colorInfo.prop}, ...props }`;
      } else if (colorInfo.type === 'duotone') {
        propsInterface = `SVGProps<SVGSVGElement> & { ${colorInfo.props[0]}?: string; ${colorInfo.props[1]}?: string }`;
        propsDestructure = `{ ${colorInfo.props[0]}, ${colorInfo.props[1]}, ...props }`;
      } else if (colorInfo.type === 'multi') {
        propsInterface = `SVGProps<SVGSVGElement> & { ${colorInfo.prop}?: string[] }`;
        propsDestructure = `{ ${colorInfo.prop}, ...props }`;
      }
    }
    
    // Create React component
    const tsx = `import * as React from "react";
import { SVGProps } from "react";

const ${componentName} = (${propsDestructure}: ${propsInterface}) => (
  <svg ${svgAttrs} {...props}>
${svgContent.split('\n').map(line => `    ${line}`).join('\n')}
  </svg>
);

export default ${componentName};
`;

    const outFile = path.join(outDir, `${componentName}.tsx`);
    await fs.writeFile(outFile, tsx, "utf8");

    // Extract semantic name from filename
    const styleTags = ["bold", "linear", "outline", "twotone", "bulk", "broken"];
    let semanticName = rawName
      .replace(/^Property\s*1=/i, "")
      .replace(/^(bold|linear|outline|twotone|bulk|broken)[-\s]/i, "") // Remove style prefix
      .replace(/^(\d+)$/, "") // Remove pure numbers
      .replace(/[-\s](\d+)$/, "") // Remove trailing numbers like "icon-1" -> "icon"
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .toLowerCase();
    
    // Use component name as fallback for name field
    if (!semanticName || semanticName.length < 2 || styleTags.includes(semanticName)) {
      semanticName = componentName.toLowerCase();
    }
    
    // Check if this is a Losi variant icon (use the flag we determined earlier, or check again)
    const isLosiVariantCheck = isLosiVariant || /^Losi(Bold|Broken|Bulk|Twotone|Outline)$/i.test(componentName) ||
                          /Property\s*1=(bold|broken|bulk|twotone|outline)-\d+/i.test(rawName);
    
    let category;
    const tags = [];
    
    if (isLosiVariantCheck) {
      // These are Losi variants - categorize as "Losi"
      category = "Losi";
      
      // Extract the variant type from component name or raw name
      const variantMatch = componentName.match(/^Losi(Bold|Broken|Bulk|Twotone|Outline)$/i) ||
                          rawName.match(/Property\s*1=(bold|broken|bulk|twotone|outline)-\d+/i);
      if (variantMatch) {
        const variant = variantMatch[1].toLowerCase();
        tags.push("losi", variant);
      } else {
        tags.push("losi");
      }
      
      // Update semantic name to be more descriptive
      if (variantMatch) {
        const variant = variantMatch[1].toLowerCase();
        semanticName = `losi ${variant}`;
      } else {
        semanticName = "losi";
      }
    } else {
      // Extract category from semantic name - use the base icon name (first significant word)
      // Remove numbers and get the main word
      category = semanticName
        .replace(/^\d+\s*/, "") // Remove leading numbers like "24 support" -> "support"
        .split(" ")[0] || "other";
      
      // Group single-letter or very short names into "Other"
      if (category.length <= 1) {
        category = "Other";
      }
      
      // Capitalize category for display
      category = category.charAt(0).toUpperCase() + category.slice(1);
      
      // Extract style from path
      const pathParts = relFromRepo.split("/").filter(Boolean);
      if (pathParts.length >= 4 && pathParts[2] === "vuesax") {
        const style = pathParts[3]; // bold, linear, outline, twotone, bulk, broken
        if (styleTags.includes(style)) {
          tags.push(style);
        }
      }
      
      // Add semantic name parts as tags
      if (semanticName && semanticName.length > 1) {
        const parts = semanticName.split(" ").filter(p => p.length > 2 && !styleTags.includes(p));
        tags.push(...parts);
      }
    }

    items.push({
      id: relFromRepo.replace(/\.svg$/i, ""),
      componentName,
      filePath: relFromRepo,
      category,
      tags: tags.filter(Boolean),
      name: semanticName || componentName.toLowerCase(),
      colorInfo: colorInfo || null
    });
  }

  // Build index.ts
  const exportLines = [];
  exportLines.push("/**");
  exportLines.push(" * AUTO-GENERATED FILE — DO NOT EDIT");
  exportLines.push(" * Generated by: packages/icons/scripts/generate-icons.mjs");
  exportLines.push(" */");
  exportLines.push("");
  exportLines.push('import type { ComponentType, SVGProps } from "react";');
  exportLines.push("");

  // Get unique component names
  const uniqueComponents = new Set(items.map(it => it.componentName));
  
  // Import all unique components
  for (const compName of Array.from(uniqueComponents).sort()) {
    exportLines.push(
      `import ${compName} from "./${compName}";`
    );
  }

  exportLines.push("");

  // Re-export all components
  for (const compName of Array.from(uniqueComponents).sort()) {
    exportLines.push(
      `export { default as ${compName} } from "./${compName}";`
    );
  }

  exportLines.push("");
  exportLines.push(
    "export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;"
  );
  exportLines.push("");

  exportLines.push("export const icons = {");
  for (const it of items) {
    exportLines.push(`  "${it.id}": ${it.componentName},`);
  }
  exportLines.push("} as const;");
  exportLines.push("");
  exportLines.push("export type IconName = keyof typeof icons;");
  exportLines.push("");
  exportLines.push("export const iconsMeta = [");
  for (const it of items) {
    const tagsStr = JSON.stringify(it.tags || []);
    const colorInfoStr = it.colorInfo ? JSON.stringify(it.colorInfo) : "null";
    exportLines.push(
      `  { id: "${it.id}", componentName: "${it.componentName}", filePath: "${it.filePath}", category: "${it.category || "default"}", tags: ${tagsStr}, name: "${it.name || it.componentName.toLowerCase()}", colorInfo: ${colorInfoStr} },`
    );
  }
  exportLines.push("] as const;");
  exportLines.push("");

  await fs.writeFile(indexFile, exportLines.join("\n"), "utf8");

  console.log(`Generated ${items.length} icon components.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


