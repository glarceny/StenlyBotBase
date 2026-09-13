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
        const { sock, from, pushname, thumb, reply } = context;

        const sc = `\n> *halo ${pushname}, apakah kamu ingin base script ini?*`;
        const anu = `
jika kamu menginginkan base script ini silahkan klik tombol di bawah ini

\`rulles\`
- dilarang keras menghapus credits minimal taro di tqto
- dilarang memperjual belikan base ini karena 100% free
- boleh di jual dengan syarat sudah di tambah fitur
- dilarang mengklaim script ini 100%
`.trim();

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
                                url: "https://github.com/itsliaaa/baileys",
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
