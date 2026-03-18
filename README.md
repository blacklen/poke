# Slack Poker 🃏🌟

A serverless Slack leaderboard — give and track stickers with `/poke`.

## Commands

| Command | Description |
|---|---|
| `/poke @user +1` | Give 🌟 sticker(s) |
| `/poke @user -1` | Remove 🌟 sticker(s) |
| `/poke leaderboard` | Show rankings 🏆 |
| `/poke help` | Show usage |

## Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Under **Slash Commands**, create a new command:
   - Command: `/poke`
   - Request URL: `https://slack-poker.<your-account>.workers.dev` (update after deploy)
   - Short Description: `Give and track stickers`
3. Under **OAuth & Permissions**, add the `chat:write` bot scope
4. **Install App** to your workspace

### 2. Deploy the Worker

```bash
# Install dependencies
npm install

# Create KV namespace
npx wrangler kv namespace create LEADERBOARD
# Copy the `id` output into wrangler.toml

npx wrangler kv namespace create LEADERBOARD --preview
# Copy the `preview_id` output into wrangler.toml

# Set your Slack signing secret (from Slack App → Basic Information → App Credentials)
npx wrangler secret put SLACK_SIGNING_SECRET

# Set your Slack bot token (from Slack App → OAuth & Permissions → Bot User OAuth Token)
npx wrangler secret put SLACK_BOT_TOKEN

# Deploy
npm run deploy
```

### 3. Update Slack

Go back to your Slack app settings and update the **Request URL** to your deployed Worker URL.

## Local Development

```bash
# Copy env template
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual signing secret

npm run dev
```

## Architecture

```
src/
├── index.ts       # Worker entry point & request routing
├── verify.ts      # Slack signature verification (HMAC-SHA256)
├── commands.ts    # Slash command parser
├── stickers.ts    # KV-backed sticker storage
└── formatter.ts   # Slack Block Kit message formatting
```

Built on **Cloudflare Workers** + **KV** — zero servers, globally distributed.
