/**
 * Verify that an incoming request is from Slack using the signing secret.
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */

const FIVE_MINUTES = 5 * 60;

export async function verifySlackRequest(
  request: Request,
  signingSecret: string
): Promise<{ valid: boolean; body: string }> {
  const signature = request.headers.get("X-Slack-Signature");
  const timestamp = request.headers.get("X-Slack-Request-Timestamp");

  if (!signature || !timestamp) {
    return { valid: false, body: "" };
  }

  // Reject requests older than 5 minutes (replay attack prevention)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > FIVE_MINUTES) {
    return { valid: false, body: "" };
  }

  const body = await request.text();
  const baseString = `v0:${timestamp}:${body}`;

  // Compute HMAC-SHA256 using Web Crypto API
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(baseString)
  );

  const computedSignature =
    "v0=" +
    Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Timing-safe comparison
  const valid = timingSafeEqual(computedSignature, signature);

  return { valid, body };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
