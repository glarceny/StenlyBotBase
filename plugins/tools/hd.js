// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { generateWAMessageFromContent, downloadContentFromMessage } = require("@itsliaaa/baileys");
const sharp = require("sharp");

const API = "https://pixel.stenly.id/upscale";
const IMAGE_HOSTS = [
    {
        url: "https://uguu.se/upload.php",
        field: "files[]",
        parse: async response => (await response.json())?.files?.[0]?.url
    },
    {
        url: "https://tmpfiles.org/api/v1/upload",
        field: "file",
        parse: async response => {
            const result = (await response.json())?.data?.url;
            return result ? result.replace("tmpfiles.org/", "tmpfiles.org/dl/") : null;
        }
    }
];

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function uploadTemporaryImage(buffer) {
    const normalized = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
    let lastError = "upload media gagal";
    for (const host of IMAGE_HOSTS) {
        try {
            const form = new FormData();
            form.append(host.field, new Blob([normalized], { type: "image/jpeg" }), "input.jpg");
            const response = await fetch(host.url, {
                method: "POST",
                body: form,
                signal: AbortSignal.timeout(60000)
            });
            const url = await host.parse(response);
            if (response.ok && /^https?:\/\//i.test(url || "")) {
                const probe = await fetch(url, {
                    method: "HEAD",
                    signal: AbortSignal.timeout(30000)
                });
                const contentType = probe.headers.get("content-type") || "";
                if (probe.ok && contentType.startsWith("image/")) return url;
                lastError = `${host.url} menghasilkan content-type ${contentType || "unknown"}`;
                continue;
            }
            lastError = `${host.url} (${response.status})`;
        } catch (error) {
            lastError = `${host.url} (${error.message})`;
        }
    }
    throw new Error(lastError);
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
            let sourceUrl = inputUrl;
            if (!sourceUrl && (hasImageMessage || hasQuotedImage)) {
                const imageMessage = hasImageMessage ? m.msg : qmsg;
                const stream = await downloadContentFromMessage(imageMessage, "image");
                const imageBuffer = await streamToBuffer(stream);
                if (!imageBuffer.length) throw new Error("media WhatsApp kosong");
                sourceUrl = await uploadTemporaryImage(imageBuffer);
            }

            const endpoint = `${API}?url=${encodeURIComponent(sourceUrl)}&scale=${scale}`;
            const res = await fetch(endpoint, {
                method: "GET",
                signal: AbortSignal.timeout(120000)
            });
            const text = await res.text();

            if (res.status === 429) {
                return sendMenuStyle(sock, m, context, "HD Limit", [
                    `> Scale : *${scale}x*`,
                    `> Status : *Limit API tercapai*`,
                    `> Coba lagi nanti`
                ]);
            }

            if (!res.ok) {
                let msg = text.slice(0, 300);
                return sendMenuStyle(sock, m, context, "HD Gagal", [
                    `> Scale : *${scale}x*`,
                    `> Kode : *${res.status}*`,
                    `> Pesan : *${msg}*`
                ]);
            }

            let result;
            try {
                result = JSON.parse(text);
            } catch (_) {
                return reply(`*Respons API tidak valid.*`);
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
