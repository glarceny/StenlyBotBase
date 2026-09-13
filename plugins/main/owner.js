// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

module.exports = {
    name: "owner",
    category: "main",
    command: ["owner"],
    description: "Tampilkan informasi owner bot",
    run: async (context) => {
        const { reply, botDev, botName } = context;
        await reply(`\`「 Owner 」\`\n> Dev : *${botDev}*\n> Nama : *${botName}*`);
    }
};
