export interface StickerEntry {
  userId: string;
  count: number;
  updatedAt: number;
}

interface StickerRecord {
  count: number;
  updatedAt: number;
}

/**
 * Parse a stored KV value. Supports both the JSON format and legacy
 * plain-number values (which get updatedAt 0, i.e. oldest).
 */
function parseRecord(value: string | null): StickerRecord {
  if (!value) {
    return { count: 0, updatedAt: 0 };
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) {
      return { count: parsed.count || 0, updatedAt: parsed.updatedAt || 0 };
    }
    return { count: parsed || 0, updatedAt: 0 };
  } catch {
    return { count: parseInt(value, 10) || 0, updatedAt: 0 };
  }
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
  const current = parseRecord(await kv.get(userId));
  const newCount = Math.max(0, current.count + amount);
  await kv.put(
    userId,
    JSON.stringify({ count: newCount, updatedAt: Date.now() })
  );
  return newCount;
}

/**
 * Get the sticker count for a single user.
 */
export async function getStickers(
  kv: KVNamespace,
  userId: string
): Promise<number> {
  return parseRecord(await kv.get(userId)).count;
}

/**
 * Get the full leaderboard sorted by sticker count (descending),
 * with ties broken by most recent update first.
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
      const record = parseRecord(await kv.get(key.name));
      if (record.count > 0) {
        entries.push({ userId: key.name, ...record });
      }
    }
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  // Sort descending by count; ties broken by most recent update first
  entries.sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt);

  return entries;
}
