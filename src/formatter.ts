import type { StickerEntry } from "./stickers";
import templates from "./templates.json";

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
    if (i === 0) {
      return `${medal} <@${entry.userId}>, you're the champion with *${entry.count}* stickers!`;
    }
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

function pick<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => vars[key] ?? m);
}

function gifBlock(gifs: string[]): MessageBlock {
  return {
    type: "image",
    image_url: pick(gifs),
    alt_text: "chúc mừng!",
  };
}

export interface ChannelMessage {
  text: string;
  blocks?: MessageBlock[];
}

export interface CongratsContext {
  userId: string;
  newTotal: number;
  oldTotal: number;
  rank: number;
  amount: number;
}

export function formatCongratsMessage(ctx: CongratsContext): ChannelMessage {
  const { champion, milestone, bigDrop, regular } = templates.congrats;

  let pool: { templates: string[]; gifs: string[] } = regular;
  if (ctx.rank === 1) {
    pool = champion;
  } else if (
    milestone.thresholds.some((m) => ctx.oldTotal < m && ctx.newTotal >= m)
  ) {
    pool = milestone;
  } else if (ctx.amount >= bigDrop.minAmount) {
    pool = bigDrop;
  }

  const text = interpolate(pick(pool.templates), {
    user: `<@${ctx.userId}>`,
    total: ctx.newTotal.toString(),
    amount: ctx.amount.toString(),
    rank: ctx.rank.toString(),
  });

  return {
    text,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text } },
      gifBlock(pool.gifs),
    ],
  };
}

export function formatSurpassMessage(
  surpasserId: string,
  surpassedIds: string[],
  dethronedChampion: boolean
): ChannelMessage {
  const { dethrone, multi, regular } = templates.surpass;
  const pool = dethronedChampion ? dethrone : surpassedIds.length > 1 ? multi : regular;

  const text = interpolate(pick(pool.templates), {
    surpasser: `<@${surpasserId}>`,
    surpassed: surpassedIds.map((id) => `<@${id}>`).join(", "),
  });

  if (dethronedChampion) {
    return {
      text,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text } },
        gifBlock(dethrone.gifs),
      ],
    };
  }
  return { text };
}

type MessageBlock =
  | { type: "section"; text: { type: string; text: string } }
  | { type: "image"; image_url: string; alt_text: string };

interface SlackResponse {
  response_type: "in_channel" | "ephemeral";
  blocks: Array<{
    type: string;
    text: { type: string; text: string };
  }>;
}
