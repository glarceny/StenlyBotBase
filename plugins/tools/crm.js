// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const fs = require("fs");
const path = require("path");
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");
const { categorySections } = require("../../lib/menu");

function unwrap(content) {
    if (!content || typeof content !== "object") return content;
    if (content.ephemeralMessage?.message) return unwrap(content.ephemeralMessage.message);
    if (content.viewOnceMessage?.message) return unwrap(content.viewOnceMessage.message);
    if (content.viewOnceMessageV2?.message) return unwrap(content.viewOnceMessageV2.message);
    if (content.viewOnceMessageV2Extension?.message) return unwrap(content.viewOnceMessageV2Extension.message);
    if (content.documentWithCaptionMessage?.message) return unwrap(content.documentWithCaptionMessage.message);
    return content;
}

function normalizeForRelay(rawContent) {
    const content = unwrap(rawContent);
    if (typeof content?.conversation === "string") {
        const { conversation, ...rest } = content;
        return { ...rest, extendedTextMessage: { text: conversation } };
    }
    return content;
}

function toJsLiteral(value, indent = 2, seen = new WeakSet(), depth = 0) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
        return JSON.stringify(Buffer.from(value).toString("base64"));
    }
    if (typeof value !== "object") return JSON.stringify(value);
    if (depth > 40) return '"[MaxDepth]"';
    if (seen.has(value)) return '"[Circular]"';
    seen.add(value);

    const pad = " ".repeat(indent);
    const closePad = " ".repeat(Math.max(indent - 2, 0));
    let result;

    if (Array.isArray(value)) {
        result = value.length
            ? `[\n${value.map(item => `${pad}${toJsLiteral(item, indent + 2, seen, depth + 1)}`).join(",\n")}\n${closePad}]`
            : "[]";
    } else {
        const keys = Object.keys(value).filter(key => typeof value[key] !== "function" && value[key] !== undefined);
        result = keys.length
            ? `{\n${keys.map(key => {
                const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
                return `${pad}${safeKey}: ${toJsLiteral(value[key], indent + 2, seen, depth + 1)}`;
            }).join(",\n")}\n${closePad}}`
            : "{}";
    }

    seen.delete(value);
    return result;
}

const FRAMEWORK_KEYS = new Set([
    "mtype", "id", "chat", "isBaileys", "sender", "fromMe", "mentionedJid",
    "fakeObj", "delete", "copyNForward", "download", "key", "participant",
    "text", "body", "name", "pushName", "viewonce", "download1"
]);

function stripFrameworkProps(content) {
    if (!content || typeof content !== "object") return content;
    return Object.fromEntries(Object.entries(content).filter(([key, value]) => {
        return !FRAMEWORK_KEYS.has(key) && typeof value !== "function";
    }));
}

function buildRelayCode(content) {
    const clean = stripFrameworkProps(content);
    return `=> conn.relayMessage(\n  m.chat,\n  ${toJsLiteral(clean)},\n  {}\n)`;
}

function typeNameFromContent(content) {
    const clean = stripFrameworkProps(content);
    const key = Object.keys(clean)[0] || "UnknownMessage";
    return key.charAt(0).toUpperCase() + key.slice(1);
}

function buildRelayCodeFile(content) {
    const dir = path.join(process.cwd(), "debug");
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${typeNameFromContent(content)}.js`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, buildRelayCode(content), "utf8");
    return { filepath, filename };
}

function makeCodeBlocks(code) {
    const blocks = [];
    const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|class|static|new|async|await|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|import|export|from|default|extends|typeof|instanceof|in|of|delete|void|yield)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(code)) !== null) {
        if (match.index > lastIndex) blocks.push({ highlightType: 0, codeContent: code.slice(lastIndex, match.index) });
        const token = match[0];
        let highlightType = 0;
        if (/^(const|let|var|function|return|class|static|new|async|await|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|import|export|from|default|extends|typeof|instanceof|in|of|delete|void|yield)$/.test(token)) highlightType = 1;
        else if (/^(true|false|null|undefined)$/.test(token) || /^\d/.test(token)) highlightType = 2;
        else if (/^['"`]/.test(token)) highlightType = 3;
        else if (/^\/\//.test(token) || /^\/\*/.test(token)) highlightType = 4;
        blocks.push({ highlightType, codeContent: token });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < code.length) blocks.push({ highlightType: 0, codeContent: code.slice(lastIndex) });
    return blocks;
}

async function sendMenuStyle(sock, m, ctx, title, lines) {
    const { botName, prefix, thumb, plugins } = ctx;
    const message = generateWAMessageFromContent(m.chat, {
        buttonsMessage: {
            buttons: [
                {
                    buttonId: "allmenu",
                    buttonText: { displayText: "Pilih Menu" },
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({ title: "Pilih Kategori Menu", sections: categorySections(plugins, prefix) })
                    },
                    type: 1
                },
                { buttonId: `${prefix}owner`, buttonText: { displayText: "Owner" }, type: 1 }
            ],
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: botName,
                address: global.namaown || "WhatsApp Bot",
                jpegThumbnail: thumb ? thumb.toString("base64") : ""
            },
            contentText: `\`「 ${botName} 」\``,
            footerText: `\`「 ${title} 」\`\n${lines.join("\n")}\n\n_*Tekan tombol di bawah untuk melihat semua menu*_`,
            headerType: 6
        }
    }, { userJid: m.chat, upload: sock.waUploadToServer });
    return sock.relayMessage(m.chat, message.message, { messageId: message.key.id });
}

async function sendSnippet(sock, m, content) {
    const code = buildRelayCode(content);
    return sock.relayMessage(m.chat, {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    submessages: [
                        { messageType: 2, messageText: "Halo kak. Berikut kode relay-nya. Klik tombol Lihat kode untuk menyalin kodenya." },
                        { messageType: 5, codeMetadata: { codeLanguage: "javascript", codeBlocks: makeCodeBlocks(code) } }
                    ],
                    contextInfo: { forwardingScore: 1, isForwarded: true, forwardOrigin: 4 }
                }
            }
        }
    }, {});
}

module.exports = {
    name: "crm",
    category: "tools",
    command: ["crm"],
    description: "Relay pesan dan buat kode relay",
    premium: true,
    owner: true,
    run: async (context) => {
        const { sock, m, args, isPremium, isCreator, isOwner, prefix, botName, reply } = context;
        if (!isPremium && !isCreator && !isOwner) {
            return sendMenuStyle(sock, m, context, "Premium Tools", [
                "> Status : *Akses ditolak*",
                "> Fitur CRM khusus premium dan owner*",
                "> Hubungi owner untuk mendapatkan akses"
            ]);
        }

        const rawQuoted = m.quoted?.message || m.msg?.contextInfo?.quotedMessage;
        if (!rawQuoted) {
            return sendMenuStyle(sock, m, context, "CRM Tools", [
                `> Cara pakai : *${prefix}crm*`,
                `> Reply pesan yang ingin di-relay`,
                `> Snippet : *${prefix}crm -snipp*`
            ]);
        }

        const unwrapped = unwrap(rawQuoted);
        if (!unwrapped || typeof unwrapped !== "object" || !Object.keys(unwrapped).length) {
            return reply("*Jenis pesan ini belum didukung untuk di-relay.*");
        }

        try {
            const relayMsg = generateWAMessageFromContent(m.chat, normalizeForRelay(rawQuoted), {
                userJid: sock.user.id,
                quoted: m
            });
            await sock.relayMessage(relayMsg.key.remoteJid, relayMsg.message, { messageId: relayMsg.key.id });

            const isSnippet = args.some(arg => arg.toLowerCase() === "-snipp");
            if (isSnippet) {
                await sendSnippet(sock, m, unwrapped);
                return;
            }

            const { filepath, filename } = buildRelayCodeFile(unwrapped);
            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filepath),
                fileName: filename,
                mimetype: "text/javascript",
                caption: `\`「 ${botName} 」\`\n\`「 CRM Result 」\`\n> File : *${filename}*\n\n_*Tekan tombol di bawah untuk melihat semua menu*_`
            }, { quoted: m });
        } catch (error) {
            console.error(error);
            return reply(`*Gagal memproses CRM: ${error.message}*`);
        }
    }
};
