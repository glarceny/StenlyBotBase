// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const { generateWAMessageFromContent, prepareWAMessageMedia } = require("@itsliaaa/baileys");

module.exports = {
    name: "sc",
    category: "main",
    command: ["sc", "script", "getsc"],
    description: "Dapatkan tautan source code bot",
    run: async (context) => {
        const { sock, from, thumb, reply } = context;

        const sc = "";
        const anu = `*klik tombol get sc untuk mendapatkan source code script base bot WhatsApp ini*`;

        try {
            const media = await prepareWAMessageMedia(
                { image: thumb, mimetype: 'image/jpeg' },
                { upload: sock.waUploadToServer }
            );

            const interactiveMsg = {
                body: { text: sc },
                footer: { text: anu },
                header: {
                    hasMediaAttachment: true,
                    imageMessage: media.imageMessage
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "get sc",
                                url: "https://github.com/glarceny/StenlyBotBase",
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

            return await sock.relayMessage(from, generatedMsg.message, {
                messageId: generatedMsg.key.id
            });
        } catch (e) {
            console.error(e);
            return reply(`❌ Gagal kirim pesan: ${e.message}`);
        }
    }
};
