export interface StickerEntry {
  userId: string;
  count: number;
}

/**
 * Add or remove stickers for a user. Count floors at 0.
 * Returns the new total.
 */
export async function updateStickers(
  kv: KVNamespace,
  userId: string,
  amount: number
): Promise<number> {
  const current = parseInt((await kv.get(userId)) || "0", 10);
  const newCount = Math.max(0, current + amount);
  await kv.put(userId, newCount.toString());
  return newCount;
}

/**
 * Get the sticker count for a single user.
 */
export async function getStickers(
  kv: KVNamespace,
  userId: string
): Promise<number> {
  return parseInt((await kv.get(userId)) || "0", 10);
}

/**
 * Get the full leaderboard sorted by sticker count (descending).
 *
 * KV `list()` returns all keys. We read each value and sort.
 * For small-to-medium team sizes (< 1000 users) this is efficient enough.
 */
export async function getLeaderboard(
  kv: KVNamespace
): Promise<StickerEntry[]> {
  const entries: StickerEntry[] = [];
  let cursor: string | undefined;

  // Paginate through all keys
  do {
    const result = await kv.list({ cursor });
    for (const key of result.keys) {
const count = parseInt((await kv.get(key.name)) || "0", 10);
      if (count > 0) {
        entries.push({ userId: key.name, count });
      }
    }
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  // Sort descending by count
  entries.sort((a, b) => b.count - a.count);

  return entries;
}
