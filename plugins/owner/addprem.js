// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const fs = require('fs');

module.exports = {
    name: "addprem",
    category: "owner",
    command: ["addprem", "delprem"],
    owner: true,
    run: async (context) => {
        const { sock, command, args, q, prefix, isCreator, reply } = context;

        const premPath = "./lib/database/premium.json";

        if (command === "addprem") {
            if (!isCreator) return reply("*❗ AKSES DI TOLAK!!*");
            if (!args[0]) return reply(`❌ BUKAN GITU \n*GINI CARA NYA ✅*\n example: ${prefix}addprem 628xxx`);

            let premium = JSON.parse(fs.readFileSync(premPath));
            let target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            let ceknya = await sock.onWhatsApp(target);
            if (ceknya.length === 0) return reply(`*Masukkan Nomor Yang Valid Dan Terdaftar Di WhatsApp!!!*`);

            if (premium.includes(target)) return reply(`*${target} sudah premium*`);

            premium.push(target);
            fs.writeFileSync(premPath, JSON.stringify(premium, null, 2));
            return reply(`*✅ ${target} TELAH MENJADI PREMIUM*`);
        }

        if (command === "delprem") {
            if (!isCreator) return reply("*❗ AKSES DI TOLAK!!*");
            if (!args[0]) return reply(`❌ BUKAN GITU \n*GINI CARA NYA ✅*\n ${prefix}delprem 628xxx`);

            let premium = JSON.parse(fs.readFileSync(premPath));
            let target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            let unp = premium.indexOf(target);
            if (unp === -1) return reply(`*${target} BUKAN PREMIUM*`);

            premium.splice(unp, 1);
            fs.writeFileSync(premPath, JSON.stringify(premium, null, 2));
            return reply(`*✅ ${target} SUDAH BUKAN PREMIUM*`);
        }
    }
};
