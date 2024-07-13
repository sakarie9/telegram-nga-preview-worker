/**
 * https://github.com/cvzi/telegram-bot-cloudflare
 */

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
async function onMessage(message) {
	text = message.text;
	if (text.startsWith('/start') || text.startsWith('/help')) {
		return sendPlainText(message.chat.id, 'Send me a NGA link!');
	}

	ngaLink = getNGALinkFromMessage(text);
	if (ngaLink == null) {
		return;
	}

	const html = await getNGAHtml(ngaLink);
	const preview = getNGATextPreview(ngaLink, html);
	const img_count = getImageCount(html);
	if (img_count == 0) {
		return sendTextReply(message.chat.id, message.message_id, preview);
	} else if (img_count == 1) {
		const img_link = getNGAImgLink(html);
		return sendPhoto(message.chat.id, message.message_id, img_link, preview);
	} else {
		const mediaGroup = getMediaGroup(html);
		mediaGroup[0]['caption'] = preview;
		mediaGroup[0]['parse_mode'] = 'HTML';
		const media = JSON.stringify(mediaGroup, null, 0);
		return sendMediaGroup(message.chat.id, message.message_id, media);
	}
}

function getNGALinkFromMessage(text) {
	const pattern_nga = /(?:https?:\/\/(?:bbs\.nga\.cn|ngabbs\.com|nga\.178\.com|bbs\.gnacn\.cc)[-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
	if (pattern_nga.test(text)) {
		const match = text.match(pattern_nga);
		var ngaLink = match[0];

		// 指定楼层
		if (ngaLink.includes('&opt=128')) {
			ngaLink = ngaLink.replace('&opt=128', '');
		}

		logf(ngaLink);

		return ngaLink;
	}
	return null;
}

async function getNGAHtml(ngaLink) {
	const cookie = getNGACookie();
	const response = await fetch(ngaLink, {
		headers: {
			// 在请求头部中包含所需的 Cookie
			Cookie: cookie,
			'User-Agent': UA,
		},
	});
	const buffer = await response.arrayBuffer();
	// 将内容从 GBK 转换为 UTF-8
	const decoder = new TextDecoder('gbk');
	const html = decoder.decode(buffer);

	const pattern_content = /<span id='postcontentandsubject0'>([^]*?)<\/span>/;
	let content = html.match(pattern_content)[1];
	return content; // return 1L content
}

function getNGAGuestCookie() {
	const timestamp = Math.round(new Date().getTime() / 1000) - 100;

	var random5 = Math.floor(Math.random() * 0xfffff).toString(16);
	while (random5.length < 5) {
		random5 = '0' + random5;
	}

	const uid = `guest0${timestamp.toString(16)}${random5}`;

	return `ngaPassportUid=${uid};guestJs=${timestamp}_1ihvp2v`;
}

function getNGACookie() {
	if (NGA_UID == '' || NGA_CID == '') {
		return getNGAGuestCookie();
	}
	return `ngaPassportUid=${NGA_UID};ngaPassportCid=${NGA_CID}`;
}

function getNGATextPreview(ngaLink, html) {
	const pattern_title = /<h3 id='postsubject0'>(.*?)<\/h3>/;
	const pattern_body = /<p id='postcontent0' class='postcontent ubbcode'>(.*?)<\/p>/;

	let title = html.match(pattern_title)[1];
	let body = html.match(pattern_body)[1];
	body = body.replaceAll('<br/>', '\n');
	body = body.replaceAll('&quot;', '"');
	body = body.replaceAll('&amp;', '&');
	body = body.replaceAll('&lt;', '<');
	body = body.replaceAll('&gt;', '>');
	body = body.replaceAll('&nbsp;', ' ');
	body = body.replaceAll('&apos;', "'");
	// Delete [img] tags and contents
	const pattern_img = /\[img\](.*?)\[\/img\]/g;
	body = body.replaceAll(pattern_img, '');
	// Delete Stickers
	const pattern_sticker = /\[s:.*?\]/g;
	body = body.replaceAll(pattern_sticker, '');
	// Replace [del] with <del>
	const pattern_del = /\[del\](.*?)\[\/del\]/g;
	body = body.replaceAll(pattern_del, '<del>$1</del>');
	// Reduce \n
	body = body.replaceAll(/\n{3,}/g, '\n\n');
	// Delete [quote]
	const pattern_quote = /\[quote\](.*?)\[\/quote\]/g;
	body = body.replaceAll(pattern_quote, '$1');
	// Replace [url] with <a href=""></a>
	const pattern_url = /\[url\](.*?)\[\/url\]/g;
	body = body.replaceAll(pattern_url, '<a href="$1">$1</a>');
	// Replace [collapse]
	const pattern_collapse = /\[collapse=(.*?)\](.*?)\[\/collapse\]/g;
	body = body.replaceAll(pattern_collapse, '[$1]$2[/$1]');

	body = substringDesc(body);

	logf(`title: ${title}`);
	logf(`body: ${body}`);

	if (title !== '') {
		return `<b><u><a href="${ngaLink}">${title}</a></u></b>\n\n${body}`;
	} else {
		return `${body}\n\n${ngaLink}`;
	}
}

function getNGAImgLink(html) {
	// 获取图片
	const pattern_img = /\[img](.*?)\[\/img\]/;

	const img = html.match(pattern_img)[1];

	return imgLinkProcess(img);
}

function getMediaGroup(html) {
	const pattern_img = /\[img](.*?)\[\/img\]/g;
	var jsonArray = [];
	let count = 0;

	while ((match = pattern_img.exec(html)) !== null && count < 10) {
		jsonArray.push({
			type: 'photo',
			media: imgLinkProcess(match[1]),
		});
		count++;
	}
	return jsonArray;
}

function getImageCount(html) {
	const pattern_img = /\[img](.*?)\[\/img\]/g;
	if (!pattern_img.test(html)) {
		return 0;
	}
	var matches = html.match(pattern_img);
	return matches ? matches.length : 0;
}

function imgLinkProcess(imgLink) {
	if (imgLink.startsWith('http://') | imgLink.startsWith('https://')) {
		return imgLink;
	} else {
		return `https://img.nga.178.com/attachments/${imgLink.substring(2)}`;
	}
}

function substringDesc(desc) {
	const maxLength = 400;
	const maxmaxLength = 600;

	// 如果title字段的长度超过了最大字符数，则截取字符串
	if (desc.length > maxLength) {
		// 使用substring()方法截取字符串
		var crPos = desc.indexOf('\n', maxLength);
		// 未查找到换行符则设置为字符串长度
		if (crPos == -1) {
			crPos = desc.length - 1;
		}
		if (crPos < maxmaxLength) {
			// 换行符在最大长度和极限长度之间
			// 裁剪到换行符
			return desc.substring(0, crPos).trim();
		} else {
			return desc.substring(0, maxLength).trim() + '……';
		}
	} else {
		return desc.trim();
	}
}

/**
 * Send plain text message
 * https://core.telegram.org/bots/api#sendmessage
 */
async function sendPlainText(chatId, text) {
	return (
		await fetch(
			apiUrl('sendMessage', {
				chat_id: chatId,
				text,
			}),
		)
	).json();
}

/**
 * Reply message
 * https://core.telegram.org/bots/api#sendmessage
 */
async function sendTextReply(chatId, messageId, text) {
	return (
		await fetch(
			apiUrl('sendMessage', {
				chat_id: chatId,
				text,
				parse_mode: 'HTML',
				reply_to_message_id: messageId,
			}),
		)
	).json();
}

/**
 * Send Photo
 * https://core.telegram.org/bots/api#sendphoto
 */
async function sendPhoto(chatId, messageId, photo, caption) {
	return (
		await fetch(
			apiUrl('sendPhoto', {
				chat_id: chatId,
				photo,
				caption,
				parse_mode: 'HTML',
				reply_to_message_id: messageId,
			}),
		)
	).json();
}

/**
 * Send MediaGroup
 * https://core.telegram.org/bots/api#sendMediaGroup
 */
async function sendMediaGroup(chatId, messageId, media) {
	return (
		await fetch(
			apiUrl('sendMediaGroup', {
				chat_id: chatId,
				media,
				reply_to_message_id: messageId,
			}),
		)
	).json();
}

// ==================================================================================================================

/**
 * Wait for requests to the worker
 */
addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (url.pathname === WEBHOOK) {
		event.respondWith(handleWebhook(event));
	} else if (url.pathname === '/registerWebhook') {
		event.respondWith(registerWebhook(event, url, WEBHOOK, SECRET));
	} else if (url.pathname === '/unRegisterWebhook') {
		event.respondWith(unRegisterWebhook(event));
	} else {
		if (DEBUG) {
			event.respondWith(debugRequest(event.request));
		} else {
			event.respondWith(new Response('No handler for this request'));
		}
	}
});

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
async function handleWebhook(event) {
	// Check secret
	if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
		return new Response('Unauthorized', { status: 403 });
	}

	// Read request body synchronously
	const update = await event.request.json();
	// Deal with response asynchronously
	event.waitUntil(onUpdate(update));

	return new Response('Ok');
}

/**
 * Handle incoming Update
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate(update) {
	if ('message' in update) {
		await onMessage(update.message);
	}
}

/**
 * Set webhook to this worker's url
 * https://core.telegram.org/bots/api#setwebhook
 */
async function registerWebhook(event, requestUrl, suffix, secret) {
	// https://core.telegram.org/bots/api#setwebhook
	const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
	const r = await (await fetch(apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))).json();
	return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
}

/**
 * Remove webhook
 * https://core.telegram.org/bots/api#setwebhook
 */
async function unRegisterWebhook(event) {
	const r = await (await fetch(apiUrl('setWebhook', { url: '' }))).json();
	return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2));
}

/**
 * Return url to telegram api, optionally with parameters added
 */
function apiUrl(methodName, params = null) {
	let query = '';
	if (params) {
		query = '?' + new URLSearchParams(params).toString();
	}
	return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${methodName}${query}`;
}

// ===========================================================================================================

function logf(...args) {
	if (LOG) {
		console.log(...args);
	}
}

async function debugRequest(request) {
	link = LINK;
	if (link.includes('&opt=128')) {
		link = link.replace('&opt=128', '');
	}
	const html = await getNGAHtml(link);
	const preview = getNGATextPreview(link, html);
	const img_count = getImageCount(html);
	logf(link);
	logf(preview);
	logf(img_count);
	logf(imgs);
	var imgs = '';
	if (img_count == 0) {
	} else if (img_count == 1) {
		imgs = getNGAImgLink(html);
	} else {
		imgs = getMediaGroup(html);
		imgs[0]['caption'] = preview;
		imgs[0]['parse_mode'] = 'HTML';
		return new Response(preview + '\n' + JSON.stringify(imgs, null, 2));
	}

	return new Response(preview + '\n' + imgs);
	//return await getNGAPreview('https://bbs.nga.cn/read.php?tid=38176519&rand=944')
}
