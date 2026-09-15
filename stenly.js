// ===================================================
//  Stenly WhatsApp Bot - Modular Core Handler
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

require('./control/settings');
const fs = require('fs');
const sharp = require('sharp');
const util = require('util');
const { spawn, exec, execSync } = require('child_process');
const plugins = require('./lib/plugins');

const {
    default: baileys,
    proto,
    generateWAMessage,
    generateWAMessageFromContent,
    getContentType,
    prepareWAMessageMedia,
    areJidsSameUser
} = require("@itsliaaa/baileys");

const { 
    smsg,
    sendGmail,
    formatSize,
    isUrl,
    generateMessageTag,
    getBuffer,
    getSizeMedia,
    runtime,
    fetchJson,
    sleep,
    processTime,
    getTime,
    tanggal,
    parseMention
} = require('./lib/myfunc');

plugins.initPlugins();

let cachedThumb = null;
async function getThumbnail() {
    try {
        if (!cachedThumb && fs.existsSync('./lib/media/menu.png')) {
            cachedThumb = await sharp('./lib/media/menu.png')
                .resize(300, 300)
                .jpeg({ quality: 80 })
                .toBuffer();
        }
        return cachedThumb;
    } catch (_) {
        return null;
    }
}

function formatSubs(count) {
    if (!count || count === 0) return '0';
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(count);
}

function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = async (sock, m, chatUpdate, store) => {
    try {
        const body = (
            m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson || '{}').id :
            m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
            m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text : ""
        ) || "";

        const premium = JSON.parse(fs.readFileSync("./lib/database/premium.json"));
        const OWNER_PATH = "./lib/database/owner.json";
        const sender = m.key.fromMe
            ? sock.user.id.split(":")[0] || sock.user.id
            : m.key.participant || m.key.remoteJid;
        const normalizeAccessJid = value => {
            const jid = String(value || "").replace(/:\d+(?=@)/, "");
            if (jid.endsWith("@lid")) return jid;
            if (jid.includes("@")) return jid;
            const number = jid.replace(/[^0-9]/g, "");
            return number ? `${number}@s.whatsapp.net` : "";
        };
        let accessSender = normalizeAccessJid(sender);
        if (accessSender.endsWith("@lid") && sock?.signalRepository?.lidMapping?.getPNForLID) {
            try {
                accessSender = normalizeAccessJid(await sock.signalRepository.lidMapping.getPNForLID(accessSender) || accessSender);
            } catch (_) {}
        }
        const senderNumber = sender.split('@')[0];
        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefix = global.prefix || '/';
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const isChannel = from.endsWith("@newsletter");
        const botNumber = await sock.decodeJid(sock.user.id);
        const normalizeJid = jid => sock.decodeJid(String(jid || '')).replace(/:\d+(?=@)/, '');
        const jidUser = jid => normalizeJid(jid).split('@')[0].replace(/[^0-9]/g, '');
        const asUserJid = value => {
            const clean = normalizeJid(value);
            if (!clean) return '';
            if (clean.includes('@')) return clean;
            const number = clean.replace(/[^0-9]/g, '');
            return number ? number + '@s.whatsapp.net' : '';
        };

        const ownerbot = JSON.parse(fs.readFileSync(OWNER_PATH));
        const sameAccessJid = value => normalizeAccessJid(value) === accessSender;
        const isPremium = premium.some(sameAccessJid);
        const isOwner = ownerbot.some(sameAccessJid);
        const isCreator = [botNumber, ...global.owner].some(sameAccessJid);
        const bodyTrim = (body || '').trim();
        const prefixMatch = bodyTrim.startsWith(prefix) ? prefix : null;
        let command = '';
        let args = [];

        if (prefixMatch) {
            const prefixChar = prefixMatch[0];
            const withoutPrefix = bodyTrim.slice(prefixChar.length).trim();
            const parts = withoutPrefix.split(/ +/);
            command = parts.shift().toLowerCase() || '';
            args = parts;
        } else {
            const parts = bodyTrim.split(/ +/);
            command = parts.shift().toLowerCase() || '';
            args = parts;
        }

        const pushname = m.pushName || "no name";
        const text = args.join(" ");
        const q = text;
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const isMedia = /image|video|sticker|audio/.test(mime);
        const groupMetadata = isGroup ? await sock.groupMetadata(m.chat).catch(() => {}) : "";
        const groupOwner = isGroup ? groupMetadata?.owner : "";
        const groupName = isGroup ? groupMetadata?.subject : "";
        const participants = isGroup ? (groupMetadata?.participants || []) : [];
        const groupAdminParticipants = isGroup ? participants.filter((v) => v.admin !== null) : [];
        const groupAdmins = groupAdminParticipants.map(v => v.id);
        const groupMembers = isGroup ? groupMetadata?.participants : [];
        const isGroupAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
        const botLid = isGroup ? sock.user?.lid : "";
        const sameUser = (a, b) => {
            if (!a || !b) return false;
            try {
                return areJidsSameUser(a, b);
            } catch (_) {
                return false;
            }
        };
        const isBotGroupAdmins = isGroup ? groupAdminParticipants.some(participant => {
            return sameUser(participant.id, botNumber) ||
                sameUser(participant.phoneNumber, botNumber) ||
                sameUser(participant.id, botLid) ||
                sameUser(participant.phoneNumber, botLid);
        }) : false;
        const isBotAdmins = isBotGroupAdmins;
        const isAdmins = isGroupAdmins;

        const reply = (teks) => {
            return sock.sendMessage(m.chat, { text: teks }, { quoted: m });
        };

        if (!sock.public && !isCreator) return;

        const thumb = await getThumbnail();
        const botName = global.botname || "itsliaaa baileys base";
        const botVersion = global.botversion || "v1.0";
        const botDev = global.botdev || "Stenly Christian";
        const botCategory = global.botcategory || 1;
        const totalCommands = global.totalcmd || plugins.countCommands();
        const memoryUsage = `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`;

        const context = {
            sock,
            m,
            chatUpdate,
            store,
            body,
            budy,
            prefix,
            command,
            args,
            text,
            q,
            quoted,
            mime,
            qmsg,
            isMedia,
            from,
            sender,
            senderNumber,
            botNumber,
            pushname,
            isGroup,
            isChannel,
            groupMetadata,
            groupOwner,
            groupName,
            participants,
            groupAdmins,
            groupMembers,
            isGroupAdmins,
            isBotGroupAdmins,
            isBotAdmins,
            isAdmins,
            isOwner,
            isCreator,
            isPremium,
            reply,
            thumb,
            botName,
            botVersion,
            botDev,
            botCategory,
            totalCommands,
            memoryUsage,
            formatSubs,
            formatDate,
            runtime,
            getBuffer,
            getSizeMedia,
            fetchJson,
            sleep,
            processTime,
            getTime,
            tanggal,
            parseMention,
            sendGmail,
            isUrl,
            generateMessageTag,
            baileys,
            proto,
            generateWAMessage,
            generateWAMessageFromContent,
            getContentType,
            prepareWAMessageMedia,
            sharp,
            exec,
            spawn,
            fs,
            plugins
        };

        const handledBefore = await plugins.runBefore(context);
        if (handledBefore) return;

        if (command) {
            const plugin = plugins.findPlugin(command);
            if (plugin && typeof plugin.run === 'function') {
                if (plugin.premium && !isPremium && !isCreator && !isOwner) {
                    return reply("*Fitur ini khusus user premium dan owner!*");
                }
                if (plugin.owner && !plugin.premium && !isCreator && !isOwner) {
                    return reply("*khusus owner!*");
                }
                if (plugin.group && !isGroup) {
                    return reply("*khusus grup!*");
                }
                if (plugin.admin && !isGroupAdmins) {
                    return reply("*khusus admin grup!*");
                }
                await plugin.run(context);
            }
        }
    } catch (err) {
        console.error(util.format(err));
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
