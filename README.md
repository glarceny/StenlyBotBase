# Stenly WhatsApp Bot Base

Base bot WhatsApp berbasis Node.js dan Baileys fork `@itsliaaa/baileys`. Proyek ini menyediakan koneksi WhatsApp dengan pairing code, command handler berbasis plugin, menu interaktif, dan pemuatan ulang plugin otomatis ketika file plugin berubah.

## Status Proyek

Proyek ini adalah base sederhana untuk pengembangan lebih lanjut. Fitur yang tersedia saat ini telah dipisahkan ke dalam plugin, tetapi belum dimaksudkan sebagai framework bot lengkap atau sistem produksi siap pakai.

## Fitur

- Pairing code WhatsApp.
- Mode `public` dan `self`.
- Menu interaktif berbasis kategori plugin.
- Command owner dan premium berbasis JSON lokal.
- Auto-load plugin dari folder `plugins/`.
- Hot-reload plugin saat file `.js` dibuat, diubah, atau dihapus.
- Helper serialisasi pesan dan utilitas umum.
- Aset thumbnail untuk menu interaktif.

## Persyaratan

- Node.js 18 atau lebih baru.
- npm.
- FFmpeg jika ingin menggunakan utilitas konversi media di `lib/converter.js`.
- Akun WhatsApp yang akan ditautkan sebagai perangkat companion.

## Instalasi

```bash
git clone <repository-url>
cd StenlyBotBase
npm install
npm start
```

Saat dijalankan tanpa session tersimpan, bot akan meminta nomor WhatsApp dalam format internasional, misalnya `628xxxxxxxxxx`, lalu menampilkan pairing code.

Untuk menjalankan tanpa prompt interaktif:

```bash
PAIRING_NUMBER=628xxxxxxxxxx node index.js
```

Atau:

```bash
node index.js 628xxxxxxxxxx
```

Setelah pairing berhasil, kredensial lokal disimpan di folder `session/`. Folder tersebut sengaja diabaikan oleh Git dan tidak boleh dibagikan.

## Command Saat Ini

Prefix default adalah `/` dan dapat diubah di `control/settings.js`.

### Main

- `/menu`
- `/allmenu`
- `/owner`
- `/sc`
- `/script`
- `/getsc`

### Owner

- `/addowner` atau `/addown`
- `/delowner` atau `/delown`
- `/addprem`
- `/delprem`
- `/public`
- `/self`
- `=> kode-javascript`
- `$ perintah-shell`

Bot juga memiliki trigger otomatis untuk kata yang berkaitan dengan Baileys, seperti `bail`, `baileys`, dan `npm`, ketika pesan tidak diawali prefix.

## Struktur Direktori

```text
.
├── control/
│   └── settings.js       # Konfigurasi global bot
├── lib/
│   ├── database/          # Daftar owner dan premium
│   ├── media/             # Aset gambar menu
│   ├── myfunc.js          # Helper dan serialisasi pesan
│   ├── color.js            # Helper warna terminal
│   ├── converter.js        # Konversi media dengan FFmpeg
│   └── plugins.js         # Registry dan watcher plugin
├── plugins/
│   ├── main/              # Menu, info owner, script, dan trigger Baileys
│   └── owner/             # Manajemen owner, premium, mode, dan command owner
├── index.js               # Entry point dan koneksi WhatsApp
└── stenly.js              # Core handler dan dispatcher plugin
```

## Menambah Plugin

Buat file JavaScript baru di dalam subfolder `plugins/`:

```javascript
module.exports = {
    name: "contoh",
    category: "info",
    command: ["contoh"],
    run: async ({ reply, args }) => {
        await reply(`Argumen: ${args.join(" ") || "tidak ada"}`);
    }
};
```

Plugin akan dimuat otomatis. Perubahan pada file plugin juga akan diambil tanpa restart bot. Jika plugin memiliki fitur hook tanpa command biasa, gunakan properti `menu` agar fitur tersebut ikut tampil di menu kategori:

```javascript
module.exports = {
    name: "contoh-hook",
    category: "info",
    menu: ["trigger otomatis"],
    before: async ({ body }) => {
        return false;
    }
};
```

## Konfigurasi

Edit `control/settings.js` untuk mengubah nama bot, prefix, versi, developer, dan owner utama. Daftar owner tambahan dan premium disimpan dalam:

- `lib/database/owner.json`
- `lib/database/premium.json`

Data tersebut adalah file lokal sederhana, bukan database multi-user.

## Menjalankan Dengan PM2

```bash
pm2 start index.js --name stenly-bot -- 628xxxxxxxxxx
pm2 save
```

Perintah `pm2 logs stenly-bot` dapat digunakan untuk melihat status koneksi dan aktivitas plugin.

## Catatan Lisensi dan Dependency

Kode base ini menggunakan dependency dari npm dan GitHub, termasuk fork `@itsliaaa/baileys`. Penggunaan, redistribusi, serta perubahan pada dependency pihak ketiga mengikuti lisensi dan ketentuan masing-masing proyek.

## Lisensi

Metadata proyek mencantumkan lisensi MIT. Periksa file dan dependency terkait sebelum melakukan redistribusi sebagai produk atau layanan komersial.
