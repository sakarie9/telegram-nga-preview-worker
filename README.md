# Telegram NGA Preview Worker

A Cloudflare Worker Driven Telegram Bot Designed to Fetch NGA Previews

## What will it do

Send the bot a link of [NGABBS](https://ngabbs.com/), it will reply you with a link preview

Or add the bot to a group, it will reply any message with a vaild NGA link with a link preview

## How to use

1. Install wrangler or use npx to run wrangler

2. Clone this repo

   `git clone https://github.com/sakarie9/telegram-nga-preview-worker`

3. Add Telegram token to cloudflare workers

   `wrangler secret put TELEGRAM_BOT_TOKEN`

   copy-paste whole line and wrangler will promot you to input the sercet

4. Deploy

   `wrangler deploy`
