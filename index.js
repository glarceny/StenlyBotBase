 
// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

require('./control/settings');
const {
default: makeWASocket,
prepareWAMessageMedia,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion,
makeInMemoryStore,
jidDecode,
downloadContentFromMessage,
makeCacheableSignalKeyStore
} = require("@itsliaaa/baileys");
const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const chalk = require("chalk");
const { smsg, getBuffer, getSizeMedia } = require('./lib/myfunc');

const usePairingCode = true;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise(resolve => rl.question(text, resolve));

const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });

async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState("./session");
const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({
version,
printQRInTerminal: !usePairingCode,
browser: ["Ubuntu", "Chrome", "20.0.04"],
logger: pino({ level: 'silent' }),
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
}
});

const client = sock
const conn = client


sock.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
const decode = jidDecode(jid) || {}
return decode.user && decode.server ? decode.user + '@' + decode.server : jid
}
return jid
}

store.bind(sock.ev);

if (usePairingCode && !sock.authState.creds.registered) {
    setTimeout(async () => {
        try {
            const rawNumber = process.env.PAIRING_NUMBER || process.argv[2] || await question(`\nSilahkan masukkan nomor (628xxx):\n`);
            const phoneNumber = String(rawNumber).replace(/[^0-9]/g, '');
            if (!phoneNumber) {
                console.log(chalk.red("Nomor WhatsApp tidak ditemukan untuk pairing code!"));
                return;
            }
            console.log(chalk.yellow(`Meminta pairing code untuk nomor: ${phoneNumber}...`));
            let code;
            try {
                code = await sock.requestPairingCode(phoneNumber, "ITSLIAAA");
            } catch (e) {
                console.log(chalk.yellow("Custom pairing code gagal, mencoba code otomatis..."));
                code = await sock.requestPairingCode(phoneNumber);
            }
            console.log(chalk.bold.green("\n================================="));
            console.log(chalk.bold.blue("PAIRING CODE: ") + chalk.bold.white.bgBlue(` ${code} `));
            console.log(chalk.bold.green("=================================\n"));
        } catch (err) {
            console.error(chalk.red("Gagal meminta pairing code:"), err);
        }
    }, 4000);
}

sock.ev.on('messages.upsert', async ({ messages }) => {
try {
    const mek = messages[0];
    if (!mek.message) return;
    if (mek.key.remoteJid === 'status@broadcast') return;

    const m = smsg(sock, mek, store);
    if (!m) return;

    const isCreator = [sock?.user?.id,...(global.owner || [])]
       .map(v => v.replace(/[^0-9]/g,'')+'@s.whatsapp.net')
       .includes(m.sender);

    if (!sock.public &&!mek.key.fromMe &&!isCreator) return;
    if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
    if (mek.key.id.startsWith('Stenly')) return;

    require("./stenly")(sock, m, store);

} catch (e) {
    console.log(e);
}
});

sock.public = true

sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
if (connection === 'open') {
console.log(chalk.green("==> BOT BERHASIL TERHUBUNG KE WHATSAPP! <=="));
}
if (connection === 'close') {
console.log(chalk.yellow("Koneksi terputus:"), lastDisconnect?.error?.message || lastDisconnect?.error);
if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
connectToWhatsApp();
}
}
});

sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();
