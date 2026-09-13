// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

module.exports = {
    name: "modebot",
    category: "owner",
    command: ["public", "self"],
    owner: true,
    run: async (context) => {
        const { sock, command, isCreator, reply } = context;

        if (!isCreator) return reply("*Khusus Owner*");

        if (command === "public") {
            if (sock.public === true) return reply("Success To Public Mode");
            sock.public = true;
            return reply("Success To Public Mode");
        }

        if (command === "self") {
            if (sock.public === false) return reply("Success To Self Mode");
            sock.public = false;
            return reply("Success To Self Mode");
        }
    }
};
