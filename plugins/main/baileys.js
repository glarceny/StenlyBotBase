// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

module.exports = {
    name: "baileys",
    category: "main",
    description: "Rekomendasi otomatis library Baileys",
    menu: ["bail / baileys / npm"],
    before: async (context) => {
        const { sock, body, from, pushname, prefix, reply } = context;

        const lowerBody = (body || '').toLowerCase();
        const triggerWords = ['bail', 'baileys', 'npm', 'bails'];
        const isTrigger = triggerWords.some(word => lowerBody.includes(word));

        if (isTrigger && !body.startsWith(prefix)) {
            try {
                const anu = `> 📢 *haloo ${pushname}, saya ada rekomendasi library baileys bot WhatsApp* [ *@itsliaaa/baileys ]* 📢`;
                const msg = `
\`"@itsliaaa/baileys"\`

📍*cara penggunaan*📍

\`\`\`"@itsliaaa/baileys": "github:itsliaaa/baileys",

{
  "dependencies": {
    "@itsliaaa/baileys": "github:itsliaaa/baileys",
    "@hapi/boom": "^10.0.1",
    "pino": "^8.17.2",
    "jimp": "^0.22.12",
    "sharp": "0.34.1",
    "fflate": "^0.8.2",
  }
}\`\`\`

- Support AiRich 
- Support html
- Support table A2UI
- No logout sender 
- Update Proto terbaru 
- Support all type button 
- Support custom pairing 
- Support script type cjs & esm
- dll 

📦*packages*📦
https://github.com/itsliaaa/baileys
`;

                const interactiveMsg = {
                    body: { text: anu },
                    footer: { text: msg },
                    header: {
                        hasMediaAttachment: false
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Copy baileys",
                                    id: "copy_baileys",
                                    copy_code: '"@itsliaaa/baileys": "github:itsliaaa/baileys"'
                                })
                            },
                            {
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Copy fflate",
                                    id: "copy_fflate",
                                    copy_code: '"fflate": "^0.8.2"'
                                })
                            },
                            {
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Copy jimp",
                                    id: "copy_jimp",
                                    copy_code: '"jimp: "^0.22.12"'
                                })
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Information",
                                    url: "https://whatsapp.com/channel/0029VbD8x4q1dAw0XWN7wF0L",
                                    merchant_url: "https://www.google.com"
                                })
                            }
                        ],
                        messageParamsJson: "{}"
                    }
                };

                const generatedMsg = generateWAMessageFromContent(from, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: interactiveMsg
                        }
                    }
                }, { userJid: from, upload: sock.waUploadToServer });

                await sock.relayMessage(from, generatedMsg.message, {
                    messageId: generatedMsg.key.id
                });
                return true;
            } catch (e) {
                console.error(e);
                reply(`❌ Gagal kirim info baileys: ${e.message}`);
                return true;
            }
        }

        return false;
    }
};
