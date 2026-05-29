import fs from "node:fs/promises";
import * as icons from "../dist/index.js";

async function getTablerNames() {
  try {
    const tabler = await import("@tabler/icons-react");
    return Object.keys(tabler).filter((name) => /^Icon[A-Z0-9]/.test(name)).sort();
  } catch {
    return [];
  }
}

const iconsMeta = icons.iconsMeta || [];
const tablerNames = await getTablerNames();
const tablerAliases = icons.tablerIconAliases || {};
const matchedTablerNames = Object.keys(tablerAliases).sort();
const missingTablerNames = tablerNames.filter((name) => !tablerAliases[name]);
const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

const EXPLICIT_EXPORT_RENAMES = {
  BoldsBattery: "IconBarbellBold",
  FadeBattery: "IconBarbellFade",
  LinearBattery: "IconBarbellLinear",
  TwotoneAltBattery: "IconBarbellTwotoneAlt",
  TwotoneBattery: "IconDislikeTwotone",
  TwotoneBookmark: "IconTrashTwotone",
  TwotoneChart: "IconScissorTwotone",
  TwotoneContrast: "IconPenToolTwotone",
  TwotoneDislike: "IconContrastTwotone",
  TwotoneDocumentBlank: "IconLocationTwotone",
  TwotoneDocumentText: "IconBookmarkTwotone",
  TwotoneDocument: "IconBarbellTwotone",
  TwotoneEdit: "IconSendTwotone",
  TwotoneGallery: "IconLockTwotone",
  TwotoneHome: "IconChartTwotone",
  TwotoneKey: "IconDocumentTwotone",
  TwotoneLocation: "IconHomeTwotone",
  TwotoneLock: "IconEditTwotone",
  TwotoneMicrophone: "IconDocumentBlankTwotone",
  TwotoneSearch: "IconPaintBucketTwotone",
  TwotoneSparkle: "IconMicrophoneTwotone",
  TwotoneStar: "IconColorSwatchTwotone",
  TwotoneTrash: "IconSearchTwotone",
  TwotoneUnlock: "IconDocumentTextTwotone",
  AlignBottom: "IconAlignTopBold",
  AlignBottom2: "IconAlignTopLinear",
  Check: "IconSplitPanelBold",
  Check2: "IconSplitPanelLinear",
  Devices1: "IconBrightnessMeterBold",
  Devices12: "IconBrightnessMeterLinear",
  Eye1: "IconEyeSparkleBold",
  Eye2: "IconEyeSparkleAltBold",
  Eye12: "IconEyeSparkleLinear",
  Eye22: "IconEyeSparkleAltLinear",
  Frame: "IconUserAltBold",
  Frame1: "IconBubbleCircleBold",
  Frame2: "IconElement2AltBold",
  Frame3: "IconImportCircleLinear",
  Frame4: "IconAlignBottomBold",
  Frame5: "IconChartBarLinear",
  Frame6: "IconLinkSquareAltLinear",
  Frame7: "IconMedalAltLinear",
  Frame12: "IconAwardCircleBulk",
  Frame13: "IconArrowSwapVerticalLinear",
  Frame22: "IconInterlockingCubesBulk",
  Frame23: "IconChevronCircleUpLinear",
  Frame32: "IconPlanetSlashBulk",
  Frame33: "IconMessageCloseLinear",
  Frame42: "IconCrownCircleBulk",
  Frame43: "IconBookmarkAltLinear",
  Group1: "IconConvertCardLinear",
  Group2: "IconPercentageCircleLinear",
  Group3: "IconPaintRollerLinear",
  Group4: "IconTruckFastLinear",
  Group5: "IconTruckLinear",
  Group6: "IconProhibitedLinear",
  Group7: "IconCloseOctagonLinear",
  Group8: "IconHomePentagonLinear",
  Group9: "IconShuffleLinear",
  Icon: "IconScanFrameBold",
  Icon1: "IconAwardRibbonCircleBold",
  Icon2: "IconFilledCircleBroken",
  Icon3: "IconScanFrameOutline",
  Icon4: "IconFilledRoundedSquareTwotone",
  Icon12: "IconAwardRibbonCircleOutline",
  Icon13: "IconFilledCircleTwotone",
  Icon3full: "IconBattery3FullBold",
  Icon3full2: "IconBattery3FullLinear",
  IconSymbols1: "IconMarshmallowSymbolsSpec",
  MarshmallowLogo: "IconMarshmallowShadow",
  IconGoogle1Bold: "IconGoogleDriveBold",
  IconGoogle1Bulk: "IconGoogleDriveBulk",
  IconGoogle1Linear: "IconGoogleDriveLinear",
  IconGoogle1Twotone: "IconGoogleDriveTwotone",
  IconGooglePalyOutline: "IconGooglePlayOutline",
  IconGooglePaly: "IconGooglePlay",
  Google1: "IconGoogleDriveBold",
  Google12: "IconGoogleDriveBulk",
  Google13: "IconGoogleDriveLinear",
  Google14: "IconGoogleDriveTwotone",
  GooglePaly: "IconGooglePlayOutline",
  OutlineGooglePaly: "IconGooglePlayOutline",
  VuesaxOutlineGooglePaly: "IconGooglePlayOutline",
  VuesaxBoldGoogle1: "IconGoogleDriveBold",
  VuesaxBulkGoogle1: "IconGoogleDriveBulk",
  VuesaxLinearGoogle1: "IconGoogleDriveLinear",
  VuesaxTwotoneGoogle1: "IconGoogleDriveTwotone"
};

const RENAMED_ICON_IDS = {
  "assets/svg/bolds-battery": "assets/svg/bolds-barbell",
  "assets/svg/fade-battery": "assets/svg/fade-barbell",
  "assets/svg/linear-battery": "assets/svg/linear-barbell",
  "assets/svg/twotone-alt-battery": "assets/svg/twotone-alt-barbell",
  "assets/svg/twotone-battery": "assets/svg/twotone-dislike",
  "assets/svg/twotone-bookmark": "assets/svg/twotone-trash",
  "assets/svg/twotone-chart": "assets/svg/twotone-scissor",
  "assets/svg/twotone-contrast": "assets/svg/twotone-pen-tool",
  "assets/svg/twotone-dislike": "assets/svg/twotone-contrast",
  "assets/svg/twotone-document-blank": "assets/svg/twotone-location",
  "assets/svg/twotone-document-text": "assets/svg/twotone-bookmark",
  "assets/svg/twotone-document": "assets/svg/twotone-barbell",
  "assets/svg/twotone-edit": "assets/svg/twotone-send",
  "assets/svg/twotone-gallery": "assets/svg/twotone-lock",
  "assets/svg/twotone-home": "assets/svg/twotone-chart",
  "assets/svg/twotone-key": "assets/svg/twotone-document",
  "assets/svg/twotone-location": "assets/svg/twotone-home",
  "assets/svg/twotone-lock": "assets/svg/twotone-edit",
  "assets/svg/twotone-microphone": "assets/svg/twotone-document-blank",
  "assets/svg/twotone-search": "assets/svg/twotone-paint-bucket",
  "assets/svg/twotone-sparkle": "assets/svg/twotone-microphone",
  "assets/svg/twotone-star": "assets/svg/twotone-color-swatch",
  "assets/svg/twotone-trash": "assets/svg/twotone-search",
  "assets/svg/twotone-unlock": "assets/svg/twotone-document-text",
  "assets/svg/vuesax/bold/google-1": "assets/svg/vuesax/bold/google-drive",
  "assets/svg/vuesax/bulk/google-1": "assets/svg/vuesax/bulk/google-drive",
  "assets/svg/vuesax/linear/google-1": "assets/svg/vuesax/linear/google-drive",
  "assets/svg/vuesax/twotone/google-1": "assets/svg/vuesax/twotone/google-drive",
  "assets/svg/vuesax/outline/google-paly": "assets/svg/vuesax/outline/google-play",
  "assets/svg/vuesax/bold/align-bottom": "assets/svg/vuesax/bold/align-top",
  "assets/svg/vuesax/linear/align-bottom": "assets/svg/vuesax/linear/align-top",
  "assets/svg/vuesax/bold/frame-4": "assets/svg/vuesax/bold/align-bottom",
  "assets/svg/vuesax/bold/check": "assets/svg/vuesax/bold/split-panel",
  "assets/svg/vuesax/linear/check": "assets/svg/vuesax/linear/split-panel",
  "assets/svg/vuesax/bold/eye-1": "assets/svg/vuesax/bold/eye-sparkle",
  "assets/svg/vuesax/bold/eye-2": "assets/svg/vuesax/bold/eye-sparkle-alt",
  "assets/svg/vuesax/linear/eye-1": "assets/svg/vuesax/linear/eye-sparkle",
  "assets/svg/vuesax/linear/eye-2": "assets/svg/vuesax/linear/eye-sparkle-alt",
  "assets/svg/vuesax/bold/play-cricle": "assets/svg/vuesax/bold/play-circle-dashed",
  "assets/svg/vuesax/linear/play-cricle": "assets/svg/vuesax/linear/play-circle-dashed",
  "assets/svg/vuesax/bold/battery-2/3full": "assets/svg/vuesax/bold/battery-3-full",
  "assets/svg/vuesax/linear/battery-2/3full": "assets/svg/vuesax/linear/battery-3-full",
  "assets/svg/vuesax/bold/devices-1": "assets/svg/vuesax/bold/brightness-meter",
  "assets/svg/vuesax/linear/devices-1": "assets/svg/vuesax/linear/brightness-meter",
  "assets/svg/vuesax/linear/frame-1": "assets/svg/vuesax/linear/arrow-swap-vertical",
  "assets/svg/vuesax/linear/frame-2": "assets/svg/vuesax/linear/chevron-circle-up",
  "assets/svg/vuesax/linear/frame-3": "assets/svg/vuesax/linear/message-close",
  "assets/svg/vuesax/linear/frame-4": "assets/svg/vuesax/linear/bookmark-alt",
  "assets/svg/vuesax/linear/frame-5": "assets/svg/vuesax/linear/chart-bar",
  "assets/svg/vuesax/linear/frame-6": "assets/svg/vuesax/linear/link-square-alt",
  "assets/svg/vuesax/linear/frame-7": "assets/svg/vuesax/linear/medal-alt",
  "assets/svg/vuesax/linear/frame": "assets/svg/vuesax/linear/import-circle",
  "assets/svg/vuesax/linear/group-1": "assets/svg/vuesax/linear/convert-card",
  "assets/svg/vuesax/linear/group-2": "assets/svg/vuesax/linear/bucket",
  "assets/svg/vuesax/linear/group-3": "assets/svg/vuesax/linear/paint-roller",
  "assets/svg/vuesax/linear/group-4": "assets/svg/vuesax/linear/truck-fast",
  "assets/svg/vuesax/linear/group-5": "assets/svg/vuesax/linear/truck",
  "assets/svg/vuesax/linear/group-6": "assets/svg/vuesax/linear/prohibited",
  "assets/svg/vuesax/linear/group-7": "assets/svg/vuesax/linear/close-octagon",
  "assets/svg/vuesax/linear/group-8": "assets/svg/vuesax/linear/home-pentagon",
  "assets/svg/vuesax/linear/group-9": "assets/svg/vuesax/linear/shuffle",
  "assets/svg/vuesax/linear/group": "assets/svg/vuesax/linear/percentage-circle",
  "assets/svg/vuesax/bold/frame-1": "assets/svg/vuesax/bold/bubble-circle",
  "assets/svg/vuesax/bold/frame-2": "assets/svg/vuesax/bold/tag-right-alt",
  "assets/svg/vuesax/bold/frame-3": "assets/svg/vuesax/bold/element-2-alt",
  "assets/svg/vuesax/bold/frame": "assets/svg/vuesax/bold/user-alt",
  "assets/svg/vuesax/bulk/frame-1": "assets/svg/vuesax/bulk/award-circle",
  "assets/svg/vuesax/bulk/frame-2": "assets/svg/vuesax/bulk/interlocking-cubes",
  "assets/svg/vuesax/bulk/frame-3": "assets/svg/vuesax/bulk/planet-slash",
  "assets/svg/vuesax/bulk/frame-4": "assets/svg/vuesax/bulk/crown-circle",
  "assets/svg/vuesax/bulk/frame": "assets/svg/vuesax/bulk/scan-frame",
  "assets/svg/vuesax/bold/icon-1": "assets/svg/vuesax/bold/award-ribbon-circle",
  "assets/svg/vuesax/outline/icon-1": "assets/svg/vuesax/outline/award-ribbon-circle",
  "assets/svg/vuesax/bold/icon": "assets/svg/vuesax/bold/scan-frame",
  "assets/svg/vuesax/outline/icon": "assets/svg/vuesax/outline/scan-frame",
  "assets/svg/vuesax/broken/icon": "assets/svg/vuesax/broken/filled-circle",
  "assets/svg/vuesax/twotone/icon-1": "assets/svg/vuesax/twotone/filled-circle",
  "assets/svg/vuesax/twotone/icon": "assets/svg/vuesax/twotone/filled-rounded-square",
  "assets/svg/icon.symbols 1": "assets/svg/marshmallow-symbols-spec",
  "assets/svg/marshmallow-logo": "assets/svg/marshmallow-shadow"
};

function isIdentifier(value) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function addImportRename(map, from, to) {
  if (!isIdentifier(from) || !isIdentifier(to) || from === to) return;
  map[from] = to;
}

function buildMigrationMap() {
  const importRenames = {};

  for (const item of iconsMeta) {
    for (const legacyName of item.legacyNames || []) {
      addImportRename(importRenames, legacyName, item.componentName);
    }
  }

  for (const [from, to] of Object.entries(EXPLICIT_EXPORT_RENAMES)) {
    addImportRename(importRenames, from, to);
  }

  return {
    generatedAt,
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    fromVersion: "0.3.0",
    importRenames,
    idRenames: RENAMED_ICON_IDS,
    tablerCompatibleImports: matchedTablerNames
  };
}

const byFamily = {};
const byStyle = {};
const byCategory = {};

for (const item of iconsMeta) {
  byFamily[item.family] = (byFamily[item.family] || 0) + 1;
  byStyle[item.style || "none"] = (byStyle[item.style || "none"] || 0) + 1;
  byCategory[item.category] = (byCategory[item.category] || 0) + 1;
}

const generatedAt = new Date().toISOString();
const migrationMap = buildMigrationMap();

await fs.writeFile(
  "dist/icons-catalog.json",
  JSON.stringify(
    {
      generatedAt,
      total: iconsMeta.length,
      byFamily,
      byStyle,
      byCategory,
      icons: iconsMeta
    },
    null,
    2
  ) + "\n"
);

await fs.writeFile(
  "dist/tabler-compat-map.json",
  JSON.stringify(
    {
      generatedAt,
      tablerPackage: "@tabler/icons-react",
      marshmallowIcons: Object.keys(icons.icons || {}).length,
      marshmallowMetadata: iconsMeta.length,
      tablerIcons: tablerNames.length,
      directTablerCompatibleExports: matchedTablerNames.length,
      unmatchedTablerExports: missingTablerNames.length,
      aliases: tablerAliases,
      missing: missingTablerNames
    },
    null,
    2
  ) + "\n"
);

await fs.writeFile(
  "dist/migration-map.json",
  JSON.stringify(migrationMap, null, 2) + "\n"
);

const catalogLines = [
  "# Marshmallow Icons Catalog",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Total icons: ${iconsMeta.length}`,
  `Tabler-compatible named exports: ${matchedTablerNames.length}`,
  "",
  "## Families",
  "",
  ...Object.entries(byFamily).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Styles",
  "",
  ...Object.entries(byStyle).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Naming",
  "",
  "- Primary names are semantic and Tabler-style: `Icon{Name}`.",
  "- Style-specific names use `Icon{Name}{Style}`, for example `IconHomeLinear` and `IconHomeBold`.",
  "- Source collection details stay in metadata as `family`, not in the public name.",
  "- Protected Losi and assistant names remain unchanged.",
  "- Legacy names are preserved in `legacyNames`, `iconAliases`, and named exports.",
  "- Full metadata is in `dist/icons-catalog.json`.",
  ""
];

await fs.writeFile("CATALOG.md", catalogLines.join("\n"));
