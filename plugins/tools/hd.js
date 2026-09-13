// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { generateWAMessageFromContent, downloadContentFromMessage } = require("@itsliaaa/baileys");
const sharp = require("sharp");

const API = "https://pixel.stenly.id/upscale/upload";

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function upscaleBuffer(buffer, scale) {
    const normalized = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
    const form = new FormData();
    form.append("image", new Blob([normalized], { type: "image/jpeg" }), "input.jpg");
    form.append("scale", scale);

    const response = await fetch(API, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(180000)
    });
    const text = await response.text();
    let payload;
    try {
        payload = JSON.parse(text);
    } catch (_) {
        throw new Error(`respons API tidak valid (${response.status})`);
    }
    if (!response.ok || !payload.ok || !payload.result_url) {
        const detail = payload.detail || payload.error || text.slice(0, 300);
        throw new Error(`API ${response.status}: ${detail}`);
    }
    return payload;
}

function makeButtons(prefix) {
    return [
        {
            buttonId: "allmenu",
            buttonText: { displayText: "Pilih Menu" },
            nativeFlowInfo: {
                name: "single_select",
                paramsJson: JSON.stringify({
                    title: "Pilih Kategori Menu",
                    sections: [{ title: "Pilihan Menu Plugins", rows: [] }]
                })
            },
            type: 1
        },
        {
            buttonId: `${prefix}owner`,
            buttonText: { displayText: "Owner" },
            type: 1
        }
    ];
}

async function sendMenuStyle(sock, m, ctx, title, lines) {
    const { botName, prefix, thumb } = ctx;
    const contentText = `\`「 ${botName} 」\``;
    const footerText = `\`「 ${title} 」\`\n${lines.join('\n')}\n\n_*Tekan tombol di bawah untuk melihat semua menu*_`;
    const menuMessage = generateWAMessageFromContent(m.chat, {
        buttonsMessage: {
            buttons: makeButtons(prefix),
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: botName,
                address: global.namaown || "WhatsApp Bot",
                jpegThumbnail: thumb ? thumb.toString('base64') : ''
            },
            contentText,
            footerText,
            headerType: 6
        }
    }, { userJid: m.chat, upload: sock.waUploadToServer });
    return sock.relayMessage(m.chat, menuMessage.message, { messageId: menuMessage.key.id });
}

module.exports = {
    name: "hd",
    category: "tools",
    command: ["hd"],
    description: "Upscale gambar via Pixelcut API",
    run: async (context) => {
        const { sock, m, args, prefix, mime, qmsg, botName, reply } = context;

        const scale = args.includes("4") ? "4" : "2";
        const inputUrl = args.find(value => /^https?:\/\//i.test(value));
        const hasImageMessage = m.mtype === "imageMessage" && m.msg;
        const hasQuotedImage = qmsg && /image\//i.test(mime || "");

        if (!inputUrl && !hasImageMessage && !hasQuotedImage) {
            return sendMenuStyle(sock, m, context, "HD Tools", [
                `> Cara pakai : *${prefix}hd [2|4]*`,
                `> Reply gambar dengan *${prefix}hd*`,
                `> URL : *${prefix}hd https://contoh.com/foto.jpg*`,
                `> Contoh : *${prefix}hd 2* pada gambar`
            ]);
        }

        await sendMenuStyle(sock, m, context, "HD Proses", [
            `> Scale : *${scale}x*`,
            `> Status : *Memproses gambar...*`
        ]);

        try {
            let result;
            if (!inputUrl && (hasImageMessage || hasQuotedImage)) {
                const imageMessage = hasImageMessage ? m.msg : qmsg;
                const stream = await downloadContentFromMessage(imageMessage, "image");
                const imageBuffer = await streamToBuffer(stream);
                if (!imageBuffer.length) throw new Error("media WhatsApp kosong");
                result = await upscaleBuffer(imageBuffer, scale);
            }

            if (inputUrl) {
                const endpoint = new URL("https://pixel.stenly.id/upscale");
                endpoint.searchParams.set("url", inputUrl);
                endpoint.searchParams.set("scale", scale);
                const res = await fetch(endpoint, { signal: AbortSignal.timeout(180000) });
                const text = await res.text();
                try {
                    result = JSON.parse(text);
                } catch (_) {
                    throw new Error(`respons API tidak valid (${res.status})`);
                }
                if (!res.ok || !result.ok || !result.result_url) {
                    throw new Error(`API ${res.status}: ${result.detail || result.error || text.slice(0, 300)}`);
                }
            }

            const resultUrl = result.result_url;
            if (!resultUrl) return reply(`*Respons API tidak valid.*`);

            const dl = await fetch(resultUrl, { signal: AbortSignal.timeout(60000) });
            if (!dl.ok) return reply(`*Gagal mengunduh hasil upscale.*`);
            const outBuf = Buffer.from(await dl.arrayBuffer());

            const caption = `\`「 ${botName} 」\`\n\`「 HD Result 」\`\n> Scale : *${scale}x*\n> Status : *Berhasil*\n> Via : *${result.via || "direct"}*\n> Sisa : *${result.remaining ?? "-"}*\n\n_*Tekan tombol di bawah untuk melihat semua menu*_`;
            return await sock.sendMessage(m.chat, { image: outBuf, caption }, { quoted: m });
        } catch (e) {
            console.error(e);
            return reply(`*Gagal upscale: ${e.message}*`);
        }
    }
};
