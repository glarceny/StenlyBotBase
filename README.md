# StenlyBotBase

Base bot WhatsApp yang saya pakai untuk mulai mengembangkan bot dengan Node.js dan Baileys.

Fitur yang sudah ada masih sederhana:

- Pairing code WhatsApp.
- Menu interaktif.
- Mode public dan self.
- Owner dan premium dari file JSON.
- Sistem plugin.
- Plugin bisa ditambah atau diedit tanpa restart bot.

## Install

```bash
git clone https://github.com/glarceny/StenlyBotBase.git
cd StenlyBotBase
npm install
npm start
```

Saat pertama kali dijalankan, masukkan nomor WhatsApp dengan format seperti ini:

```text
628xxxxxxxxxx
```

Nomor juga bisa langsung diberikan lewat command:

```bash
node index.js 628xxxxxxxxxx
```

atau:

```bash
PAIRING_NUMBER=628xxxxxxxxxx node index.js
```

Setelah berhasil terhubung, session akan tersimpan di folder `session/`. Folder tersebut tidak ikut masuk repository.

## Command

Prefix default: `/`

```text
/menu
/allmenu
/owner
/sc
/script
/getsc

/addowner 628xxx
/addown 628xxx
/delowner 628xxx
/delown 628xxx
/addprem 628xxx
/delprem 628xxx
/public
/self
/crm
/crm -snipp
```

Command owner tambahan:

```text
=> kode-javascript
$ perintah-shell
```

Pengaturan utama ada di `control/settings.js`.

`/crm` dan `/crm -snipp` membutuhkan akses premium atau owner dan harus digunakan sambil reply pesan.

## Plugin

Plugin ada di folder `plugins/`. Saat ini contohnya:

```text
plugins/
├── main/
└── owner/
```

Contoh plugin sederhana:

```javascript
module.exports = {
    name: "contoh",
    category: "info",
    command: ["contoh"],
    run: async ({ reply, args }) => {
        await reply(args.join(" ") || "Halo");
    }
};
```

Simpan file tersebut sebagai `plugins/info/contoh.js`. Plugin akan terdeteksi otomatis, dan kategori `Info Menu` akan muncul di `/menu`.

Kalau file plugin diedit atau dihapus, perubahan akan diproses oleh plugin watcher tanpa restart bot.

Kalau plugin baru belum muncul, cek log bot dan pastikan file tersebut berekstensi `.js` serta berada di dalam subfolder `plugins/`.

## Kalau Pairing Gagal

Hapus folder `session/` hanya jika ingin melakukan pairing ulang, lalu jalankan bot lagi. Kalau session masih ada, bot akan langsung mencoba memakai session tersebut dan tidak akan meminta nomor baru.

## Struktur Singkat

```text
control/settings.js  konfigurasi bot
index.js             koneksi WhatsApp
stenly.js            handler pesan
lib/plugins.js       loader dan watcher plugin
plugins/             fitur-fitur bot
lib/database/        owner.json dan premium.json
lib/media/            gambar menu
```

## PM2

Kalau ingin menjalankan bot di background:

```bash
pm2 start index.js --name stenly-bot -- 628xxxxxxxxxx
pm2 save
```

Lihat log dengan:

```bash
pm2 logs stenly-bot
```

## Catatan

Ini masih berupa base bot, bukan bot dengan banyak fitur siap pakai. Beberapa utilitas media membutuhkan FFmpeg. Dependency utama Baileys menggunakan fork `@itsliaaa/baileys`.

## Kontribusi

Simpan fitur baru sebagai plugin di dalam `plugins/`, jalankan pengecekan syntax sebelum push, dan sertakan penjelasan singkat di pull request.

```bash
node --check plugins/path/fitur.js
```

Lisensi proyek: MIT.
