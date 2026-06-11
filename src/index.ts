import { verifySlackRequest } from "./verify";
import { parseCommand } from "./commands";
import { updateStickers, getLeaderboard } from "./stickers";
import {
  formatLeaderboard,
  formatHelp,
  formatError,
  formatCongratsMessage,
  formatSurpassMessage,
} from "./formatter";

export interface Env {
  LEADERBOARD: KVNamespace;
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Verify the request is from Slack
    const { valid, body } = await verifySlackRequest(
      request,
      env.SLACK_SIGNING_SECRET
    );

    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse the URL-encoded body from Slack
    const params = new URLSearchParams(body);
    const text = params.get("text") || "";
    const channelId = params.get("channel_id") || "";

    // Parse the command
    const command = parseCommand(text);

    let responseBody;

    switch (command.action) {
      case "give": {
        // Snapshot leaderboard before update to detect surpassing
        const oldLeaderboard = await getLeaderboard(env.LEADERBOARD);
        const oldRank = oldLeaderboard.findIndex((e) => e.userId === command.targetUserId);
        const oldTotal = oldRank === -1 ? 0 : oldLeaderboard[oldRank].count;

        const newTotal = await updateStickers(
          env.LEADERBOARD,
          command.targetUserId,
          command.amount
        );

        // Get leaderboard to find recipient's new rank
        const leaderboard = await getLeaderboard(env.LEADERBOARD);
        const rank = leaderboard.findIndex((e) => e.userId === command.targetUserId) + 1;

        const postMessage = (message: { text: string; blocks?: object[] }) =>
          fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
            },
            body: JSON.stringify({ channel: channelId, ...message }),
          });

        // Post congratulatory message to the recipient
        await postMessage(
          formatCongratsMessage({
            userId: command.targetUserId,
            newTotal,
            oldTotal,
            rank,
            amount: command.amount,
          })
        );

        // Detect and announce surpassing (only when giving stickers)
        if (command.amount > 0) {
          const newRank = rank - 1; // 0-indexed
          const oldRankIdx = oldRank === -1 ? oldLeaderboard.length : oldRank;
          // Players in old leaderboard that are now behind the target user
          const surpassed = oldLeaderboard.slice(newRank, oldRankIdx).filter(
            (e) => e.userId !== command.targetUserId
          );
          if (surpassed.length > 0) {
            const dethronedChampion =
              oldLeaderboard.length > 0 &&
              surpassed.some((e) => e.userId === oldLeaderboard[0].userId);
            await postMessage(
              formatSurpassMessage(
                command.targetUserId,
                surpassed.map((e) => e.userId),
                dethronedChampion
              )
            );
          }
        }

        // Return empty 200 to suppress the slash command text
        return new Response("", { status: 200 });
      }

      case "leaderboard": {
        const entries = await getLeaderboard(env.LEADERBOARD);
        responseBody = formatLeaderboard(entries);
        break;
      }

      case "help": {
        responseBody = formatHelp();
        break;
      }

      case "error": {
        responseBody = formatError(command.message);
        break;
      }
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
