import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginSrc = path.join(__dirname, "index.js");
const pluginDest = path.join(process.env.APPDATA, "opencode", "plugins", "opencode-usage-viewer.js");
const pluginsDir = path.join(process.env.APPDATA, "opencode", "plugins");

if (!fs.existsSync(pluginSrc)) {
  console.error("index.js not found");
  process.exit(1);
}

if (!fs.existsSync(pluginsDir)) {
  console.error("OpenCode plugins directory not found");
  process.exit(1);
}

fs.copyFileSync(pluginSrc, pluginDest);
console.log("Installed opencode-usage-viewer plugin to:");
console.log(pluginDest);