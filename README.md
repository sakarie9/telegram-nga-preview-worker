# Telegram NGA Preview Worker

A Cloudflare Worker Driven Telegram Bot Designed to Fetch NGA Previews

## What will it do

Send the bot a link of [NGABBS](https://ngabbs.com/), it will reply you with a link preview

Or add the bot to a group, it will reply any message with a vaild NGA link with a link preview

## How to use

1. Install wrangler or use npx to run wrangler

2. Clone this repo

   `git clone https://github.com/sakarie9/telegram-nga-preview-worker`

3. Add Telegram bot token to cloudflare workers

   `wrangler secret put TELEGRAM_BOT_TOKEN`

   copy-paste whole line and wrangler will promot you to input the sercet

4. Get NGA UID and CID

   this step is needed if the default guest mode not work

   get your nga `ngaPassportUid` and `ngaPassportCid` from cookie

   then

   `wrangler secret put NGA_UID` and input `ngaPassportUid`

   `wrangler secret put NGA_CID` and input `ngaPassportCid`

5. Deploy

   `wrangler deploy`

6. Active webhook

   get the url of the worker in cloudflare dashboard and append `/registerWebhook` to the url. For example: `https://telegram-nga-preview.username.workers.dev/registerWebhook`

   open the url in a browser, you will see a 'Ok'

7. Done

   now you can send the bot some link to see if it works
