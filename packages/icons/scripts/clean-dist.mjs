import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, "..");
const distRoot = path.resolve(pkgRoot, "dist");

for (const fileName of ["index.js", "index.cjs"]) {
  const filePath = path.join(distRoot, fileName);
  let content = await fs.readFile(filePath, "utf8");
  const mapComment = `//# sourceMappingURL=${fileName}.map`;
  const lines = content.split("\n");
  let seen = false;
  const deduped = lines.filter((line) => {
    if (line !== mapComment) return true;
    if (seen) return false;
    seen = true;
    return true;
  });
  content = deduped.join("\n");
  await fs.writeFile(filePath, content, "utf8");
}
