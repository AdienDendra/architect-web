---
title: "Bot-Mancing: Sistem Analisis Cuaca dan Identifikasi Spesies Secara Real-Time"
date: 2026-05-21T19:25:00+10:00
lastmod: 2026-05-24T22:36:00+10:00
tags: ["cloud", "vps", "jaringan", "sydney", "mancing"]
categories: ["dokumentasi"]
mermaid: true
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

**Decoupled Architecture**: Saya akan jelaskan secara terperinci dari sistem pemrosesan dibagian Metode dan Kode dibawah. Namun, secara garis besar, sistem dipisahkan oleh dua fungsi pemrosesan yaitu:

1. **Messaging Gateway (Node.js)**: Bertindak sebagai pintu masuk instruksi teks (`/cek [lokasi]`) maupun interaksi berbasis gambar (`/spesies` + lampiran foto) dari WhatsApp. 

2. **Data Ingestion Engine (Python)**: Untuk menarik, menyaring, dan menyusun data dari **Open-Meteo API** dan **Generative AI**.  
    - **Open-Meteo** bertindak sebagai sumber data cuaca maritim secara real-time, API ini menyediakan metrik meteorologi yang saya butuhkan seperti kecepatan angin, periode ombak, temperatur udara dll.  
    - **Generative AI** bertindak sebagai analisis ganda, memanfaatkan Large Language Model untuk melakukan analisis prediktif, taktis, dan kontekstual dari data cuaca dan memanfaatkan Computer Vision untuk memproses foto dari hasil tangkapan yang di upload oleh user secara real-time

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

## Metode dan Kode
### Diagram Alur Data
Gambaran secara keseluruhan alur data outbound dan inbound dari aplikasi WhatsApp.

{{< mermaid >}}
graph TD
    %% Define Styles
    classDef user fill:#1f1f1f,stroke:#fff,stroke-width:2px,color:#fff;
    classDef meta fill:#00a884,stroke:#fff,stroke-width:1px,color:#fff;
    classDef nodejs fill:#339933,stroke:#fff,stroke-width:1px,color:#fff;
    classDef guni fill:#ed217c,stroke:#fff,stroke-width:1px,color:#fff;
    classDef python fill:#3776AB,stroke:#fff,stroke-width:1px,color:#fff;
    classDef external fill:#232F3E,stroke:#fff,stroke-width:1px,color:#fff;

    %% === LAPIS 1: USER PLATFORM (ATAS) ===
    subgraph USER_SPACE ["📱 Messaging Platform"]
        User["📱 WHATSAPP USER<br>(Kirim /cek atau /spesies)"]:::user
        Meta["🏢 SERVER META<br>(WhatsApp API Cloud)"]:::meta
    end

    %% === LAPIS 2: INFRASTRUKTUR SERVER (TENGAH) ===
    subgraph VPS ["⚡ VPS Ubuntu Server OS — 🤖 PM2 Process Manager"]
        NodeApp["🟢 MESSAGING GATEWAY<br>(Node.js - gateway.js)"]:::nodejs
        GuniMaster["🦄 GUNICORN WSGI<br>(Port 5000 Proxy)"]:::guni
        MainPy["🐍 DATA INGESTION ENGINE<br>(Python - Flask App)"]:::python
    end

    %% === LAPIS 3: EXTERNAL API SERVICES (BAWAH) ===
    subgraph API_SPACE ["🌐 Third-Party Cloud Services"]
        BOM["🌦️ OPEN-METEO<br>(Weather & Marine Data API)"]:::external
        Gemini["🧠 GEMINI AI<br>(Google AI API Engine)"]:::external
    end

    %% === FLOW ALUR MASUK (DOWNWARD FLOW) ===
    User -->|1. Chat /cek /spesies| Meta
    Meta -->|2. WebSocket Connection| NodeApp
    NodeApp -->|3. HTTP POST Payload| GuniMaster
    GuniMaster -->|4. Assign Worker Process| MainPy
    
    %% === INTERAKSI API DI LEVEL BAWAH ===
    MainPy -->|5. Request Cuaca Laut| BOM
    BOM -.->|6. Return JSON Data| MainPy
    MainPy -->|7. Minta Analisis Taktis| Gemini
    Gemini -.->|8. Return Teks AI| MainPy
    
    %% === FLOW ALUR BALIK (UPWARD RETURN FLOW) ===
    MainPy -->|9. Kirim Teks Hasil Analisis| NodeApp
    NodeApp -->|10. Kirim Balik via Socket| Meta
    Meta -->|11. Terima Hasil Laporan| User

    %% Style untuk Tiga Box Subgraph
    style USER_SPACE fill:#141b24,stroke:#00a884,stroke-width:1px,color:#fff
    style VPS fill:#1a2332,stroke:#1473e6,stroke-width:2px,color:#fff
    style API_SPACE fill:#141b24,stroke:#f38020,stroke-width:1px,color:#fff

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

### Data Ingestion Engine (Python)
1. **Impor Modul dan Dependensi**
```python
import os
import re

from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from dateutil import parser
from google import genai
from geopy.geocoders import Nominatim
from dotenv import load_dotenv

from config import LUNAR_ANCHOR
from ai_analisis import generate_analisis_cuaca, generate_analisis_spesies
from data_cuaca import get_astronomy_data, get_coordinates_data, get_weather_data
```
- `os` & `re`: Modul bawaan Python. os dipakai untuk mengambil API Key dari sistem, sedangkan `re` (Regular Expression) dipakai untuk mendeteksi angka tanggal (seperti angka 240526) di dalam chat user.
- `flask`: Framework utama yang bertindak sebagai jaringan. Flask untuk membuat server, request untuk menangkap kiriman `JSON` dari `Node.js`, dan `jsonify` untuk membungkus balasan teks menjadi format `JSON` kembali.
- `datetime`, `timedelta`, `dateutil.parser`: Modul pengolah waktu. Dipakai untuk menghitung tanggal hari ini, mengubah teks menjadi objek waktu, dan menghitung tanggal esok hari secara akurat.
- `google.genai`: SDK resmi Google Gemini untuk mengakses model AI (Gemini-3-Flash dll).
- `geopy.geocoders (Nominatim)`: Modul mesin peta (`OpenStreetMap`) untuk mengubah ketikan nama tempat dari user (misal: "Dee Why") menjadi titik koordinat garis lintang dan bujur (Latitude/Longitude).
- `load_dotenv`: Modul untuk membaca file .env tempat menyimpan API Key agar tidak terekspos di kodingan utama.
- `config` & `ai_analisis` & `data_cuaca`: Modul kustom buatan saya sendiri untuk memisahkan logika hitung ombak, ambil data dari Open-Meteo, dan logika prompt Gemini di file terpisah agar file `main.py` ini tidak kepanjangan.

2. **Inisialisasi Konfigurasi Global**
```python
# Load file .env secara otomatis
load_dotenv()

NAMA_HARI = {
    "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu",
    "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu", "Sunday": "Minggu"
}

NAMA_BULAN = {
    "January": "Januari", "February": "Februari", "March": "Maret", "April": "April",
    "May": "Mei", "June": "Juni", "July": "Juli", "August": "Agustus",
    "September": "September", "October": "Oktober", "November": "November", "December": "Desember"
}

LUNAR_ANCHOR = datetime(*LUNAR_ANCHOR)

app = Flask(__name__)

# Setup Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("❌ Kunci Gemini tidak ditemukan di file .env!")
client = genai.Client(api_key=API_KEY)

# Setup Geocoder
geolocator = Nominatim(user_agent="bot_mancing_sydney_pro_adien")
```
- `NAMA_HARI` & `NAMA_BULAN`: Dictionary kustom hardcoded untuk menerjemahkan format waktu bawaan server yang berbahasa Inggris menjadi bahasa Indonesia.

- `LUNAR_ANCHOR`: Menetapkan tanggal patokan fase bulan baru (diambil dari `config.py`) dan mengubahnya menjadi format objek waktu `datetime` untuk kalkulasi rumus pasang surut.

- `app = Flask(__name__)`: Menyalakan engine framework Flask.

- `genai.Client(...)`: Membuka koneksi ke Google Gemini menggunakan API Key yang sudah diverifikasi. Jika kunci kosong, server akan berhenti (`ValueError`) agar saya tahu ada konfigurasi yang kurang di .env.

- `Nominatim(user_agent=...)`: Mendaftarkan nama aplikasi yang saya buat ke server `OpenStreetMap` agar diberi izin gratis untuk mencari koordinat lokasi.

3. **Fungsi Laporan Cuaca (`buat_laporan`)**  
Fungsi ini semacam pabrik internal, dimana seluruh data cuaca, ombak, angin, dan pasang surut di area Australia dirakit menjadi satu laporan utuh sebelum diserahkan ke Gemini.
```python
def buat_laporan(lat, lon, lokasi, target_dt, jam_mulai, jam_selesai):
    try:
        # 1. AMBIL DATA (Sudah include dynamic ocean discovery)
        marine, weather, tide_data, f_lat, f_lon = get_weather_data(lat, lon)     

        if not weather or 'hourly' not in weather:
            return f"❌ Maaf Om, data cuaca untuk {lokasi} tidak bisa diakses saat ini."

        # 2. CARI INDEX TANGGAL SECARA DINAMIS (Anti-Hardcode Timezone)
        target_date_str = target_dt.strftime("%Y-%m-%d")
        all_times = weather['hourly']['time']
        start_idx = next((i for i, t in enumerate(all_times) if t.startswith(target_date_str)), -1)

        if start_idx == -1:
            return f"❌ Data untuk tanggal {target_date_str} belum tersedia, Om."

        # 3. FLAG DATA MARINE
        marine_is_missing = 'hourly' not in marine or not marine['hourly'].get('wave_height')
```

- `get_weather_data(lat, lon)`: Mengambil fungsi di file kustom yang saya buat, untuk mengambil data mentah `JSON` dari Open-Meteo API (cuaca darat & cuaca maritim laut) serta data ramalan pasang surut.

- `start_idx = next(...)`: Trik dinamis untuk mencari tahu di deretan baris array nomor keberapa data tanggal yang diminta user itu berada. Ini membuat server anti-salah jadwal meskipun ada selisih waktu antara jam VPS (USA) dengan jam di Sydney.

- `marine_is_missing`: Pengaman darurat (Fallback Mechanism). Jika Open-Meteo maritim mendadak down atau lokasi yang diketik user adalah area daratan murni yang tidak punya data tinggi ombak, variabel ini bernilai `True` agar sistem tidak crash dan mengganti kolom ombak menjadi teks "N/A".

4. **Logika Kondisional Per Jam**
```py
# 6. LOOPING DATA PER JAM
        data_points = ""
        count = 0
        for i in range(24):
            idx = start_idx + i
            if idx >= len(all_times): break
            
            waktu_lokal = parser.isoparse(all_times[idx])
            jam = waktu_lokal.hour

            if jam_mulai <= jam <= jam_selesai:
                wind = weather['hourly']['wind_speed_10m'][idx]
                temp = weather['hourly']['temperature_2m'][idx]
                pres = weather['hourly']['surface_pressure'][idx]
                prec_prob = weather['hourly']['precipitation_probability'][idx]
                prec = weather['hourly']['precipitation'][idx]

                # Marine Data (Dinamis N/A)
                if not marine_is_missing and idx < len(marine['hourly']['wave_height']):
                    wv = f"{marine['hourly']['wave_height'][idx]:.2f}"
                    sw = f"{marine['hourly']['swell_wave_height'][idx]:.2f}"
                    swp = f"{marine['hourly']['swell_wave_period'][idx]:.1f}"
                else:
                    wv = sw = swp = "N/A"

                # --- DATA TIDE (Pasang Surut) ---
                if tide_data and idx < len(tide_data):
                    current_t = tide_data[idx]
                    prev_t = tide_data[idx-1] if idx > 0 else current_t
                    
                    if current_t > prev_t:     tren = "📈" # Naik (Flow)
                    elif current_t < prev_t:   tren = "📉" # Surut (Ebb)
                    else:                      tren = "↔️" # Flat (Slack)
                    
                    tide_val = f"{current_t:.2f}m {tren}"
                else:
                    tide_val = "N/A"

                # Rain Icon Logic
                if prec_prob == 0:     rain_status = "☀️"
                elif prec_prob <= 30:  rain_status = "🌤️"
                elif prec_prob <= 70:  rain_status = "🌦️"
                else:                  rain_status = "⛈️" if prec > 5 else "🌧️"
```
- `if jam_mulai <= jam <= jam_selesai`: Filter penyeleksi jam. Data cuaca 24 jam dari Open-Meteo disaring hanya diambil dari jam 4 pagi sampai jam 8 malam saja (waktu yang digunakan biasanya untuk memancing). Langkah ini sukses memangkas ukuran token teks kiriman ke Gemini.

- Logika Tren Pasang Surut (`tide_data`): Sistem membandingkan data ketinggian air jam sekarang (`current_t`) dengan data air satu jam sebelumnya (`prev_t`). Jika angka sekarang lebih besar, otomatis diberi ikon naik 📈. Jika lebih kecil, diberi ikon surut 📉.

- Rain Icon Logic: Logika untuk mengkonversi angka probabilitas hujan menjadi ikon visual emoji WhatsApp secara otomatis agar teks laporan lebih enak dipandang oleh mata.

5. **Sintesis Akhir dan Pemanggilan AI**
```py
# Panggil fungsi AI yang baru
        analisa_teks, model_aktif = generate_analisis_cuaca(
            client, lokasi, tgl_str, data_points
        )
        
        # Gabungkan semua untuk dikirim ke WA
        footer = f"\n\n*--- ANALISA TANTE GEMINI ({model_aktif}) ---*\n"
        pesan_final = f"{header}{data_points}{footer}{analisa_teks}"
        
        return pesan_final

    except Exception as e:
        return f"⚠️ Gagal memproses data: {str(e)}"
```
- `generate_analisis_cuaca(...)`: Seluruh string ringkasan data cuaca per jam yang sudah disusun rapi tadi ke Gemini AI untuk dimintai opininya mengenai kelayakan memancing di spot tersebut.

- `pesan_final`: Menggabungkan teks Header (waktu memancing & aktivitas ikan), teks Data Poin per jam, dan teks Hasil Analisis Gemini menjadi satu kesatuan string utuh untuk di-return balik menuju `Node.js`.

6. **Gateway Webhook `/proses` (HTTP POST Endpoint) dan Penerimaan Data Inbound**  
Bagian ini bertindak sebagai pintu masuk yang melayani kiriman paket data `JSON` dari Axios `Node.js`.  
```py
@app.route('/proses', methods=['POST'])
def proses_pesan():
    data = request.json
    raw_text = data.get('text', '').strip()
    text_lower = raw_text.lower()
    image_path = data.get('image_path')
```
- `@app.route('/proses', methods=['POST'])`: Membuka gerbang URL di server dengan alamat http://vps-ip:5000/proses khusus untuk menerima metode kiriman HTTP POST.
- `data = request.json`: Flask membongkar paket kiriman `JSON` yang diberikan oleh Axios `Node.js` dan mengubahnya menjadi objek dictionary Python.
- `raw_text = data.get('text', '').strip()`: Mengambil teks chat asli dari user. Fungsi `.get()` mengamankan server agar tidak crash jika teksnya kosong, dan `.strip()` langsung memangkas habis semua spasi, tab, ##, /n atau enter di ujung kiri dan kanan (jika ada).

- `text_lower = raw_text.lower()`: Mengubah teks menjadi huruf kecil semua (misal: `/CEK` jadi `/cek`) supaya sensor di bawahnya tidak bingung mendeteksi akibat huruf kapital.

- `image_path = data.get('image_path')`: Mengambil alamat folder penyimpanan foto ikan sementara di VPS (jika ada). Kalau user cuma mengirimkan teks, variabel ini otomatis bernilai `None`.

7. **Percabangan Jalur Gambar (`/spesies`) dan Teks Cuaca (`/cek`)**  
- **Jalur Gambar (`/spesies`)**
    ```py
        # Analisa Gambar (/spesies)
        if text_lower.startswith('/spesies') and image_path:
            if os.path.exists(image_path):
                try:
                    hasil = generate_analisis_spesies(image_path)
                except Exception as e:
                    hasil = f"⚠️ Gagal analisa: {str(e)}"
                finally:
                    # Deterministic Resource Cleanup
                    if os.path.exists(image_path):
                        os.remove(image_path)
                        print(f"🗑️ File {image_path} berhasil dibersihkan.")
                
                return jsonify({"reply": hasil})
    ```
     - `if text_lower.startswith('/spesies') and image_path:`: Sensor pertama. Jika chat diawali kata `/spesies` DAN ada kiriman jalur file fotonya, maka Python masuk ke jalur visual ini.

    - `if os.path.exists(image_path):`: Memastikan sekali lagi ke sistem operasi Ubuntu VPS bahwa file foto fisiknya memang benar-benar ada di folder sementara sebelum diproses.

    - `hasil = generate_analisis_spesies(image_path)`: Melempar foto tersebut ke kustom modul lain (Gemini) bertugas mendeteksi jenis ikan dan racunnya.

    - `except Exception as e:`: Jika koneksi Google Gemini mendadak putus atau error, tangkap pesan error-nya dan ubah menjadi teks peringatan agar server tidak mati total.

    - `finally:`: Blok sapu bersih. Apa pun yang terjadi di atas (mau sukses ataupun error), jalankan perintah di bawahnya. dan `os.remove(image_path)` berfungsi untuk Menghapus file foto ikan secara permanen dari hardisk VPS detik itu juga agar kapasitas penyimpanan server tidak penuh.

    - `return jsonify({"reply": hasil})`: Membungkus hasil tebakan nama ikan menjadi format `JSON`, mengirimnya balik ke `Node.js` untuk diteruskan ke WhatsApp user, lalu menghentikan fungsi saat itu juga.

- **Bukan (/spesies) atau (/cek)**  
    ```py
        # JIKA BUKAN KEDUANYA
        elif not text_lower.startswith('/cek'):
            return jsonify({"reply": None})
    ```
    - `elif not text_lower.startswith('/cek'):`: Jika chat tidak lolos sensor `/spesies`, dia diperiksa di sini. Jika teks tersebut TIDAK diawali kata `/cek` (misal user cuma iseng ketik "Halo bot"), maka...*Langsung usir!* dengan mengembalikan ke `return jsonify({"reply": None})` , jawaban `None` ke `Node.js` dan matikan fungsi. Sisa kodingan cuaca, peta, dan Gemini yang berat di bawahnya selamat dan tidak perlu dibaca oleh Python.

- **Jalur Teks Cuaca (`/cek`)**
    ```py       
        # Analisa Text (/cek)
        # Default Settings (Botany Bay)
        lat, lon, lokasi_nama = -33.98, 151.23, "Botany Bay"
        target_dt = datetime.now()
        
        jam_mulai_default = 4
        jam_selesai = 20
        current_hour = datetime.now().hour
        jam_mulai = max(jam_mulai_default, current_hour)

        parts = raw_text.split()
        date_match = re.search(r'(\d{6})', raw_text)
        is_future = False
        
        # 1. Cek Tanggal Spesifik atau "Besok"
        if date_match:
            try:
                target_dt = datetime.strptime(date_match.group(1), "%d%m%y")
                jam_mulai = 4 
                is_future = True
            except: pass
        elif "besok" in text_lower:
            target_dt += timedelta(days=1)
            jam_mulai = 4 
            is_future = True

        # 2. Cek Lokasi Dinamis via Geocoder
        location_words = [p for p in parts[1:] if not p.isdigit() and p.lower() != "besok"]
        if location_words:
            user_loc = " ".join(location_words)
            new_lat, new_lon, clean_name = get_coordinates_data(user_loc)
            if new_lat:
                lat, lon, lokasi_nama = new_lat, new_lon, clean_name
            else:
                return jsonify({"reply": f"❓ Lokasi '{user_loc}' nggak ketemu, Om. Cek ejaan ya."})
        
        # 3. Mitigasi Jam Kalong (Lewat Jam 8 Malam)
        if not is_future and current_hour >= 20:
            target_dt += timedelta(days=1)
            jam_mulai = 4
            lokasi_nama += " (Besok Pagi)"
            
        laporan = buat_laporan(lat, lon, lokasi_nama, target_dt, jam_mulai, jam_selesai)
        return jsonify({"reply": laporan})        
    ```
    - `lat, lon, lokasi_nama = ...`: Menyiapkan bantalan darurat (fallback state). Jika user cuma ngetik `/cek` tanpa nama tempat, sistem otomatis mengarahkan koordinat ke spot default: *Botany Bay*.  
    `target_dt`: Menetapkan tanggal pencarian cuaca default yaitu Hari Ini.

    - `jam_mulai_default = 4 / jam_selesai = 20`: Mengunci batas jendela waktu laporan taktis (Jam 4 Pagi s/d Jam 8 Malam).  
    `current_hour = .. `: Mengambil angka jam digital server saat ini.  
    `jam_mulai = ..`: Trik untuk memotong data yang sudah terlewat, jika user mengecek jam 10 pagi, fungsi max(4, 10) menghasilkan angka 10, berarti data cuaca jam 4 s/d 9 pagi yang sudah lewat hari ini otomatis dibuang dan tidak dimunculkan.

    - `parts = raw_text.split()`: Memotong-motong panggilal user berdasarkan spasi menjadi sebuah daftar list, contoh: ["/cek", "manly", "besok"].  
    `date_match = re.search(...)`: Mencari apakah ada 6 digit angka berurutan di dalam chat yang menandakan tanggal kustom dari user (misal: 240526 untuk 24 Mei 2026).  
    `is_future = False`: Tanda bendera internal untuk mencatat apakah user sedang meminta cuaca untuk hari ke depan atau hari ini.

    - `if date_match`: Jika user memasukkan 6 angka tanggal kustom, ubah angka tersebut menjadi format tanggal resmi Python via `strptime()`, setel `jam_mulai = 4` full dari pagi (karena harinya belum lewat), dan naikkan bendera `is_future = True`.  
    `elif "besok" in text_lower`:Jika tidak ada angka tapi ada kata "besok", majukan tanggal hari ini sebanyak 1 hari ke depan (`timedelta(days=1)`), setel `jam_mulai = 4 full` dari pagi, dan naikkan bendera `is_future = True`.

    - `location_words = [...]`: Menyaring daftar kata untuk membuang kata perintah `/cek`, angka tanggal, dan kata "besok". Hasil akhirnya murni menyisakan nama tempatnya saja (misal: ["dee", "why"]).  
    ` user_loc = ..`: Menggabungkan kembali potongan nama tempat tadi menjadi string utuh dengan spasi: "dee why".  
    `get_coordinates_data:..`: Menembakkan nama tempat tersebut ke fungsi peta OpenStreetMap di file sebelah.  
    `if new_lat:..`: Jika tempatnya ketemu di Sydney, ganti koordinat default Botany Bay tadi dengan koordinat baru, dan ambil nama resminya dari peta (clean_name).  
    `else:..`: Jika user mengetik asal-asalan dan tempat tidak ditemukan, langsung hentikan fungsi dan kirim balasan teks peringatan ke WhatsApp.

    - `if not is_future and current_hour >= 20:`: Jika user mengecek cuaca untuk "Hari Ini" tetapi waktu aslinya di laptop/VPS sudah menunjukkan lewat dari jam 8 malam (20:00), maka...  
    `target_dt += ..`: Otomatis geser hari pencarian ke esok hari.  
    `jam_mulai =..`: Setel ulang agar data esok harinya disajikan lengkap dari jam 4 pagi.  
    `lokasi_nama += ..`: Penanda teks tambahan di judul laporan ("Besok Pagi") agar user tahu kalau data yang dia lihat adalah data esok pagi, bukan hari ini yang sudah kedaluwarsa.

    - `buat_laporan(...)`: Memanggil fungsi besar di atasnya untuk mulai menarik data Open-Meteo berdasarkan koordinat, menghitung tren pasang surut, merakit teks per jam, dan meminta kesimpulan taktis dari Gemini.  
    `return jsonify({"reply": laporan})`: Setelah teks laporan panjang dari Gemini selesai dirakit, bungkus ke dalam format `JSON` dengan key "reply", tembak balik ke Axios `Node.js`, dan akhiri tugas fungsi `/proses`!

- **Bootstrap Web Server Binding**
```py
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```
- `host='0.0.0.0'`: Menginstruksikan aplikasi untuk melakukan binding ke seluruh network interface yang tersedia di sistem operasi VPS. Langkah ini mengizinkan `Node.js` yang berjalan di lingkungan port lokal yang berbeda untuk menembak data `JSON` tanpa diblokir oleh sistem sekuriti internal.

- `port=5000`: Port spesifik nomor 5000 di dalam VPS sebagai slot tempat Flask menerima kiriman data API.