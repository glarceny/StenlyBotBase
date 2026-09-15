// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const fs = require("fs");
const path = require("path");
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const DATABASE = path.join(process.cwd(), "lib/database/antilink.json");
const GROUP_LINK = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/i;

function readState() {
    try {
        const data = JSON.parse(fs.readFileSync(DATABASE, "utf8"));
        return data && typeof data === "object" ? data : {};
    } catch (_) {
        return {};
    }
}

function writeState(state) {
    fs.writeFileSync(DATABASE, JSON.stringify(state, null, 2));
}

async function menuReply(sock, m, context, title, lines) {
    const { botName, prefix, thumb, plugins } = context;
    const categories = plugins.getCategories();
    const sections = [{
        title: "Pilihan Menu Plugins",
        rows: Object.keys(categories).sort().map(category => ({
            title: `${category.charAt(0).toUpperCase()}${category.slice(1)} Menu`,
            description: `Lihat daftar fitur ${category}`,
            id: `${prefix}menu ${category}`
        }))
    }];
    const message = generateWAMessageFromContent(m.chat, {
        buttonsMessage: {
            buttons: [{
                buttonId: "allmenu",
                buttonText: { displayText: "Pilih Menu" },
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({ title: "Pilih Kategori Menu", sections })
                },
                type: 1
            }, {
                buttonId: `${prefix}owner`,
                buttonText: { displayText: "Owner" },
                type: 1
            }],
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

module.exports = {
    name: "antilink",
    category: "grup",
    command: ["antilink"],
    owner: true,
    group: true,
    description: "Aktifkan atau matikan penghapus link grup WhatsApp",
    before: async context => {
        const { body, prefix, isGroup, isBotAdmins, m, sock } = context;
        if (!isGroup || body.trim().startsWith(prefix) || !GROUP_LINK.test(body)) return false;

        const state = readState();
        if (!state[m.chat]?.enabled || !isBotAdmins) return false;

        try {
            await sock.sendMessage(m.chat, { delete: m.key });
        } catch (error) {
            console.error(`[ANTILINK] ${error.message}`);
        }
        return true;
    },
    run: async context => {
        const { sock, m, args, isGroup, isBotAdmins } = context;
        if (!isGroup) return context.reply("*Command ini hanya bisa dipakai di grup.*");

        const action = String(args[0] || "").toLowerCase();
        if (!["on", "off"].includes(action)) {
            return menuReply(sock, m, context, "Antilink Grup", [
                "> Status : *Gunakan on atau off*",
                "> Contoh : */antilink on*",
                "> Contoh : */antilink off*"
            ]);
        }

        if (action === "on" && !isBotAdmins) {
            return menuReply(sock, m, context, "Antilink Grup", [
                "> Status : *Gagal diaktifkan*",
                "> Bot bukan admin di grup ini*",
                "> Jadikan bot admin terlebih dahulu"
            ]);
        }

        const state = readState();
        state[m.chat] = {
            enabled: action === "on",
            updatedAt: new Date().toISOString()
        };
        writeState(state);

        return menuReply(sock, m, context, "Antilink Grup", [
            `> Grup : *${context.groupName || m.chat}*`,
            `> Status : *${action === "on" ? "Aktif" : "Nonaktif"}*`,
            `> Link grup WhatsApp akan ${action === "on" ? "dihapus otomatis" : "dibiarkan"}`
        ]);
    }
};
