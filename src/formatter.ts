import type { StickerEntry } from "./stickers";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Format the leaderboard display.
 */
export function formatLeaderboard(entries: StickerEntry[]): SlackResponse {
  if (entries.length === 0) {
    return {
      response_type: "ephemeral",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🏆 *Sticker Leaderboard*\n\n_No stickers yet! Use `/poke @user +1` to get started._",
          },
        },
      ],
    };
  }

  const TRACK_LEN = 20;
  const max = entries[0].count;
  const lines = entries.map((entry, i) => {
    const medal = MEDALS[i] || `${i + 1}.`;
    const filled = max > 0 ? Math.round((entry.count / max) * TRACK_LEN) : 0;
    const flag = i === 0 ? "🏁" : "🏃";
    const track = "—".repeat(filled) + flag;
    return `${medal} <@${entry.userId}> ${track} *${entry.count}*`;
  });

  return {
    response_type: "ephemeral",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🏆 *Sticker Leaderboard*\n\n${lines.join("\n")}`,
        },
      },
    ],
  };
}

/**
 * Format help text.
 */
export function formatHelp(): SlackResponse {
  return {
    response_type: "ephemeral",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            "🃏 *Poker Stickers* — Commands:",
            "",
            "• `/poke @user +1` — Give stickers 🌟",
            "• `/poke @user -1` — Remove stickers",
            "• `/poke leaderboard` — View rankings 🏆",
            "• `/poke help` — Show this message",
          ].join("\n"),
        },
      },
    ],
  };
}

/**
 * Format error message (only visible to the user who triggered it).
 */
export function formatError(message: string): SlackResponse {
  return {
    response_type: "ephemeral",
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `⚠️ ${message}` },
      },
    ],
  };
}

interface SlackResponse {
  response_type: "in_channel" | "ephemeral";
  blocks: Array<{
    type: string;
    text: { type: string; text: string };
  }>;
}
