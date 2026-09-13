// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { resolveTarget, readList, writeList, verifyWhatsAppNumber } = require('../../lib/target');

module.exports = {
    name: "addown",
    category: "owner",
    command: ["addowner", "addown", "delowner", "delown"],
    owner: true,
    run: async (context) => {
        const { sock, m, command, args, q, prefix, isCreator, reply } = context;

        const ownerPath = "./lib/database/owner.json";

        if (command === "addowner" || command === "addown") {
            if (!isCreator) return reply(`*khusus owner!*`);
            if (!args[0] && !(m.mentionedJid || m.msg?.contextInfo?.mentionedJid)?.length) return reply(`*example: ${prefix}addowner 628xxx atau mention seseorang*`);

            const ownerbot = readList(ownerPath);
            const target = resolveTarget(m, args, q);
            if (!target || !(await verifyWhatsAppNumber(sock, target))) return reply(`*Masukkan nomor WhatsApp yang valid atau mention anggota grup.*`);

            if (ownerbot.includes(target)) return reply(`*${target} sudah jadi owner*`);

            ownerbot.push(target);
            writeList(ownerPath, [...ownerbot, target]);
            return reply(`*✅ ${target} TELAH MENJADI OWNER*`);
        }

        if (command === "delowner" || command === "delown") {
            if (!isCreator) return reply(`*khusus owner!!*`);
            if (!args[0] && !(m.mentionedJid || m.msg?.contextInfo?.mentionedJid)?.length) return reply(`*example: ${prefix}delowner 628xxx atau mention seseorang*`);

            const ownerbot = readList(ownerPath);
            const target = resolveTarget(m, args, q);
            let unp = ownerbot.indexOf(target);
            if (unp === -1) return reply(`*${target} BUKAN OWNER*`);

            ownerbot.splice(unp, 1);
            writeList(ownerPath, ownerbot);
            return reply(`*✅ ${target} SUDAH BUKAN OWNER*`);
        }
    }
};
