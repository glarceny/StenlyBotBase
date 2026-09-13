// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const util = require('util');
const { exec } = require('child_process');

module.exports = {
    name: "exec",
    category: "owner",
    description: "Evaluasi kode JavaScript (=>) & eksekusi shell ($)",
    menu: ["=> <kode>", "$ <perintah>"],
    before: async (context) => {
        const { budy, isCreator, reply, q } = context;

        if (budy.startsWith('=>')) {
            if (!isCreator) return reply("*khusus owner*");
            try {
                let evaled = await eval(budy.slice(2));
                if (typeof evaled !== 'string') evaled = util.inspect(evaled);
                reply(evaled);
            } catch (err) {
                reply(String(err));
            }
            return true;
        }

        if (budy.startsWith('$')) {
            if (!isCreator) return reply("*khusus owner*");
            exec(q, (err, stdout) => {
                if (err) return reply(String(err));
                if (stdout) return reply(stdout);
            });
            return true;
        }

        return false;
    }
};
