---
title: "Bot-Mancing: Sistem Analisis Cuaca dan Identifikasi Spesies Secara Real-Time"
date: 2026-05-21T19:25:00+10:00
lastmod: 2026-05-23T01:05:00+10:00
tags: ["cloud", "vps", "jaringan", "sydney", "mancing"]
categories: ["dokumentasi"]
---

## Pendahuluan
### Latar Belakang
Sudah lebih dari tiga tahun saya menekuni hobi memancing. Berawal dari sekadar iseng saat piknik di pantai bersama keluarga dan teman-teman, hingga sampai akhirnya dua tahun terakhir ini memancing telah berubah menjadi sesuatu yang lebih mendalam. Memancing bukan lagi sekadar pengisi waktu luang, melainkan sebuah olahraga dan game-fishing.

Karena itu, fokus saya lebih dari sekedar pada perangkat pancing atau apparel yang tepat. Variabel lain seperti pengetahuan mendalam untuk membaca cuaca dan informasi jenis hasil tangkapan kini menjadi hal yang wajib diketahui.

Mengapa hal tersebut begitu krusial? Sebab, hampir seluruh aktivitas land-based game-fishing ini dilakukan di area tebing batu (rock/ledge) di sekitar Sydney. Medan seperti ini menyimpan risiko besar, sehingga keselamatan menjadi hal mendasar yang tidak bisa ditawar. Selain itu, regulasi memancing di New South Wales (NSW) sangatlah ketat, sementara beberapa spesies hasil tangkapan memiliki karakteristik yang sulit diidentifikasi secara visual. Dalam kondisi yang membutuhkan keputusan yang tepat seperti ini, kehadiran sebuah medium yang simpel, instan, dan akurat untuk menyajikan informasi mutlak diperlukan.

### Masalah

**Friksi Data Mentah**: Tantangan utama bagi saya adalah keharusan membuka berbagai platform mentah, seperti data teks atau grafik dari Bureau of Meteorology / BOM, kemudian dibandingkan dengan WillyWeather atau Fishing Point secara terpisah.

**Interpretasi Manual**: Saya sering kali kesulitan menginterpretasikan data tersebut secara cepat sebelum berangkat. Kelalaian dalam membaca anomali data, seperti potensi datangnya rogue waves (ombak liar) bisa berakibat fatal untuk saya.

### Solusi
**Jembatan Informasi Otomatis**: Proyek Bot-Mancing dibangun sebagai sistem otomasi analitik cuaca di pesisir Australia  yang menjembatani data cuaca mentah dan identifikasi spesies berbasis teks dan gambar ke WhatsApp secara on-demand.

**Decoupled Architecture**: Saya akan jelaskan secara terperinci dari sistem pemrosesan dibagian Breakdown Teknis dibawah. Namun, secara garis besar, sistem dipisahkan oleh empat fungsi pemrosesan yaitu:

1. **Messaging Gateway (Node.js)**: Bertindak sebagai pintu masuk instruksi teks (`/cek [lokasi]`) maupun interaksi berbasis gambar (`/spesies` + lampiran foto) dari WhatsApp. 

2. **Data Ingestion Engine (Python)**: Untuk menarik, menyaring, dan menyusun data maritim mentah.

3. **Data Cuaca (Open-Meteo API)**: Bertindak sebagai sumber data cuaca maritim secara real-time. API ini menyediakan metrik meteorologi yang saya butuhkan di area Sydney, seperti:
    - Kecepatan dan arah angin (Wind Speed & Direction)
    - Tinggi dan periode ombak (Swell Height & Period)
    - Suhu udara serta probabilitas hujan (Temperature &  Precipitation)
    - Barometic Pressure

4. **Generative AI**: Bertindak sebagai analisis ganda.Memanfaatkan Large Language Model (`Gemini-3-Flash`) untuk melakukan analisis prediktif, taktis, dan kontekstual dari data cuaca yang telah disusun oleh Python. Dan memanfaatkan kemampuan Computer Vision untuk memproses gambar/foto hasil tangkapan yang di upload oleh user secara real-time.

### Output
User cukup menggunakan WhatsApp untuk dua skenario utama:
1. **Skenario A**: Pemantauan Cuaca (`/cek [lokasi]`)  
Sistem langsung mengembalikan laporan cuaca, analisis gelombang, analisis keselamatan, hingga prediksi fish activity hour berdasarkan elongasi bulan terhadap bumi.

    ```Bash
    /cek manly
    ```
{{< collapse title="Output Cuaca" collapse="true" >}}
![2](/images/projects/bot-mancing/cuaca.jpg)
{{< /collapse >}}

2. **Skenario B**: Identifikasi Spesies (`/spesies` + Foto).  
User meng-upload-nya foto hasil tangkapan ke WhatsApp, dan mengetik caption:
    ```Bash
    /spesies
    ```
{{< collapse title="Output Identifikasi" collapse="true" >}}
![1](/images/projects/bot-mancing/spesies.jpg)
{{< /collapse >}}

## Breakdown Teknis
### Diagram Alur Data
Gambaran secara keseluruhan alur data outbound dan inbound dari aplikasi WhatsApp.  
{{< mermaid >}}
graph TD
    User[📱 WhatsApp User]
    Meta[🏢 Server Meta - WhatsApp API]

    subgraph VPS [⚡ VPS - Ubuntu Server OS]
        subgraph PM2 [🤖 PM2 Process Manager]
            NodeApp[🟢 NODE.JS - gateway.js]
            GuniMaster[🦄 Gunicorn Master - Port 5000]
            MainPy[🐍 LOGIKA UTAMA: main.py - Flask App]
        end
    end

    BOM[🌦️ Open-Meteo - Weather Data]
    Gemini[🧠 Gemini AI - Google AI API]

    User -->|1. Chat /cek /spesies| Meta
    Meta -->|2. WebSocket| NodeApp
    NodeApp -->|3. HTTP POST| GuniMaster
    GuniMaster -->|4. Assign Worker| MainPy
    MainPy -->|5. Request Cuaca| BOM
    BOM -->|6. Return Data| MainPy
    MainPy -->|7. Minta Analisis AI| Gemini
    Gemini -->|8. Return Teks AI| MainPy
    MainPy -->|9. Kirim Teks Hasil| NodeApp
    NodeApp -->|10. Kirim Balik| Meta
    Meta -->|11. Terima Hasil| User
{{< /mermaid >}}

### Messaging Gateway (Node.js)
1. **Import modul dan Dependensi**
```js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const axios = require("axios");
const pino = require("pino");
const fs = require("fs"); 
const path = require("path");
```
- `@whiskeysockets/baileys`: Ini library utama untuk interaksi dengan WhatsApp via WebSocket. Command ini mengimpor fungsi untuk membuat koneksi (`makeWASocket`), mengelola sesi (`useMultiFileAuthState`), membaca error (`DisconnectReason`), mengecek versi WA (`fetchLatestBaileysVersion`), dan mengunduh gambar (`downloadMediaMessage`).

- `@hapi/boom`: Library untuk penanganan error, digunakan untuk membaca status HTTP/koneksi.

- `axios`: HTTP Client untuk menembak API backend Python (http://127.0.0.1:5000/proses).

- `pino`: Modul logging. Digunakan di sini untuk menghentikan log bawaan Baileys agar terminal lebih bersih.

- `fs & path`: Modul bawaan Node.js untuk operasi berkas (File System) dan manipulasi jalur folder di VPS.

2. **Fungsi Utama**
```js
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    sock.ev.on('creds.update', saveCreds);
```
- `useMultiFileAuthState('auth_info')`: Fungsi ini membuat folder bernama auth_info. Di dalamnya tersimpan token autentikasi. Jika folder ini ada isinya, bot tidak perlu scan QR ulang saat dijalankan kembali.

- `fetchLatestBaileysVersion()`: Memastikan bot menggunakan versi protokol WhatsApp Web paling terakhir agar terhindar dari deteksi outdated browser oleh Meta.

- `makeWASocket({...})`: Membuat koneksi socket ke WhatsApp.

- `logger: pino({ level: 'silent' })`: Mematikan log internal Baileys. Karena Baileys bekerja menggunakan protokol WebSocket yang berkomunikasi dengan server WhatsApp hampir setiap detik, melakukan ping-pong data sehingga dapat memenuhi server. 

- `browser: [...]`: Kamuflase identitas server seolah-olah ini adalah browser Chrome yang berjalan di sistem operasi Ubuntu.

- `connectTimeoutMs & keepAliveIntervalMs`: Mengatur batas waktu tunggu koneksi (60 detik) dan menjaga koneksi tetap hidup (pinging) setiap 10 detik agar tidak diputus oleh server.

- `sock.ev.on('creds.update', saveCreds)`: Setiap kali WhatsApp memperbarui token, fungsi ini otomatis menyimpan perubahan tersebut ke dalam folder auth_info.

3. **Koneksi Log**
```js
sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Koneksi terputus di VPS. Mencoba hubungkan ulang:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ AMIS TOTAL! Pelayan Node.js di VPS sudah terhubung menggunakan sesi lokal.');
        }
    });
```
- `connection.update`: Event listener yang memantau apakah bot sedang terhubung, terputus, atau sedang menyinkronkan data.

- `if (connection === 'close')`: Jika koneksi terputus, sistem akan memeriksa alasannya menggunakan Boom.

- `shouldReconnect`: Logika boolean. Jika error-nya bukan karena akun di-logout secara sengaja (`DisconnectReason.loggedOut`), maka nilai variabel ini menjadi true.

- `if (shouldReconnect) startBot()`: Jika true, fungsi `startBot()` dipanggil kembali secara rekursif untuk menyambungkan ulang koneksi secara otomatis tanpa perlu intervensi manual.

4. **Tangkapan Pesan Masuk**
```js
sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        
        const mimeType = m.message.imageMessage?.mimetype || "image/jpeg";
        const remoteJid = m.key.remoteJid;
        
        const pesanText = m.message.conversation || 
                          m.message.extendedTextMessage?.text || 
                          m.message.imageMessage?.caption || ""; 
        
        const command = pesanText.toLowerCase();
```
- `messages.upsert`: Event yang terpicu setiap kali ada pesan baru masuk ke akun WhatsApp.

- `if (!m.message || m.key.fromMe) return;`: Struktur Guard Clause. Jika pesan kosong (misal sekadar notifikasi sistem) atau pesan tersebut dikirim oleh nomor bot itu sendiri, maka abaikan dan langsung keluar dari fungsi (early return).

- `pesanText Extraction`: Menggunakan teknik fallback (operator ||) untuk mengambil teks pesan:

- `conversation`: Jika pesan berupa teks biasa.

- `extendedTextMessage?.text`: Jika pesan berupa teks hasil reply atau teks berformat khusus.

- `imageMessage?.caption`: Jika teks dikirim sebagai caption yang menempel di bawah gambar.

- `command = pesanText.toLowerCase()`: Mengubah semua teks menjadi huruf kecil agar deteksi perintah bersifat case-insensitive (menghindari error jika user mengetik /CEK atau /Spesies).

5. **Jalur Pemrosesan Gambar (/spesies)**
```js
if (command.startsWith('/spesies')) {
            const isImage = !!m.message.imageMessage;
            
            if (!isImage) {
                return await sock.sendMessage(remoteJid, { text: "Mana fotonya Om? Kirim gambar terus kasih caption /spesies ya." });
            }

            console.log(`📸 Proses Analisa Spesies dari: ${remoteJid}`);
            
            try {
                const buffer = await downloadMediaMessage(m, 'buffer', {});
                
                const fileName = `img_${Date.now()}.jpg`;
                const filePath = path.join(__dirname, '../sesi-mancing', fileName);
                fs.writeFileSync(filePath, buffer);

                const response = await axios.post('http://127.0.0.1:5000/proses', {
                    text: pesanText,
                    image_path: filePath,
                    mime_type: mimeType,
                    sender: remoteJid
                });

                if (response.data.reply) {
                    await sock.sendMessage(remoteJid, { text: response.data.reply });
                }
            } catch (error) {
                console.error("⚠️ Gagal di Jalur Visual:", error.message);
                await sock.sendMessage(remoteJid, { text: "Waduh, server lagi pusing pas liat foto. Coba lagi Om!" });
            }
        }
```
- `if (command.startsWith('/spesies'))`: Memeriksa apakah teks diawali dengan kata `/spesies`.

- `const isImage = !!m.message.imageMessage`: Mengonversi objek gambar menjadi nilai boolean (true/false). Jika tidak ada objek gambar, sistem langsung mengirim pesan balasan peringatan.

- `downloadMediaMessage`: Mengunduh data biner gambar langsung dari server enkripsi WhatsApp ke memori server dalam bentuk buffer.

- `fs.writeFileSync(filePath, buffer)`: Menyimpan buffer tersebut menjadi file fisik `.jpg` di folder lokal VPS (`../sesi-mancing/`) dengan nama unik berbasis waktu milidetik (`img_1716...jpg`).

- `axios.post`: Mengirimkan paket data JSON ke backend Python Flask. Yang dikirim bukan file gambar utuhnya, melainkan hanya teks perintah dan string alamat file (`image_path`).

- `sock.sendMessage`: Menunggu jawaban dari Python (`response.data.reply`), lalu mengirimkan teks analisa spesies tersebut kembali ke WhatsApp.

6. **Jalur Pemrosesan Cuaca (/cek)**
```js
else if (command.startsWith('/cek')) {
            console.log(`📩 Pesan Cuaca: ${pesanText}`);
            try {
                const response = await axios.post('http://127.0.0.1:5000/proses', {
                    text: pesanText,
                    sender: remoteJid
                });

                if (response.data.reply) {
                    await sock.sendMessage(remoteJid, { text: response.data.reply });
                }
            } catch (error) {
                console.error("⚠️ Gagal di Jalur Cuaca:", error.message);
            }
        }
    });
}
```
- `else if (command.startsWith('/cek'))`: Jika pesan tidak mengandung kata `/spesies` melainkan diawali dengan kata `/cek` (misal: `/cek manly`), maka jalur ini yang dieksekusi.

- `axios.post` tanpa `image_path`: Karena ini murni perintah teks, payload JSON yang dikirim ke Python hanya berisi parameter text dan sender.

- Response Handling: Sama seperti Jalur Pemrosesan Gambar, hasil kompilasi data cuaca dari Python langsung dialirkan kembali ke user via WhatsApp.

7. **Eksekusi Bootstrap**
```js
console.log("🚀 Menjalankan Pelayan Node.js di VPS...");
startBot();
```
Dua baris terakhir ini bertindak sebagai pemicu utama (bootstrap). Begitu PM2 menjalankan file `gateway.js`, pesan teks ini akan dicetak ke konsol log dan fungsi utama `startBot()` langsung dieksekusi untuk membuka gerbang socket ke server WhatsApp.