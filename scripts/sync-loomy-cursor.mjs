/**
 * Copies Cursor rules and agent skills from the loomy-cursor-skills submodule
 * into paths Cursor loads: .cursor/rules/ and .cursor/skills/
 *
 * Preserves other folders under .cursor/skills/ (e.g. project-only skills).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const subRoot = path.join(root, ".cursor", "loomy-cursor-skills");

if (!fs.existsSync(subRoot)) {
  console.error(
    "Missing .cursor/loomy-cursor-skills. Run:\n  git submodule update --init --recursive",
  );
  process.exit(1);
}

const rulesSrc = path.join(subRoot, "rules", "loomy.mdc");
const rulesDestDir = path.join(root, ".cursor", "rules");
const rulesDest = path.join(rulesDestDir, "loomy.mdc");

if (!fs.existsSync(rulesSrc)) {
  console.error("Missing rules file:", rulesSrc);
  process.exit(1);
}

fs.mkdirSync(rulesDestDir, { recursive: true });
fs.copyFileSync(rulesSrc, rulesDest);

const skillsDestRoot = path.join(root, ".cursor", "skills");
fs.mkdirSync(skillsDestRoot, { recursive: true });

const entries = fs.readdirSync(subRoot, { withFileTypes: true });
for (const e of entries) {
  if (!e.isDirectory() || e.name === ".git" || e.name === "rules") continue;
  const skillDir = path.join(subRoot, e.name);
  const skillMd = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillMd)) continue;
  const dest = path.join(skillsDestRoot, e.name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(skillDir, dest, { recursive: true });
}

console.log("Synced .cursor/rules/loomy.mdc and submodule skills into .cursor/skills/");
