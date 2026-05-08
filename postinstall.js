import fs from "fs";
import os from "os";
import path from "path";

const configDir = path.join(os.homedir(), ".config", "opencode");

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

let configFile = path.join(configDir, "opencode.json");
const jsoncFile = path.join(configDir, "opencode.jsonc");

if (fs.existsSync(jsoncFile)) {
  configFile = jsoncFile;
}

const PLUGIN_NAME = "opencode-usage-viewer";

function addPluginToJson(raw) {
  const config = JSON.parse(raw);
  config.plugin ??= [];
  if (!config.plugin.includes(PLUGIN_NAME)) {
    config.plugin.push(PLUGIN_NAME);
  }
  return JSON.stringify(config, null, 2) + "\n";
}

function addPluginToJsonc(raw) {
  const pluginRe = /"plugin"\s*:\s*\[/;
  const hasPlugin = pluginRe.test(raw);

  if (!hasPlugin) {
    return raw.replace(/\{/, '{\n  "plugin": ["' + PLUGIN_NAME + '"],');
  }

  if (raw.includes(PLUGIN_NAME)) {
    return raw;
  }

  return raw.replace(pluginRe, (match) => match + '"' + PLUGIN_NAME + '", ');
}

if (!fs.existsSync(configFile)) {
  const content = JSON.stringify({ plugin: [PLUGIN_NAME] }, null, 2) + "\n";
  fs.writeFileSync(configFile, content);
  console.log("Created " + configFile + " with opencode-usage-viewer plugin");
  process.exit(0);
}

const raw = fs.readFileSync(configFile, "utf-8");
const isJsonc = configFile.endsWith(".jsonc");

try {
  const result = isJsonc ? addPluginToJsonc(raw) : addPluginToJson(raw);
  if (result !== raw) {
    fs.writeFileSync(configFile, result);
    console.log("Added opencode-usage-viewer to " + configFile);
  } else {
    console.log("opencode-usage-viewer already in " + configFile);
  }
} catch (err) {
  console.error("Failed to update config:", err.message);
  process.exit(1);
}
