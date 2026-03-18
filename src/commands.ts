export type Command =
  | { action: "give"; targetUserId: string; targetUsername: string; amount: number }
  | { action: "leaderboard" }
  | { action: "help" }
  | { action: "error"; message: string };

/**
 * Parse the text portion of a /poke slash command.
 *
 * Expected formats:
 *   /poke @user +1
 *   /poke @user -3
 *   /poke leaderboard
 *   /poke help
 *
 * Slack encodes user mentions as <@U12345|display_name> or <@U12345>
 */
export function parseCommand(text: string): Command {
  const trimmed = text.trim();

  if (!trimmed || trimmed === "help") {
    return { action: "help" };
  }

  if (trimmed === "leaderboard") {
    return { action: "leaderboard" };
  }

  // Match Slack-encoded mention: <@U12345|display> +3  or  <@U12345> -1
  const encodedMatch = trimmed.match(
    /^<@([UW][A-Z0-9]+)\|?([^>]*)>\s*([+-]\d+)>?$/i
  );
  // Match plain mention: @username +3
  const plainMatch = trimmed.match(/^@([A-Za-z0-9._-]+)\s*([+-]\d+)$/);

  const match = encodedMatch ?? plainMatch;

  console.log("Parsed command:", { text, match });

  if (!match) {
    return {
      action: "error",
      message:
        "Invalid format. Use:\n• `/poke @user +1` to give 🌟\n• `/poke @user -1` to remove 🌟\n• `/poke leaderboard` to see rankings",
    };
  }

  const targetUserId = match[1];
  const targetUsername = match[2] || match[1];
  const amount = parseInt(encodedMatch ? match[3] : match[2], 10);

  if (amount === 0) {
    return { action: "error", message: "Amount must be non-zero!" };
  }

  return { action: "give", targetUserId, targetUsername, amount };
}
