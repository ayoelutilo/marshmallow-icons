import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// packages/icons/scripts -> repo root
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const packageRoot = path.resolve(__dirname, "..");
const monorepoPkgRoot = path.resolve(repoRoot, "packages", "icons");
const pkgRoot = fsSync.existsSync(monorepoPkgRoot) ? monorepoPkgRoot : packageRoot;
const localAssetsRoot = path.resolve(pkgRoot, "assets", "svg");
const repoAssetsRoot = path.resolve(repoRoot, "assets", "svg");
const assetsRoot = fsSync.existsSync(localAssetsRoot) ? localAssetsRoot : repoAssetsRoot;
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

function toDisplayName(input) {
  return input
    .replace(/\.svg$/i, "")
    .replace(/^Property\s*1=/i, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function makeUniqueName(baseName, usedNames) {
  let name = baseName;
  let suffix = 2;

  while (usedNames.has(name)) {
    name = `${baseName}${suffix}`;
    suffix += 1;
  }

  usedNames.add(name);
  return name;
}

function posixify(p) {
  return p.split(path.sep).join("/");
}

const REACT_SVG_ATTRS = new Map([
  ["accent-height", "accentHeight"],
  ["alignment-baseline", "alignmentBaseline"],
  ["baseline-shift", "baselineShift"],
  ["clip-path", "clipPath"],
  ["clip-rule", "clipRule"],
  ["color-interpolation", "colorInterpolation"],
  ["color-interpolation-filters", "colorInterpolationFilters"],
  ["color-profile", "colorProfile"],
  ["color-rendering", "colorRendering"],
  ["dominant-baseline", "dominantBaseline"],
  ["enable-background", "enableBackground"],
  ["fill-opacity", "fillOpacity"],
  ["fill-rule", "fillRule"],
  ["flood-color", "floodColor"],
  ["flood-opacity", "floodOpacity"],
  ["font-family", "fontFamily"],
  ["font-size", "fontSize"],
  ["font-size-adjust", "fontSizeAdjust"],
  ["font-stretch", "fontStretch"],
  ["font-style", "fontStyle"],
  ["font-variant", "fontVariant"],
  ["font-weight", "fontWeight"],
  ["glyph-name", "glyphName"],
  ["glyph-orientation-horizontal", "glyphOrientationHorizontal"],
  ["glyph-orientation-vertical", "glyphOrientationVertical"],
  ["horiz-adv-x", "horizAdvX"],
  ["horiz-origin-x", "horizOriginX"],
  ["image-rendering", "imageRendering"],
  ["letter-spacing", "letterSpacing"],
  ["lighting-color", "lightingColor"],
  ["marker-end", "markerEnd"],
  ["marker-mid", "markerMid"],
  ["marker-start", "markerStart"],
  ["mask-type", "maskType"],
  ["overline-position", "overlinePosition"],
  ["overline-thickness", "overlineThickness"],
  ["paint-order", "paintOrder"],
  ["panose-1", "panose1"],
  ["pointer-events", "pointerEvents"],
  ["shape-rendering", "shapeRendering"],
  ["stop-color", "stopColor"],
  ["stop-opacity", "stopOpacity"],
  ["strikethrough-position", "strikethroughPosition"],
  ["strikethrough-thickness", "strikethroughThickness"],
  ["stroke-dasharray", "strokeDasharray"],
  ["stroke-dashoffset", "strokeDashoffset"],
  ["stroke-linecap", "strokeLinecap"],
  ["stroke-linejoin", "strokeLinejoin"],
  ["stroke-miterlimit", "strokeMiterlimit"],
  ["stroke-opacity", "strokeOpacity"],
  ["stroke-width", "strokeWidth"],
  ["text-anchor", "textAnchor"],
  ["text-decoration", "textDecoration"],
  ["text-rendering", "textRendering"],
  ["transform-origin", "transformOrigin"],
  ["underline-position", "underlinePosition"],
  ["underline-thickness", "underlineThickness"],
  ["unicode-bidi", "unicodeBidi"],
  ["unicode-range", "unicodeRange"],
  ["units-per-em", "unitsPerEm"],
  ["vector-effect", "vectorEffect"],
  ["vert-adv-y", "vertAdvY"],
  ["vert-origin-x", "vertOriginX"],
  ["vert-origin-y", "vertOriginY"],
  ["word-spacing", "wordSpacing"],
  ["writing-mode", "writingMode"],
  ["xmlns:xlink", "xmlnsXlink"],
  ["xlink:href", "xlinkHref"]
]);

const STYLE_TAGS = ["bold", "linear", "outline", "twotone", "bulk", "broken", "fade"];
const STYLE_LABELS = {
  bold: "Bold",
  bolds: "Bold",
  broken: "Broken",
  bulk: "Bulk",
  fade: "Fade",
  linear: "Linear",
  outline: "Outline",
  twotone: "Twotone",
  "twotone-alt": "TwotoneAlt"
};

const ROOT_STYLE_PREFIXES = new Set([
  "bolds",
  "bold",
  "broken",
  "bulk",
  "fade",
  "linear",
  "outline",
  "twotone",
  "twotone-alt"
]);

const TOKEN_REPLACEMENTS = new Map([
  ["3dcube", ["3d", "cube"]],
  ["3square", ["3", "square"]],
  ["3full", ["3", "full"]],
  ["additem", ["add", "item"]],
  ["autobrightness", ["auto", "brightness"]],
  ["bootsrap", ["bootstrap"]],
  ["brifecase", ["briefcase"]],
  ["buliding", ["building"]],
  ["cirlce", ["circle"]],
  ["colorfilter", ["color", "filter"]],
  ["convertshape", ["convert", "shape"]],
  ["cricle", ["circle"]],
  ["designtools", ["design", "tools"]],
  ["directbox", ["direct", "box"]],
  ["disscount", ["discount"]],
  ["firstline", ["first", "line"]],
  ["googlepaly", ["google", "play"]],
  ["grammerly", ["grammarly"]],
  ["happyemoji", ["happy", "emoji"]],
  ["magicpen", ["magic", "pen"]],
  ["mobbile", ["mobile"]],
  ["moneyrecive", ["money", "receive"]],
  ["musicnote", ["music", "note"]],
  ["paintbucket", ["paint", "bucket"]],
  ["personalcard", ["personal", "card"]],
  ["pharagraphspacing", ["paragraph", "spacing"]],
  ["presention", ["presentation"]],
  ["recive", ["receive"]],
  ["repeate", ["repeat"]],
  ["smallcaps", ["small", "caps"]],
  ["sqaure", ["square"]],
  ["stickynote", ["sticky", "note"]],
  ["textalign", ["text", "align"]],
  ["trush", ["trash"]]
]);

const COMPATIBILITY_NAME_ALIASES = new Map([
  ["BoldsBattery", "IconBarbellBold"],
  ["FadeBattery", "IconBarbellFade"],
  ["LinearBattery", "IconBarbellLinear"],
  ["TwotoneAltBattery", "IconBarbellTwotoneAlt"],
  ["TwotoneBattery", "IconDislikeTwotone"],
  ["TwotoneBookmark", "IconTrashTwotone"],
  ["TwotoneChart", "IconScissorTwotone"],
  ["TwotoneContrast", "IconPenToolTwotone"],
  ["TwotoneDislike", "IconContrastTwotone"],
  ["TwotoneDocumentBlank", "IconLocationTwotone"],
  ["TwotoneDocumentText", "IconBookmarkTwotone"],
  ["TwotoneDocument", "IconBarbellTwotone"],
  ["TwotoneEdit", "IconSendTwotone"],
  ["TwotoneGallery", "IconLockTwotone"],
  ["TwotoneHome", "IconChartTwotone"],
  ["TwotoneKey", "IconDocumentTwotone"],
  ["TwotoneLocation", "IconHomeTwotone"],
  ["TwotoneLock", "IconEditTwotone"],
  ["TwotoneMicrophone", "IconDocumentBlankTwotone"],
  ["TwotoneSearch", "IconPaintBucketTwotone"],
  ["TwotoneSparkle", "IconMicrophoneTwotone"],
  ["TwotoneStar", "IconColorSwatchTwotone"],
  ["TwotoneTrash", "IconSearchTwotone"],
  ["TwotoneUnlock", "IconDocumentTextTwotone"],
  ["AlignBottom", "IconAlignTopBold"],
  ["AlignBottom2", "IconAlignTopLinear"],
  ["Check", "IconSplitPanelBold"],
  ["Check2", "IconSplitPanelLinear"],
  ["Devices1", "IconBrightnessMeterBold"],
  ["Devices12", "IconBrightnessMeterLinear"],
  ["Eye1", "IconEyeSparkleBold"],
  ["Eye2", "IconEyeSparkleAltBold"],
  ["Eye12", "IconEyeSparkleLinear"],
  ["Eye22", "IconEyeSparkleAltLinear"],
  ["Frame", "IconUserAltBold"],
  ["Frame1", "IconBubbleCircleBold"],
  ["Frame2", "IconElement2AltBold"],
  ["Frame3", "IconImportCircleLinear"],
  ["Frame4", "IconAlignBottomBold"],
  ["Frame5", "IconChartBarLinear"],
  ["Frame6", "IconLinkSquareAltLinear"],
  ["Frame7", "IconMedalAltLinear"],
  ["Frame12", "IconAwardCircleBulk"],
  ["Frame13", "IconArrowSwapVerticalLinear"],
  ["Frame22", "IconInterlockingCubesBulk"],
  ["Frame23", "IconChevronCircleUpLinear"],
  ["Frame32", "IconPlanetSlashBulk"],
  ["Frame33", "IconMessageCloseLinear"],
  ["Frame42", "IconCrownCircleBulk"],
  ["Frame43", "IconBookmarkAltLinear"],
  ["Group1", "IconConvertCardLinear"],
  ["Group2", "IconPercentageCircleLinear"],
  ["Group3", "IconPaintRollerLinear"],
  ["Group4", "IconTruckFastLinear"],
  ["Group5", "IconTruckLinear"],
  ["Group6", "IconProhibitedLinear"],
  ["Group7", "IconCloseOctagonLinear"],
  ["Group8", "IconHomePentagonLinear"],
  ["Group9", "IconShuffleLinear"],
  ["Icon", "IconScanFrameBold"],
  ["Icon1", "IconAwardRibbonCircleBold"],
  ["Icon2", "IconFilledCircleBroken"],
  ["Icon3", "IconScanFrameOutline"],
  ["Icon4", "IconFilledRoundedSquareTwotone"],
  ["Icon12", "IconAwardRibbonCircleOutline"],
  ["Icon13", "IconFilledCircleTwotone"],
  ["Icon3full", "IconBattery3FullBold"],
  ["Icon3full2", "IconBattery3FullLinear"],
  ["IconSymbols1", "IconMarshmallowSymbolsSpec"],
  ["MarshmallowLogo", "IconMarshmallowShadow"],
  ["IconGoogle1Bold", "IconGoogleDriveBold"],
  ["IconGoogle1Bulk", "IconGoogleDriveBulk"],
  ["IconGoogle1Linear", "IconGoogleDriveLinear"],
  ["IconGoogle1Twotone", "IconGoogleDriveTwotone"],
  ["IconGooglePalyOutline", "IconGooglePlayOutline"],
  ["IconGooglePaly", "IconGooglePlay"],
  ["Google1", "IconGoogleDriveBold"],
  ["Google12", "IconGoogleDriveBulk"],
  ["Google13", "IconGoogleDriveLinear"],
  ["Google14", "IconGoogleDriveTwotone"],
  ["GooglePaly", "IconGooglePlayOutline"],
  ["OutlineGooglePaly", "IconGooglePlayOutline"],
  ["VuesaxOutlineGooglePaly", "IconGooglePlayOutline"],
  ["VuesaxBoldGoogle1", "IconGoogleDriveBold"],
  ["VuesaxBulkGoogle1", "IconGoogleDriveBulk"],
  ["VuesaxLinearGoogle1", "IconGoogleDriveLinear"],
  ["VuesaxTwotoneGoogle1", "IconGoogleDriveTwotone"]
]);

function toReactSvgAttributes(input) {
  let output = input;
  for (const [from, to] of REACT_SVG_ATTRS) {
    output = output.replace(new RegExp(from, "g"), to);
  }
  return output;
}

function getStyleInfo(relFromRepo, rawName) {
  const pathParts = relFromRepo.split("/").filter(Boolean);

  if (pathParts.length >= 4 && pathParts[0] === "assets" && pathParts[1] === "svg" && pathParts[2] === "vuesax") {
    const style = pathParts[3];
    if (STYLE_TAGS.includes(style)) {
      return { style, stylePrefix: style };
    }
  }

  const normalizedRaw = rawName.toLowerCase();
  if (normalizedRaw.startsWith("twotone-alt-")) {
    return { style: "twotone", stylePrefix: "twotone-alt" };
  }
  if (normalizedRaw.startsWith("bolds-")) {
    return { style: "bold", stylePrefix: "bolds" };
  }
  if (normalizedRaw.startsWith("fade-")) {
    return { style: "fade", stylePrefix: "fade" };
  }
  for (const style of STYLE_TAGS) {
    if (normalizedRaw.startsWith(`${style}-`)) {
      return { style, stylePrefix: style };
    }
  }

  return { style: null, stylePrefix: null };
}

function normalizeLegacyName(name) {
  const replacements = [
    [/Bootsrap/g, "Bootstrap"],
    [/Brifecase/g, "Briefcase"],
    [/Buliding/g, "Building"],
    [/GooglePaly/g, "GooglePlay"],
    [/Grammerly/g, "Grammarly"],
    [/Sqaure/g, "Square"],
    [/Cirlce/g, "Circle"],
    [/Cricle/g, "Circle"],
    [/Recive/g, "Receive"],
    [/Mobbile/g, "Mobile"],
    [/Pharagraphspacing/g, "ParagraphSpacing"],
    [/Presention/g, "Presentation"],
    [/Disscount/g, "Discount"],
    [/Repeate/g, "Repeat"],
    [/Trush/g, "Trash"],
    [/Additem/g, "AddItem"],
    [/Autobrightness/g, "AutoBrightness"],
    [/Colorfilter/g, "ColorFilter"],
    [/Designtools/g, "DesignTools"],
    [/Directbox/g, "DirectBox"],
    [/Happyemoji/g, "HappyEmoji"],
    [/Magicpen/g, "MagicPen"],
    [/Musicnote/g, "MusicNote"],
    [/Paintbucket/g, "PaintBucket"],
    [/Personalcard/g, "PersonalCard"],
    [/Smallcaps/g, "SmallCaps"],
    [/Stickynote/g, "StickyNote"],
    [/Textalign/g, "TextAlign"],
    [/Justifycenter/g, "JustifyCenter"],
    [/Justifyleft/g, "JustifyLeft"],
    [/Justifyright/g, "JustifyRight"]
  ];

  return replacements.reduce((next, [pattern, replacement]) => next.replace(pattern, replacement), name);
}

function stripSvgExtension(input) {
  return input.replace(/\.svg$/i, "");
}

function cleanRawName(input) {
  return stripSvgExtension(input)
    .replace(/^Property\s*1=/i, "")
    .replace(/[()]/g, " ");
}

function expandNameToken(token) {
  const normalized = token.toLowerCase();
  return TOKEN_REPLACEMENTS.get(normalized) || [normalized];
}

function getNameTokens(input, { stripStylePrefix = false } = {}) {
  let normalized = cleanRawName(input)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) return [];

  let tokens = normalized.split(" ").filter(Boolean);
  if (stripStylePrefix && tokens.length > 0) {
    const twoPartPrefix = tokens.slice(0, 2).join("-");
    if (ROOT_STYLE_PREFIXES.has(twoPartPrefix)) {
      tokens = tokens.slice(2);
    } else if (ROOT_STYLE_PREFIXES.has(tokens[0])) {
      tokens = tokens.slice(1);
    }
  }

  return tokens.flatMap(expandNameToken).filter(Boolean);
}

function toPascalFromTokens(tokens) {
  const name = tokens
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join("");

  if (!name) return "Icon";
  if (/^\d/.test(name)) return `Icon${name}`;
  return name;
}

function toIconBaseName(tokens) {
  let semanticTokens = tokens;
  if (semanticTokens.length > 1 && semanticTokens[0] === "icon") {
    semanticTokens = semanticTokens.slice(1);
  }

  semanticTokens = semanticTokens.filter((token, index) => index === 0 || token !== semanticTokens[index - 1]);

  const name = semanticTokens
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join("");

  return name || "Unknown";
}

function toDisplayNameFromTokens(tokens) {
  return tokens.join(" ");
}

function styleLabel(stylePrefix, style) {
  if (!stylePrefix && !style) return null;
  return STYLE_LABELS[stylePrefix] || STYLE_LABELS[style] || toPascalCase(stylePrefix || style || "");
}

function makeUniqueVariantName(baseName, usedNames) {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let suffix = 1;
  let name = `${baseName}Alt`;
  while (usedNames.has(name)) {
    suffix += 1;
    name = `${baseName}Alt${suffix}`;
  }

  usedNames.add(name);
  return name;
}

function detectLosiName(rawName) {
  let candidateName = toPascalCase(rawName);
  const losiVariantMatch = candidateName.match(/^(Bold|Broken|Bulk|Twotone|Outline)(\d+)$/);

  if (losiVariantMatch) {
    return {
      componentName: `Losi${losiVariantMatch[1]}`,
      variantType: losiVariantMatch[1].toLowerCase()
    };
  }

  if (candidateName === "Losi") {
    return { componentName: "Losi", variantType: "default" };
  }

  if (candidateName === "LosiMain" || candidateName.startsWith("Losi")) {
    return {
      componentName: candidateName,
      variantType: candidateName === "LosiMain" ? "main" : null
    };
  }

  return null;
}

function buildPrimaryNaming({ relFromRepo, pathParts, rawName, style, stylePrefix, usedNames }) {
  const losiNaming = detectLosiName(rawName);
  if (losiNaming) {
    return {
      componentName: makeUniqueVariantName(losiNaming.componentName, usedNames),
      canonicalName: losiNaming.componentName,
      baseName: losiNaming.componentName.replace(/^Losi/, "") || "Losi",
      family: "Losi",
      style: losiNaming.variantType,
      stylePrefix: null,
      tokens: getNameTokens(rawName, { stripStylePrefix: true }),
      isLosiVariant: true,
      losiVariantType: losiNaming.variantType
    };
  }

  const isVuesax = pathParts.length >= 4 && pathParts[0] === "assets" && pathParts[1] === "svg" && pathParts[2] === "vuesax" && style;
  const sourceFamily = isVuesax ? "Vuesax" : "Marshmallow";
  const tokens = getNameTokens(rawName, { stripStylePrefix: !isVuesax });
  const baseName = toIconBaseName(tokens);
  const styleName = styleLabel(stylePrefix, style);
  const candidate = styleName
    ? `Icon${baseName}${styleName}`
    : `Icon${baseName}`;
  const componentName = makeUniqueVariantName(candidate, usedNames);

  return {
    componentName,
    canonicalName: componentName,
    baseName,
    family: sourceFamily,
    style: style || null,
    stylePrefix: stylePrefix || null,
    tokens,
    isLosiVariant: false,
    losiVariantType: null
  };
}

function buildLegacyNaming({
  rawName,
  pathParts,
  style,
  usedComponentNames,
  usedCanonicalNames,
  normalizedNames
}) {
  let legacyName = toPascalCase(rawName);
  const losiNaming = detectLosiName(rawName);
  if (losiNaming) {
    legacyName = losiNaming.componentName;
  }

  const normalizedKey = legacyName.toLowerCase();
  if (normalizedNames.has(normalizedKey)) {
    const existingName = normalizedNames.get(normalizedKey);
    if (existingName !== legacyName) {
      legacyName = existingName;
    }
  } else {
    normalizedNames.set(normalizedKey, legacyName);
  }

  legacyName = makeUniqueName(legacyName, usedComponentNames);

  let legacyCanonicalName = legacyName;
  if (pathParts.length >= 4 && pathParts[0] === "assets" && pathParts[1] === "svg" && pathParts[2] === "vuesax" && style) {
    const canonicalBase = toPascalCase(pathParts.slice(4).join("-"));
    legacyCanonicalName = makeUniqueName(`${toPascalCase(style)}${canonicalBase}`, usedCanonicalNames);
  } else {
    legacyCanonicalName = makeUniqueName(legacyName, usedCanonicalNames);
  }

  return {
    legacyName,
    legacyCanonicalName
  };
}

function addAlias(aliasMap, aliasName, targetComponentName) {
  if (!aliasName || aliasName === targetComponentName || aliasMap.has(aliasName)) return;
  aliasMap.set(aliasName, targetComponentName);
}

function stripSvgSizeAttrs(svgAttrs) {
  return svgAttrs
    .replace(/\bwidth="[^"]*"\s*/gi, "")
    .replace(/\bheight="[^"]*"\s*/gi, "")
    .trim();
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
      processedContent = processedContent.replace(new RegExp(`fill="${color}"`, 'g'), `fill={colors?.[${index}] || "${color}"}`);
      processedContent = processedContent.replace(new RegExp(`stroke="${color}"`, 'g'), `stroke={colors?.[${index}] || "${color}"}`);
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

function normalizeMatchKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scoreIconCandidate(item, filled) {
  const outlinePriority = ["linear", "outline", "broken", "twotone", "bulk", "bold", "fade"];
  const filledPriority = ["bold", "bulk", "twotone", "fade", "broken", "linear", "outline"];
  const stylePriority = filled ? filledPriority : outlinePriority;
  const styleIndex = stylePriority.indexOf(item.style);
  const styleScore = styleIndex === -1 ? 0 : 100 - styleIndex;
  const cleanNameScore = /Alt\d*$/.test(item.componentName) || item.componentName.endsWith("Alt") ? 0 : 10;
  const familyScore = item.family === "Marshmallow" ? 2 : item.family === "Vuesax" ? 1 : 0;
  return styleScore + cleanNameScore + familyScore;
}

function findBestTablerTarget(itemsByBaseKey, tablerExportName) {
  let tablerBaseName = tablerExportName.replace(/^Icon/, "");
  let filled = false;

  if (tablerBaseName.endsWith("Filled")) {
    filled = true;
    tablerBaseName = tablerBaseName.slice(0, -"Filled".length);
  }

  const matchKeys = [
    tablerBaseName,
    tablerBaseName.replace(/^Brand/, ""),
    tablerBaseName.replace(/^Brands/, "")
  ].map(normalizeMatchKey).filter(Boolean);

  for (const key of matchKeys) {
    const candidates = (itemsByBaseKey.get(key) || [])
      .filter((item) => item.family !== "Losi" && !item.componentName.startsWith("Losi"));
    if (candidates.length > 0) {
      return candidates
        .slice()
        .sort((a, b) => scoreIconCandidate(b, filled) - scoreIconCandidate(a, filled) || a.componentName.localeCompare(b.componentName))[0];
    }
  }

  return null;
}

async function getInstalledTablerInfo() {
  try {
    const tabler = await import("@tabler/icons-react");
    let version = null;
    try {
      const entryPath = require.resolve("@tabler/icons-react");
      let dir = path.dirname(entryPath);
      while (dir && dir !== path.dirname(dir)) {
        const packageJsonPath = path.join(dir, "package.json");
        if (fsSync.existsSync(packageJsonPath)) {
          const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
          if (pkg.name === "@tabler/icons-react") {
            version = pkg.version || null;
            break;
          }
        }
        dir = path.dirname(dir);
      }
    } catch {
      version = null;
    }

    return {
      packageName: "@tabler/icons-react",
      version,
      iconNames: Object.keys(tabler).filter((name) => /^Icon[A-Z0-9]/.test(name)).sort()
    };
  } catch {
    return {
      packageName: "@tabler/icons-react",
      version: null,
      iconNames: []
    };
  }
}

async function buildTablerCompatibility(items) {
  const tablerInfo = await getInstalledTablerInfo();
  const itemsByBaseKey = new Map();

  for (const item of items) {
    const key = normalizeMatchKey(item.baseName);
    if (!key) continue;
    const bucket = itemsByBaseKey.get(key) || [];
    bucket.push(item);
    itemsByBaseKey.set(key, bucket);
  }

  const aliases = [];
  const missing = [];

  for (const tablerExportName of tablerInfo.iconNames) {
    const target = findBestTablerTarget(itemsByBaseKey, tablerExportName);
    if (target) {
      aliases.push({
        tablerExportName,
        targetComponentName: target.componentName,
        targetIconId: target.id,
        targetBaseName: target.baseName,
        targetFamily: target.family,
        targetStyle: target.style
      });
    } else {
      missing.push(tablerExportName);
    }
  }

  return {
    ...tablerInfo,
    aliases,
    missing
  };
}

async function main() {
  const svgFiles = [];
  await walk(assetsRoot, svgFiles);
  console.log(`Found ${svgFiles.length} SVG files`);

  await fs.mkdir(outDir, { recursive: true });

  // Clear previous generated files
  const existing = await fs.readdir(outDir).catch(() => []);
  await Promise.all(
    existing.map((f) => fs.rm(path.join(outDir, f), { force: true }))
  );

  const usedComponentNames = new Set();
  const usedLegacyComponentNames = new Set();
  const usedLegacyCanonicalNames = new Set();
  const normalizedLegacyNames = new Map(); // lowercase name -> canonical name
  const items = [];

  for (const svgAbsPath of svgFiles.sort()) {
    const relFromRepo = posixify(path.join("assets", "svg", path.relative(assetsRoot, svgAbsPath)));
    const pathParts = relFromRepo.split("/").filter(Boolean);
    const base = path.basename(svgAbsPath);
    const rawName = base.replace(/\.svg$/i, "");
    const { style, stylePrefix } = getStyleInfo(relFromRepo, rawName);

    const naming = buildPrimaryNaming({
      relFromRepo,
      pathParts,
      rawName,
      style,
      stylePrefix,
      usedNames: usedComponentNames
    });
    const legacyNaming = buildLegacyNaming({
      rawName,
      pathParts,
      style,
      usedComponentNames: usedLegacyComponentNames,
      usedCanonicalNames: usedLegacyCanonicalNames,
      normalizedNames: normalizedLegacyNames
    });
    const componentName = naming.componentName;
    const canonicalName = naming.canonicalName;
    const isLosiVariant = naming.isLosiVariant;
    const losiVariantType = naming.losiVariantType;
    const publicStyleName = styleLabel(naming.stylePrefix, naming.style);
    const sourceAwareName = !isLosiVariant
      ? publicStyleName
        ? `${naming.family}${publicStyleName}${naming.baseName}`
        : `${naming.family}${naming.baseName}`
      : null;
    const styleFirstName = !isLosiVariant && publicStyleName ? `${publicStyleName}${naming.baseName}` : null;
    const legacyNames = Array.from(new Set([
      legacyNaming.legacyName,
      legacyNaming.legacyCanonicalName,
      normalizeLegacyName(legacyNaming.legacyName),
      normalizeLegacyName(legacyNaming.legacyCanonicalName),
      sourceAwareName,
      styleFirstName
    ].filter((name) => name && name !== componentName && name !== canonicalName)));

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
      svgContent = toReactSvgAttributes(processedContent);
      
      // Build props interface
      let propsInterface = "SVGProps<SVGSVGElement> & { size?: string | number }";
      let propsDestructure = "{ size = 24, ...props }";
      if (colorInfo) {
        if (colorInfo.type === 'single') {
          propsInterface = `SVGProps<SVGSVGElement> & { size?: string | number; ${colorInfo.prop}?: string }`;
          propsDestructure = `{ size = 24, ${colorInfo.prop}, ...props }`;
        } else if (colorInfo.type === 'duotone') {
          propsInterface = `SVGProps<SVGSVGElement> & { size?: string | number; ${colorInfo.props[0]}?: string; ${colorInfo.props[1]}?: string }`;
          propsDestructure = `{ size = 24, ${colorInfo.props[0]}, ${colorInfo.props[1]}, ...props }`;
        } else if (colorInfo.type === 'multi') {
          propsInterface = `SVGProps<SVGSVGElement> & { size?: string | number; ${colorInfo.prop}?: string[] }`;
          propsDestructure = `{ size = 24, ${colorInfo.prop}, ...props }`;
        }
      }
      
      const tsx = `import * as React from "react";
import { SVGProps } from "react";

const ${componentName} = (${propsDestructure}: ${propsInterface}) => (
  <svg width={props.width ?? size} height={props.height ?? size} {...props}>
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
        canonicalName,
        filePath: relFromRepo,
        family: naming.family,
        style: naming.style,
        baseName: naming.baseName,
        legacyNames,
        category: componentName.startsWith("Losi")
          ? componentName.startsWith("LosiAssistant")
            ? "Losi - Assistant"
            : "Losi"
          : "Other",
        tags: componentName.startsWith("Losi") ? ["losi"] : Array.from(new Set([naming.family?.toLowerCase(), naming.style, ...naming.tokens].filter(Boolean))),
        name: toDisplayNameFromTokens(naming.tokens) || componentName.toLowerCase(),
        colorInfo: colorInfo || null
      });
      continue;
    }
    
    let svgAttrs = svgMatch[1].trim();
    let svgContent = svgMatch[2].trim();

    // Convert xlink attributes to React-compatible camelCase
    svgAttrs = stripSvgSizeAttrs(toReactSvgAttributes(svgAttrs));
    
    // Process colors to make them customizable
    const { processedContent, colorInfo } = processSvgColors(svgContent, isLosiVariant, losiVariantType);
    svgContent = processedContent;

    // Convert SVG attributes in content to React-compatible camelCase.
    svgContent = toReactSvgAttributes(svgContent);
    
    // Build props interface
    let propsInterface = "SVGProps<SVGSVGElement> & { size?: string | number }";
    let propsDestructure = "{ size = 24, ...props }";
    if (colorInfo) {
      if (colorInfo.type === 'single') {
        propsInterface = `SVGProps<SVGSVGElement> & { size?: string | number; ${colorInfo.prop}?: string }`;
        propsDestructure = `{ size = 24, ${colorInfo.prop}, ...props }`;
      } else if (colorInfo.type === 'duotone') {
        propsInterface = `SVGProps<SVGSVGElement> & { size?: string | number; ${colorInfo.props[0]}?: string; ${colorInfo.props[1]}?: string }`;
        propsDestructure = `{ size = 24, ${colorInfo.props[0]}, ${colorInfo.props[1]}, ...props }`;
      } else if (colorInfo.type === 'multi') {
        propsInterface = `SVGProps<SVGSVGElement> & { size?: string | number; ${colorInfo.prop}?: string[] }`;
        propsDestructure = `{ size = 24, ${colorInfo.prop}, ...props }`;
      }
    }
    
    // Create React component
    const tsx = `import * as React from "react";
import { SVGProps } from "react";

const ${componentName} = (${propsDestructure}: ${propsInterface}) => (
  <svg ${svgAttrs} width={props.width ?? size} height={props.height ?? size} {...props}>
${svgContent.split('\n').map(line => `    ${line}`).join('\n')}
  </svg>
);

export default ${componentName};
`;

    const outFile = path.join(outDir, `${componentName}.tsx`);
    await fs.writeFile(outFile, tsx, "utf8");

    const semanticName = toDisplayNameFromTokens(naming.tokens) || componentName.toLowerCase();
    const category = isLosiVariant
      ? componentName.startsWith("LosiAssistant")
        ? "Losi - Assistant"
        : "Losi"
      : naming.family && naming.style
        ? `${naming.family} - ${styleLabel(naming.stylePrefix, naming.style)}`
        : naming.family || "Other";
    const tags = isLosiVariant
      ? ["losi", naming.style].filter(Boolean)
      : [naming.family?.toLowerCase(), naming.style, naming.stylePrefix, ...naming.tokens]
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index);

    items.push({
      id: relFromRepo.replace(/\.svg$/i, ""),
      componentName,
      canonicalName,
      filePath: relFromRepo,
      family: naming.family,
      style: naming.style,
      baseName: naming.baseName,
      legacyNames,
      category,
      tags,
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
  exportLines.push('import * as React from "react";');
  exportLines.push('import type { ComponentType, SVGProps } from "react";');
  exportLines.push("");

  // Get unique component names
  const uniqueComponents = new Set(items.map(it => it.componentName));
  const aliasMap = new Map();
  const findComponent = (...names) => names.find((name) => uniqueComponents.has(name));
  const findPreferredComponent = (baseNames, stylePreferences = ["linear", "outline", "broken", "twotone", "bulk", "bold", "fade"]) => {
    const names = Array.isArray(baseNames) ? baseNames : [baseNames];
    const candidates = items.filter((it) => names.includes(it.baseName));
    const rank = (item) => {
      const styleIndex = stylePreferences.indexOf(item.style);
      const styleScore = styleIndex === -1 ? 0 : 100 - styleIndex;
      const cleanNameScore = /Alt\d*$/.test(item.componentName) || item.componentName.endsWith("Alt") ? 0 : 10;
      const familyScore = item.family === "Marshmallow" ? 2 : item.family === "Vuesax" ? 1 : 0;
      return styleScore + cleanNameScore + familyScore;
    };
    for (const styleName of stylePreferences) {
      const exact = candidates
        .filter((it) => it.style === styleName)
        .sort((a, b) => rank(b) - rank(a) || a.componentName.localeCompare(b.componentName))[0];
      if (exact) return exact.componentName;
    }
    return candidates
      .slice()
      .sort((a, b) => rank(b) - rank(a) || a.componentName.localeCompare(b.componentName))[0]?.componentName;
  };

  for (const it of items) {
    addAlias(aliasMap, it.componentName, it.componentName);
    addAlias(aliasMap, normalizeLegacyName(it.componentName), it.componentName);
    addAlias(aliasMap, normalizeLegacyName(it.canonicalName), it.componentName);
    for (const legacyName of it.legacyNames || []) {
      addAlias(aliasMap, legacyName, it.componentName);
      addAlias(aliasMap, normalizeLegacyName(legacyName), it.componentName);
    }
    if (it.family === "Vuesax" && it.style) {
      addAlias(aliasMap, `${styleLabel(it.style, it.style)}${it.baseName}`, it.componentName);
    }
  }

  const defaultIconAliases = Array.from(new Set(items
    .filter((it) => it.family !== "Losi" && !it.componentName.startsWith("Losi"))
    .map((it) => it.baseName)))
    .sort()
    .map((baseName) => ({
      aliasName: `Icon${baseName}`,
      targetComponentName: findPreferredComponent(baseName)
    }))
    .filter((alias) => alias.targetComponentName);

  for (const alias of defaultIconAliases) {
    if (!usedComponentNames.has(alias.aliasName)) {
      addAlias(aliasMap, alias.aliasName, alias.targetComponentName);
    }
  }

  addAlias(aliasMap, "Loading", findPreferredComponent(["Refresh", "Refresh2"]) || findComponent("Refresh2", "Refresh", "LinearRefresh") || "Refresh");
  addAlias(aliasMap, "Balance", findPreferredComponent(["Judge"]) || findComponent("Judge", "Judge2", "LinearJudge") || "Judge");
  addAlias(aliasMap, "Wrench", findPreferredComponent(["DesignTools"]) || findComponent("Designtools", "DesignTools", "Designtools3") || "Designtools");
  for (const [aliasName, targetComponentName] of COMPATIBILITY_NAME_ALIASES) {
    addAlias(aliasMap, aliasName, targetComponentName);
  }
  const tablerCompatibility = await buildTablerCompatibility(items);
  
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

  const canonicalAliases = items
    .filter((it) => it.canonicalName && it.canonicalName !== it.componentName)
    .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  const exportedNames = new Set(uniqueComponents);

  if (canonicalAliases.length > 0) {
    exportLines.push("");
    exportLines.push("// Canonical style-prefixed aliases. Legacy component exports above remain stable.");
    for (const it of canonicalAliases) {
      if (exportedNames.has(it.canonicalName)) continue;
      exportedNames.add(it.canonicalName);
      exportLines.push(
        `export { default as ${it.canonicalName} } from "./${it.componentName}";`
      );
    }
  }

  exportLines.push("");
  exportLines.push(
    "export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;"
  );
  exportLines.push("export type IconProps = SVGProps<SVGSVGElement> & { size?: string | number; stroke?: string; title?: string };");
  exportLines.push("export type TablerIconProps = IconProps;");
  exportLines.push("export type TablerIcon = ComponentType<TablerIconProps>;");
  exportLines.push("const createIcon = (displayName: string, Component: IconComponent): TablerIcon => {");
  exportLines.push("  const PublicIcon = ({ size = 24, color, stroke, title, width, height, role, ...props }: TablerIconProps) => {");
  exportLines.push('    const ariaLabel = props["aria-label"] ?? title;');
  exportLines.push("    return React.createElement(Component, {");
  exportLines.push("      ...props,");
  exportLines.push("      width: width ?? size,");
  exportLines.push("      height: height ?? size,");
  exportLines.push('      color: color ?? stroke ?? "currentColor",');
  exportLines.push("      stroke: stroke ?? color,");
  exportLines.push('      role: role ?? (ariaLabel ? "img" : undefined),');
  exportLines.push('      "aria-label": ariaLabel');
  exportLines.push("    });");
  exportLines.push("  };");
  exportLines.push("  PublicIcon.displayName = displayName;");
  exportLines.push("  return PublicIcon;");
  exportLines.push("};");
  exportLines.push("");

  const defaultIconAliasExports = defaultIconAliases
    .filter((alias) => uniqueComponents.has(alias.targetComponentName) && !exportedNames.has(alias.aliasName))
    .sort((a, b) => a.aliasName.localeCompare(b.aliasName));

  if (defaultIconAliasExports.length > 0) {
    exportLines.push("// Default semantic aliases. These are the preferred imports for app code.");
    for (const alias of defaultIconAliasExports) {
      exportedNames.add(alias.aliasName);
      exportLines.push(`export const ${alias.aliasName} = createIcon("${alias.aliasName}", ${alias.targetComponentName});`);
    }
    exportLines.push("");
  }

  const tablerAliasExports = tablerCompatibility.aliases
    .filter((alias) => uniqueComponents.has(alias.targetComponentName) && !exportedNames.has(alias.tablerExportName))
    .sort((a, b) => a.tablerExportName.localeCompare(b.tablerExportName));

  if (tablerAliasExports.length > 0) {
    exportLines.push("// Tabler-compatible wrappers. These support common Tabler props such as size, color, stroke, and title.");
    for (const alias of tablerAliasExports) {
      exportedNames.add(alias.tablerExportName);
      exportLines.push(`export const ${alias.tablerExportName} = createIcon("${alias.tablerExportName}", ${alias.targetComponentName});`);
    }
    exportLines.push("");
    exportLines.push("export const tablerIconAliases = {");
    for (const alias of tablerCompatibility.aliases.sort((a, b) => a.tablerExportName.localeCompare(b.tablerExportName))) {
      exportLines.push(`  "${alias.tablerExportName}": "${alias.targetComponentName}",`);
    }
    exportLines.push("} as const;");
    exportLines.push("");
    exportLines.push("export type TablerIconAlias = keyof typeof tablerIconAliases;");
    exportLines.push("");
    exportLines.push("export const tablerIconsByName: Record<string, TablerIcon> = {");
    for (const alias of tablerCompatibility.aliases
      .filter((item) => exportedNames.has(item.tablerExportName))
      .sort((a, b) => a.tablerExportName.localeCompare(b.tablerExportName))) {
      exportLines.push(`  "${alias.tablerExportName}": ${alias.tablerExportName},`);
    }
    exportLines.push("};");
  }

  const allAliases = Array.from(aliasMap.entries())
    .filter(([aliasName, targetComponentName]) => !uniqueComponents.has(aliasName) && uniqueComponents.has(targetComponentName))
    .sort(([a], [b]) => a.localeCompare(b));

  const compatibilityAliases = allAliases
    .filter(([aliasName]) => !exportedNames.has(aliasName))
    .sort(([a], [b]) => a.localeCompare(b));

  if (compatibilityAliases.length > 0) {
    exportLines.push("");
    exportLines.push("// Compatibility aliases for corrected spelling and app-facing names.");
    for (const [aliasName, targetComponentName] of compatibilityAliases) {
      exportedNames.add(aliasName);
      exportLines.push(
        `export { default as ${aliasName} } from "./${targetComponentName}";`
      );
    }
  }

  exportLines.push("");
  exportLines.push("export const icons = {");
  for (const it of items) {
    exportLines.push(`  "${it.id}": ${it.componentName},`);
  }
  exportLines.push("} as const;");
  exportLines.push("");
  exportLines.push("export type IconName = keyof typeof icons;");
  exportLines.push("");
  exportLines.push('export type IconColorInfo =');
  exportLines.push('  | { type: "single"; prop: "color"; originalColors: readonly string[] }');
  exportLines.push('  | { type: "duotone"; props: readonly string[]; originalColors: readonly string[] }');
  exportLines.push('  | { type: "multi"; prop: "colors"; originalColors: readonly string[] }');
  exportLines.push('  | null;');
  exportLines.push("");
  exportLines.push("export type IconMeta = {");
  exportLines.push("  id: string;");
  exportLines.push("  componentName: string;");
  exportLines.push("  canonicalName: string;");
  exportLines.push("  filePath: string;");
  exportLines.push("  family: string;");
  exportLines.push("  style: string | null;");
  exportLines.push("  baseName: string;");
  exportLines.push("  legacyNames: readonly string[];");
  exportLines.push("  category: string;");
  exportLines.push("  tags: readonly string[];");
  exportLines.push("  name: string;");
  exportLines.push("  colorInfo: IconColorInfo;");
  exportLines.push("};");
  exportLines.push("");

  exportLines.push("export const iconAliases: Record<string, IconName> = {");
  for (const it of items) {
    exportLines.push(`  "${it.canonicalName}": "${it.id}",`);
    if (it.componentName !== it.canonicalName) {
      exportLines.push(`  "${it.componentName}": "${it.id}",`);
    }
  }
  for (const [aliasName, targetComponentName] of allAliases) {
    const target = items.find((it) => it.componentName === targetComponentName);
    if (target) {
      exportLines.push(`  "${aliasName}": "${target.id}",`);
    }
  }
  exportLines.push("};");
  exportLines.push("");
  exportLines.push("export type IconAlias = keyof typeof iconAliases;");
  exportLines.push("");
  exportLines.push("export const iconsByName: Record<string, IconComponent> = {");
  for (const it of items) {
    exportLines.push(`  "${it.canonicalName}": ${it.componentName},`);
    if (it.componentName !== it.canonicalName) {
      exportLines.push(`  "${it.componentName}": ${it.componentName},`);
    }
  }
  for (const [aliasName, targetComponentName] of allAliases) {
    exportLines.push(`  "${aliasName}": ${targetComponentName},`);
  }
  exportLines.push("};");
  exportLines.push("");
  exportLines.push("export type IconComponentName = keyof typeof iconsByName;");
  exportLines.push("");

  exportLines.push("export const iconsMeta: readonly IconMeta[] = [");
  for (const it of items) {
    const tagsStr = JSON.stringify(it.tags || []);
    const legacyNamesStr = JSON.stringify(it.legacyNames || []);
    const colorInfoStr = it.colorInfo ? JSON.stringify(it.colorInfo) : "null";
    exportLines.push(
      `  { id: "${it.id}", componentName: "${it.componentName}", canonicalName: "${it.canonicalName}", filePath: "${it.filePath}", family: "${it.family || "Marshmallow"}", style: ${it.style ? `"${it.style}"` : "null"}, baseName: "${it.baseName || it.componentName}", legacyNames: ${legacyNamesStr}, category: "${it.category || "default"}", tags: ${tagsStr}, name: "${it.name || toDisplayName(it.canonicalName)}", colorInfo: ${colorInfoStr} },`
    );
  }
  exportLines.push("];");
  exportLines.push("");

  await fs.writeFile(indexFile, exportLines.join("\n"), "utf8");

  console.log(`Generated ${items.length} icon components.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
