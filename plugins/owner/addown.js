// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const fs = require('fs');

module.exports = {
    name: "addown",
    category: "owner",
    command: ["addowner", "addown", "delowner", "delown"],
    owner: true,
    run: async (context) => {
        const { sock, command, args, q, prefix, isCreator, reply } = context;

        const ownerPath = "./lib/database/owner.json";

        if (command === "addowner" || command === "addown") {
            if (!isCreator) return reply(`*khusus owner!*`);
            if (!args[0]) return reply(`*example: ${prefix}addowner 628xxx*`);

            let ownerbot = JSON.parse(fs.readFileSync(ownerPath));
            let target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            let ceknya = await sock.onWhatsApp(target);
            if (ceknya.length === 0) return reply(`*Masukkan Nomor Yang Valid Dan Terdaftar Di WhatsApp!!!*`);

            if (ownerbot.includes(target)) return reply(`*${target} sudah jadi owner*`);

            ownerbot.push(target);
            fs.writeFileSync(ownerPath, JSON.stringify(ownerbot, null, 2));
            return reply(`*✅ ${target} TELAH MENJADI OWNER*`);
        }

        if (command === "delowner" || command === "delown") {
            if (!isCreator) return reply(`*khusus owner!!*`);
            if (!args[0]) return reply(`*example: ${prefix}delowner 628xxx*`);

            let ownerbot = JSON.parse(fs.readFileSync(ownerPath));
            let target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            let unp = ownerbot.indexOf(target);
            if (unp === -1) return reply(`*${target} BUKAN OWNER*`);

            ownerbot.splice(unp, 1);
            fs.writeFileSync(ownerPath, JSON.stringify(ownerbot, null, 2));
            return reply(`*✅ ${target} SUDAH BUKAN OWNER*`);
        }
    }
};
