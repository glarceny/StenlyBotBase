// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { generateWAMessageFromContent } = require("@itsliaaa/baileys");
const { categorySections } = require("../../lib/menu");

function formatUptime(seconds) {
    let remaining = Math.floor(Number(seconds) || 0);
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return [
        days ? `${days} hari` : "",
        hours ? `${hours} jam` : "",
        minutes ? `${minutes} menit` : "",
        `${secs} detik`
    ].filter(Boolean).join(", ");
}

async function sendMenuStyle(sock, m, context, uptime) {
    const { botName, prefix, thumb, plugins } = context;
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
            footerText: `\`「 Uptime Bot 」\`\n> Status : *Online*\n> Uptime : *${uptime}*\n> Process ID : *${process.pid}*\n> Memory : *${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB*\n\n_*Bot masih aktif dan berjalan normal*_`,
            headerType: 6
        }
    }, { userJid: m.chat, upload: sock.waUploadToServer });
    return sock.relayMessage(m.chat, message.message, { messageId: message.key.id });
}

module.exports = {
    name: "uptime",
    category: "owner",
    command: ["uptime"],
    owner: true,
    description: "Tampilkan uptime bot lengkap",
    run: async (context) => {
        const uptime = formatUptime(process.uptime());
        return sendMenuStyle(context.sock, context.m, context, uptime);
    }
};
