// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { resolveTarget, readList, writeList, verifyWhatsAppNumber } = require('../../lib/target');

module.exports = {
    name: "addprem",
    category: "owner",
    command: ["addprem", "delprem"],
    owner: true,
    run: async (context) => {
        const { sock, m, command, args, q, prefix, isCreator, reply } = context;

        const premPath = "./lib/database/premium.json";

        if (command === "addprem") {
            if (!isCreator) return reply("*❗ AKSES DI TOLAK!!*");
            if (!args[0] && !(m.mentionedJid || m.msg?.contextInfo?.mentionedJid)?.length) return reply(`❌ Gunakan ${prefix}addprem 628xxx atau mention seseorang`);

            const premium = readList(premPath);
            const target = resolveTarget(m, args, q);
            if (!target || !(await verifyWhatsAppNumber(sock, target))) return reply(`*Masukkan nomor WhatsApp yang valid atau mention anggota grup.*`);

            if (premium.includes(target)) return reply(`*${target} sudah premium*`);

            premium.push(target);
            writeList(premPath, [...premium, target]);
            return reply(`*✅ ${target} TELAH MENJADI PREMIUM*`);
        }

        if (command === "delprem") {
            if (!isCreator) return reply("*❗ AKSES DI TOLAK!!*");
            if (!args[0] && !(m.mentionedJid || m.msg?.contextInfo?.mentionedJid)?.length) return reply(`❌ Gunakan ${prefix}delprem 628xxx atau mention seseorang`);

            const premium = readList(premPath);
            const target = resolveTarget(m, args, q);
            let unp = premium.indexOf(target);
            if (unp === -1) return reply(`*${target} BUKAN PREMIUM*`);

            premium.splice(unp, 1);
            writeList(premPath, premium);
            return reply(`*✅ ${target} SUDAH BUKAN PREMIUM*`);
        }
    }
};
