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

const SURPASS_TEMPLATES = [
  (a: string, b: string) => `<@${a}> vừa vượt <@${b}> rồi kìa 😏 <@${b}> ơi tỉnh dậy đi nào`,
  (a: string, b: string) => `<@${a}> leo qua đầu <@${b}> rồi nè, chịu nổi không? 😤`,
  (a: string, b: string) => `Và thế là, <@${b}> bị <@${a}> bỏ lại rồi đấy 🏃‍♂️💨`,
  (a: string, b: string) => `<@${b}> ơi... <@${a}> qua mặt rồi kìa 😭`,
  (a: string, b: string) => `🔥 <@${a}> vừa vươn lên trên <@${b}> rồi nha! <@${b}> cố lên nhé!!!!`,
];

export function formatSurpassMessage(surpasserId: string, surpassedId: string): string {
  const template = SURPASS_TEMPLATES[Math.floor(Math.random() * SURPASS_TEMPLATES.length)];
  return template(surpasserId, surpassedId);
}

interface SlackResponse {
  response_type: "in_channel" | "ephemeral";
  blocks: Array<{
    type: string;
    text: { type: string; text: string };
  }>;
}
