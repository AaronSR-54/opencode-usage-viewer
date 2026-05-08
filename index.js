import { tool } from "@opencode-ai/plugin";

const workspaceId = process.env.OPENCODE_GO_WORKSPACE_ID;
const authCookie = process.env.OPENCODE_GO_AUTH_COOKIE;

function formatTime(seconds) {
  if (!seconds || seconds <= 0) {
    return "--";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    return `${h}h ${m}m`;
  }

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);

  return `${d}d ${h}h`;
}

function buildBar(percent) {
  const width = 24;

  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  const barUsed = "█".repeat(filled);
  const barEmpty = "░".repeat(empty);

  return barUsed + barEmpty;
}

function createRow(label, percent, resetInSec) {
  return (
    label.padEnd(10) +
    " " +
    buildBar(percent) +
    " " +
    percent.toFixed(1).padStart(5) +
    "%" +
    "  " +
    "reset " +
    formatTime(resetInSec)
  );
}

function parseUsage(html) {
  function extract(section) {
    const regex = new RegExp(
      `${section}[^]*?resetInSec:(\\d+)[^]*?usagePercent:(\\d+)`,
      "i"
    );

    const match = html.match(regex);

    if (!match) {
      return null;
    }

    return {
      resetInSec: Number(match[1]),
      usagePercent: Number(match[2]),
    };
  }

  return {
    rolling: extract("rollingUsage"),
    weekly: extract("weeklyUsage"),
    monthly: extract("monthlyUsage"),
  };
}

async function fetchUsage() {
  if (!workspaceId) {
    throw new Error("Missing OPENCODE_GO_WORKSPACE_ID");
  }

  if (!authCookie) {
    throw new Error("Missing OPENCODE_GO_AUTH_COOKIE");
  }

  const response = await fetch(
    `https://opencode.ai/workspace/${encodeURIComponent(workspaceId)}/go`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
        Cookie: `auth=${authCookie}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();

  return parseUsage(html);
}

function formatUsageMessage(usage) {
  const lines = [];

  lines.push("");
  lines.push("  OpenCode GO Usage");
  lines.push("------------------------");
  lines.push("");

  if (usage.rolling) {
    lines.push(createRow("ROLLING", usage.rolling.usagePercent, usage.rolling.resetInSec));
  }

  if (usage.weekly) {
    lines.push(createRow("WEEKLY", usage.weekly.usagePercent, usage.weekly.resetInSec));
  }

  if (usage.monthly) {
    lines.push(createRow("MONTHLY", usage.monthly.usagePercent, usage.monthly.resetInSec));
  }

  lines.push("");

  return lines.join("\n");
}

export const OpenCodeUsagePlugin = async ({ client }) => {
  return {
    tool: {
      usage: tool({
        description: "Show OpenCode Go usage",
        args: {},
        async execute(args, context) {
          try {
            const usage = await fetchUsage();

            if (!usage || (!usage.rolling && !usage.weekly && !usage.monthly)) {
              return "No usage data found";
            }

            return formatUsageMessage(usage);
          } catch (err) {
            return "Usage fetch failed: " + (err?.message || "Unknown error");
          }
        },
      }),
    },
    event: async ({ event }) => {
      if (event.type === "session.created") {
        try {
          const usage = await fetchUsage();
          if (!usage) return;

          const lines = [];

          lines.push("OpenCode GO Usage");
          lines.push("------------------------");
          lines.push("");

          if (usage.rolling) {
            lines.push(
              "ROLLING   " +
                buildBar(usage.rolling.usagePercent) +
                " " +
                usage.rolling.usagePercent +
                "%  reset " +
                formatTime(usage.rolling.resetInSec)
            );
          }

          if (usage.weekly) {
            lines.push(
              "WEEKLY    " +
                buildBar(usage.weekly.usagePercent) +
                " " +
                usage.weekly.usagePercent +
                "%  reset " +
                formatTime(usage.weekly.resetInSec)
            );
          }

          if (usage.monthly) {
            lines.push(
              "MONTHLY   " +
                buildBar(usage.monthly.usagePercent) +
                " " +
                usage.monthly.usagePercent +
                "%  reset " +
                formatTime(usage.monthly.resetInSec)
            );
          }

          if (lines.length === 0) return;

          await client.tui.showToast({
            body: { message: lines.join("\n"), variant: "info" },
          });
        } catch (_) {}
      }
    },
  };
};