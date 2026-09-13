const fs = require("fs");

function normalizeJid(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.includes("@")) return raw.replace(/:\d+(?=@)/, "");
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return (digits.startsWith("0") ? `62${digits.slice(1)}` : digits) + "@s.whatsapp.net";
}

function getMentionedJids(m) {
    const context = m?.msg?.contextInfo || {};
    const messageContext = m?.message?.extendedTextMessage?.contextInfo || {};
    return [
        ...(Array.isArray(m?.mentionedJid) ? m.mentionedJid : []),
        ...(Array.isArray(context.mentionedJid) ? context.mentionedJid : []),
        ...(Array.isArray(messageContext.mentionedJid) ? messageContext.mentionedJid : [])
    ];
}

async function resolveTarget(sock, m, args, text, groupMetadata) {
    const mentioned = getMentionedJids(m);
    if (mentioned.length) {
        const mentionedJid = normalizeJid(mentioned[0]);
        if (mentionedJid.endsWith("@lid") && sock?.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const mapped = await sock.signalRepository.lidMapping.getPNForLID(mentionedJid);
                if (mapped) return normalizeJid(mapped);
            } catch (_) {}
        }
        const participant = groupMetadata?.participants?.find(item => {
            return normalizeJid(item.id) === mentionedJid || normalizeJid(item.phoneNumber) === mentionedJid;
        });
        if (participant) return normalizeJid(participant.phoneNumber || participant.id);

        if (mentionedJid.endsWith("@s.whatsapp.net")) return mentionedJid;
    }
    const rawText = String(text || "");
    const mentionText = rawText.match(/@(\d{8,16})/);
    if (mentionText && sock?.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const mapped = await sock.signalRepository.lidMapping.getPNForLID(`${mentionText[1]}@lid`);
            if (mapped) return normalizeJid(mapped);
        } catch (_) {}
    }
    const token = args?.[0] || mentionText?.[1] || rawText.trim().split(/\s+/)[0];
    return normalizeJid(token);
}

function readList(filePath) {
    try {
        const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return Array.isArray(value) ? value : [];
    } catch (_) {
        return [];
    }
}

function writeList(filePath, values) {
    fs.writeFileSync(filePath, JSON.stringify([...new Set(values)], null, 2));
}

async function verifyWhatsAppNumber(sock, jid) {
    if (!jid) return false;
    try {
        const result = await sock.onWhatsApp(jid);
        return Array.isArray(result) && result.some(item => item?.exists === true || item?.jid);
    } catch (_) {
        return false;
    }
}

module.exports = {
    normalizeJid,
    resolveTarget,
    readList,
    writeList,
    verifyWhatsAppNumber
};
