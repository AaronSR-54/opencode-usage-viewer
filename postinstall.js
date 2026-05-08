import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginSrc = path.join(__dirname, "index.js");
const pluginsDir = path.join(os.homedir(), ".config", "opencode", "plugins");
const pluginDest = path.join(pluginsDir, "opencode-usage-viewer.js");

if (!fs.existsSync(pluginSrc)) {
  console.error("index.js not found");
  process.exit(1);
}

if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

fs.copyFileSync(pluginSrc, pluginDest);
console.log("Installed opencode-usage-viewer plugin to:");
console.log(pluginDest);