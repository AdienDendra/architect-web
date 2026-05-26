---
title: "Bot-Mancing: Real-Time Weather Analysis and Species Identification System"
date: 2026-05-21T19:25:00+10:00
lastmod: 2026-05-27T12:14:00+10:00
tags: ["cloud", "vps", "network", "sydney", "fishing"]
categories: ["documentation"]
mermaid: true
---

## Introduction
### Background
I’ve been deeply involved in fishing for more than three years now. What started as a casual activity during beach picnics with family and friends has gradually evolved into something far more serious over the past two years. Fishing is no longer just a pastime, it has become both a sport and a game.

Because of that, my focus extends far beyond choosing the right gear or apparel. Other variables, such as having a solid understanding of weather patterns and accurate information about target species have become essential.

Why is this so critical? Nearly all land-based *game fishing* activities take place on rocky cliffs and ledges around Sydney. These environments carry significant risks, making safety a non‑negotiable priority. On top of that, fishing regulations in New South Wales (NSW) are extremely strict, and several species are notoriously difficult to identify visually. In situations where precise decisions matter, having a simple, instant, and accurate medium to deliver information becomes indispensable.

### Problem

**Raw Data Friction**: My main challenge is having to open multiple raw data sources, such as text feeds or graphs from the Bureau of Meteorology (BOM) and manually compare them with other weather apps.

**Manual Interpretation**: I often struggle to interpret this data quickly before heading out. Missing anomalies like the potential for *rogue waves* could lead to dangerous consequences.

### Solution
**Automated Information Bridge**: The Bot-Mancing project is built as an automated coastal weather analytics system for Australia, bridging raw weather data and species identification (via text and images) directly into WhatsApp on demand.

**Decoupled Architecture**: I’ll explain the processing system in detail in the Methods and Code section below. But in general, the system is separated into two main processing functions:

1. **Messaging Gateway (Node.js)**: Acts as the entry point for text commands (`/cek [location]`) and image-based interactions (`/spesies` + photo attachment) from WhatsApp.

2. **Data Ingestion Engine (Python)**: Responsible for fetching, filtering, and structuring data from **Open-Meteo API** and **Generative AI**.  
    - **Open-Meteo** serves as the real-time marine weather data source, providing the meteorological metrics I need such as wind speed, swell period, air temperature, and more.  
    - **Generative AI** performs dual analysis using Large Language Models for predictive, tactical, and contextual weather interpretation, and Computer Vision to process user-uploaded catch photos in real time.

### Output
Users only need WhatsApp for two main scenarios:
1. **Scenario A**: Weather Monitoring (`/cek [location]`)  
The system instantly returns weather reports, wave analysis, safety assessments, and predicted fish activity hours based on lunar elongation.

    ```Bash
    /cek manly
    ```
{{< collapse title="Weather Output" collapse="true" >}}
![2](/images/projects/bot-mancing/cuaca.jpg)
{{< /collapse >}}

2. **Scenario B**: Species Identification (`/spesies` + Photo).  
Users upload a photo of their catch to WhatsApp and type:
    ```Bash
    /spesies
    ```
{{< collapse title="Identification Output" collapse="true" >}}
![1](/images/projects/bot-mancing/spesies.jpg)
{{< /collapse >}}

## Methods and Code
### Data Flow Diagram
A high-level overview of the inbound and outbound data flow from the WhatsApp application.

{{< mermaid >}}

graph TD
    %% Define Styles (Dark Mode Portfolio Theme)
    classDef user fill:#1f1f1f,stroke:#fff,stroke-width:2px,color:#fff;
    classDef meta fill:#00a884,stroke:#fff,stroke-width:1px,color:#fff;
    classDef nodejs fill:#339933,stroke:#fff,stroke-width:1px,color:#fff;
    classDef guni fill:#ed217c,stroke:#fff,stroke-width:1px,color:#fff;
    classDef python fill:#3776AB,stroke:#fff,stroke-width:1px,color:#fff;
    classDef external fill:#232F3E,stroke:#fff,stroke-width:1px,color:#fff;

    %% --- SINGLE-COLUMN NODE LAYOUT ---
    User["📱 WHATSAPP USER<br>(Send /cek or /spesies)"]:::user
    Meta["🏢 META SERVER<br>(WhatsApp Cloud API)"]:::meta
    NodeApp["🟢 MESSAGING GATEWAY<br>(Node.js - gateway.js)<br>[Managed by PM2 @ Ubuntu VPS]"]:::nodejs
    GuniMaster["🦄 GUNICORN WSGI<br>(Port 5000 Proxy)<br>[Managed by PM2 @ Ubuntu VPS]"]:::guni
    MainPy["🐍 DATA INGESTION ENGINE<br>(Python - main.py - Flask App)<br>[Managed by PM2 @ Ubuntu VPS]"]:::python
    BOM["🌦️ OPEN-METEO<br>(Weather & Marine Data API)"]:::external
    Gemini["🧠 GEMINI AI<br>(Google AI API Engine)"]:::external

    %% === INBOUND FLOW (VERTICAL DOWNWARD) ===
    User -->|1. Chat /cek /spesies| Meta
    Meta -->|2. WebSocket Connection| NodeApp
    NodeApp -->|3. HTTP POST Payload| GuniMaster
    GuniMaster -->|4. Assign Worker Process| MainPy
    
    %% === LOWER-LEVEL API INTERACTIONS ===
    MainPy -->|5. Request Marine Weather| BOM
    BOM -.->|6. Return JSON Data| MainPy
    MainPy -->|7. Request Tactical Analysis| Gemini
    Gemini -.->|8. Return AI Text| MainPy
    
    %% === OUTBOUND FLOW (VERTICAL UPWARD) ===
    MainPy -->|9. Send Analysis Output| NodeApp
    NodeApp -->|10. Send Back via Socket| Meta
    Meta -->|11. Deliver Report| User

{{< /mermaid >}}

### Messaging Gateway (Node.js)
1. **Import Modules and Dependencies**
```js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const axios = require("axios");
const pino = require("pino");
const fs = require("fs"); 
const path = require("path");
```
- `@whiskeysockets/baileys`: The main library for interacting with WhatsApp via WebSocket. It imports functions for establishing connections (`makeWASocket`), managing sessions (`useMultiFileAuthState`), handling errors (`DisconnectReason`), checking the latest WA version (`fetchLatestBaileysVersion`), and downloading images (`downloadMediaMessage`).

- `@hapi/boom`: Error‑handling library used to interpret HTTP/connection status responses.

- `axios`: HTTP client used to send requests to the Python backend API (`http://127.0.0.1:5000/proses`).

- `pino`: Logging module. Used to suppress Baileys’ default logs, keeping the terminal output clean.

- `fs & path`: Built‑in Node.js modules for file system operations and folder path manipulation on the VPS.


2. **Main Function**
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
- `useMultiFileAuthState('auth_info')`: This function creates a folder named `auth_info` where authentication tokens are stored. If the folder already contains valid session data, the bot can restart without needing to scan a QR code again.

- `fetchLatestBaileysVersion()`: Ensures the bot uses the latest WhatsApp Web protocol version to avoid being flagged as an outdated browser by Meta.

- `makeWASocket({...})`: Initializes the WebSocket connection to WhatsApp.

- `logger: pino({ level: 'silent' })`: Disables Baileys’ internal logging. Since Baileys communicates with WhatsApp servers via WebSocket—performing continuous ping‑pong operations—this prevents the terminal from being flooded with logs.

- `browser: [...]`: Spoofs the server identity so it appears as if the connection is coming from a Chrome browser running on Ubuntu.

- `connectTimeoutMs & keepAliveIntervalMs`: Configures the connection timeout (60 seconds) and the keep‑alive interval (ping every 10 seconds) to prevent the server from dropping the connection.

- `sock.ev.on('creds.update', saveCreds)`: Whenever WhatsApp updates its authentication tokens, this function automatically saves the new credentials into the `auth_info` folder.


3. **Log Connection**
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
- `connection.update`: Event listener that monitors whether the bot is connected, disconnected, or currently synchronizing data.

- `if (connection === 'close')`: When the connection drops, the system checks the disconnection reason using Boom.

- `shouldReconnect`: A boolean logic check. If the error is not caused by an intentional logout (`DisconnectReason.loggedOut`), this variable becomes `true`.

- `if (shouldReconnect) startBot()`: When `true`, the `startBot()` function is called recursively to automatically re-establish the connection without requiring manual intervention.


4. **Incoming Message Handler**
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
- `messages.upsert`: Event that trigger every time a new message arrives in the WhatsApp account.

- `if (!m.message || m.key.fromMe) return;`: A Guard Clause. If the message is empty (e.g., system notifications) or if the message was sent by the bot’s own number, the function exits immediately (early return).

- **Message Text Extraction**: Uses a fallback technique (the `||` operator) to extract the message text from multiple possible sources:

- `conversation`: When the message is a plain text message.

- `extendedTextMessage?.text`: When the message is a reply or contains formatted/extended text.

- `imageMessage?.caption`: When the text is sent as a caption attached to an image.

- `command = pesanText.toLowerCase()`: Converts the entire text to lowercase so command detection becomes case‑insensitive (preventing issues when users type `/CEK` or `/Spesies`).


5. **Image Processing Path (/spesies)**
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
- `if (command.startsWith('/spesies'))`: Checks whether the incoming text begins with the `/spesies` command.

- `const isImage = !!m.message.imageMessage`: Converts the image object into a boolean value (true/false). If no image object is found, the system immediately sends a warning message back to the user.

- `downloadMediaMessage`: Downloads the binary image data directly from WhatsApp’s encrypted servers into the VPS memory as a buffer.

- `fs.writeFileSync(filePath, buffer)`: Saves the buffer as a physical `.jpg` file inside the local VPS folder (`../sesi-mancing/`) using a unique timestamp‑based filename (`img_1716...jpg`).

- `axios.post`: Sends a JSON payload to the Python Flask backend. Instead of sending the full image file, it only sends the command text and the file path (`image_path`).

- `sock.sendMessage`: Waits for the Python backend to return its response (`response.data.reply`), then sends the species analysis text back to the user on WhatsApp.


6. **Weather Processing Path (/cek)**
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
- `else if (command.startsWith('/cek'))`: If the message does not contain `/spesies` but instead begins with `/cek` (e.g., `/cek manly`), this processing path is executed.

- `axios.post` without `image_path`: Since this is a pure text command, the JSON payload sent to the Python backend contains only the text parameters and sender.

- Response Handling: Similar to the Image Processing Path, the compiled weather data returned by the Python backend is immediately forwarded back to the user via WhatsApp.

7. **Bootstrap Execution**
```js
console.log("🚀 Menjalankan Pelayan Node.js di VPS...");
startBot();
```
The last two lines act as the main trigger (bootstrap). As soon as PM2 runs the `gateway.js` file, this text message is printed to the console log, and the main function `startBot()` is executed immediately to open the socket connection to the WhatsApp server.


### Data Ingestion Engine (Python)
1. **Import Modules and Dependencies**
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
- `os` & `re`: Built‑in Python modules. `os` is used to retrieve API keys from the system environment, while `re` (Regular Expressions) is used to detect date‑like numeric patterns (such as `240526`) inside user messages.

- `flask`: The primary framework acting as the network layer. `Flask` creates the server, `request` captures incoming `JSON` payloads from Node.js, and `jsonify` wraps the response text back into proper `JSON` format.

- `datetime`, `timedelta`, `dateutil.parser`: Time‑processing modules used to calculate today’s date, convert text into datetime objects, and accurately compute tomorrow’s date.

- `google.genai`: The official Google Gemini SDK used to access AI models (e.g., Gemini‑3‑Flash).

- `geopy.geocoders (Nominatim)`: A geolocation engine powered by OpenStreetMap. It converts user‑typed location names (e.g., “Dee Why”) into precise latitude and longitude coordinates.

- `load_dotenv`: A module for reading `.env` files, ensuring API keys remain hidden and are not exposed in the main codebase.

- `config` & `ai_analisis` & `data_cuaca`: Custom modules I created to separate logic for wave calculations, Open‑Meteo data retrieval, and Gemini prompt processing. This keeps `main.py` clean and prevents it from becoming overly long.


2. **Initialize Global Configuration**
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
- `NAMA_HARI` & `NAMA_BULAN`: Custom hardcoded dictionaries used to translate the server’s default English date format into Indonesian day and month names.

- `LUNAR_ANCHOR`: Defines the reference date for the new‑moon phase (loaded from `config.py`) and converts it into a `datetime` object for accurate tidal‑cycle calculations.

- `app = Flask(__name__)`: Initializes the Flask framework engine.

- `genai.Client(...)`: Opens a connection to Google Gemini using a verified API key. If the key is missing, the server raises a `ValueError` and stops running, ensuring misconfigured `.env` files are caught early.

- `Nominatim(user_agent=...)`: Registers the application name with the OpenStreetMap server, granting permission to perform free geolocation lookups for converting user‑typed place names into coordinates.


3. **Weather Report Function (`buat_laporan`)**
This function acts as an internal assembly engine, where all weather, wave, wind, and tidal data for Australian coastal areas are combined into a single unified report before being passed to Gemini.

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

- `get_weather_data(lat, lon)`: Calls a custom function that retrieves raw `JSON` data from the Open‑Meteo API (both land weather and marine weather), along with tidal forecast data.

- `start_idx = next(...)`: A dynamic trick to determine the correct array index where the user‑requested date appears. This prevents schedule mismatches caused by timezone differences between the VPS (USA) and Sydney.

- `marine_is_missing`: A safety fallback mechanism. If Open‑Meteo’s marine endpoint goes down, or if the user enters a location that is purely inland with no wave‑height data, this variable becomes `True`. The system then avoids crashing and replaces wave‑related fields with `"N/A"`.

4. **Per‑Hour Conditional Logic**
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
- `if jam_mulai <= jam <= jam_selesai`: Hour‑range filter. The 24‑hour weather data from Open‑Meteo is trimmed so only the hours between 4 AM and 8 PM are included (the typical fishing window). This significantly reduces the token size sent to Gemini.

- Tidal Trend Logic (`tide_data`): The system compares the current hour’s water level (`current_t`) with the previous hour’s level (`prev_t`). If the value is higher, it is marked with a rising icon 📈. If lower, it is marked with a falling icon 📉.

- Rain Icon Logic: Converts numerical rain‑probability values into visual WhatsApp emojis automatically, making the weather report easier and more pleasant to read.

5. **Final Synthesis and AI Invocation**
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
- `generate_analisis_cuaca(...)`: Sends the fully assembled per‑hour weather summary to Gemini AI, requesting an expert assessment of fishing feasibility at the specified spot.

- `pesan_final`: Combines the Header text (fishing window & fish‑activity rating), the per‑hour data points, and Gemini’s analytical output into one complete string to be returned to `Node.js`.

6. **Gateway Webhook `/proses` (HTTP POST Endpoint) and Inbound Data Handling**  
This component acts as the entry point that receives `JSON` payloads sent from Node.js via Axios.

```py
@app.route('/proses', methods=['POST'])
def proses_pesan():
    data = request.json
    raw_text = data.get('text', '').strip()
    text_lower = raw_text.lower()
    image_path = data.get('image_path')
```
- `@app.route('/proses', methods=['POST'])`: Opens a URL gateway on the server at `http://vps-ip:5000/proses`, dedicated to receiving inbound HTTP POST requests.

- `data = request.json`: Flask unpacks the incoming `JSON` payload sent by Axios from Node.js and converts it into a Python dictionary object.

- `raw_text = data.get('text', '').strip()`: Extracts the original chat text from the user. The `.get()` method prevents crashes if the field is missing, and `.strip()` removes any leading or trailing spaces, tabs, `#`, `\n`, or newline characters.

- `text_lower = raw_text.lower()`: Converts the text to lowercase (e.g., `/CEK` → `/cek`) to ensure the command detection logic remains consistent regardless of capitalization.

- `image_path = data.get('image_path')`: Retrieves the temporary VPS file path of the uploaded fish photo (if any). If the user only sends text, this value becomes `None`.

7. **Branching Between Image Path (`/spesies`) and Weather Text (`/cek`)**
- **Image Path (`/spesies`)**
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
    - `if text_lower.startswith('/spesies') and image_path:`: The first detector. If the chat begins with `/spesies` AND an image file path is included, Python enters the visual‑analysis branch.

    - `if os.path.exists(image_path):`: Double‑checks with the Ubuntu VPS filesystem to ensure the photo truly exists in the temporary folder before processing.

    - `hasil = generate_analisis_spesies(image_path)`: Sends the photo to a custom module (Gemini) responsible for identifying the fish species and determining whether it is poisonous.

    - `except Exception as e:`: If the connection to Google Gemini suddenly fails or any error occurs, the exception is captured and converted into a warning message so the server does not crash.

    - `finally:`: Cleanup block. Regardless of success or failure above, this block always runs. The command `os.remove(image_path)` permanently deletes the fish photo from the VPS disk immediately to prevent storage buildup.

    - `return jsonify({"reply": hasil})`: Wraps the predicted fish species into a `JSON` response, sends it back to Node.js for delivery to the WhatsApp user, and stops further execution.

- **Not (/spesies) or (/cek)**
    ```py
        # JIKA BUKAN KEDUANYA
        elif not text_lower.startswith('/cek'):
            return jsonify({"reply": None})
    ```
    - `elif not text_lower.startswith('/cek'):`: If the message does not match the `/spesies` branch, it is checked here. If the text does NOT start with `/cek` (for example, the user simply types “Hello bot”), then… *Reject immediately!* The server returns `return jsonify({"reply": None})`, sending `None` back to Node.js and stopping execution. This protects the heavy weather, mapping, and Gemini logic below from being unnecessarily triggered.

- **Weather Text Branch (`/cek`)**
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
    - `lat, lon, lokasi_nama = ...`: Prepares a fallback state. If the user only types `/cek` without specifying a location, the system automatically defaults to the coordinates of *Botany Bay*.  
    `target_dt`: Sets the default weather‑lookup date to Today.

    - `jam_mulai_default = 4 / jam_selesai = 20`: Locks the tactical reporting window (4 AM to 8 PM).  
    `current_hour = ...`: Retrieves the VPS’s current hour  
    `jam_mulai = ...`: A trimming trick, if the user checks at 10 AM, `max(4, 10)` becomes 10, meaning all weather data from 4–9 AM is discarded because it has already passed.

    - `parts = raw_text.split()`: Splits the user command by spaces into a list, e.g., `["/cek", "manly", "besok"]`.  
    `date_match = re.search(...)`: Detects whether the user included a 6‑digit custom date (e.g., `240526` for 24 May 2026).  
    `is_future = False`: Internal flag indicating whether the user is requesting a future date or today.

    - `if date_match`: If the user provides a 6‑digit custom date, convert it into a proper Python date using `strptime()`, set `jam_mulai = 4` (full morning window), and raise the `is_future = True` flag.  
    `elif "besok" in text_lower`: If no digits but the word “besok” (tomorrow) is present, shift the date forward by one day (`timedelta(days=1)`), set `jam_mulai = 4`, and raise `is_future = True`.

    - `location_words = [...]`: Filters out `/cek`, date digits, and the word “besok”, leaving only the location name (e.g., `["dee", "why"]`).  
    `user_loc = ...`: Joins the pieces back into a full string: `"dee why"`.  
    `get_coordinates_data(...)`: Sends the location name to the OpenStreetMap geocoder.  
    `if new_lat: ...`: If the location is found in Sydney, replace the default Botany Bay coordinates with the new ones and use the cleaned official name.  
    `else: ...`: If the user typed nonsense and the location cannot be found, stop immediately and return a warning message to WhatsApp.

    - `if not is_future and current_hour >= 20:`: If the user checks weather for “Today” but the VPS time is already past 8 PM, then…  
    `target_dt += ...`: Automatically shift the lookup date to tomorrow.  
    `jam_mulai = ...`: Reset the hour window to start from 4 AM.  
    `lokasi_nama += ...`: Append a label such as “(Besok Pagi)” to the report header so the user knows the data refers to tomorrow morning, not today.

    - `buat_laporan(...)`: Calls the main function to fetch Open‑Meteo data, compute tidal trends, assemble per‑hour text, and request tactical insights from Gemini.  
    `return jsonify({"reply": laporan})`: Once the full Gemini report is ready, wrap it into a `JSON` object with the key `"reply"`, send it back to Axios in Node.js, and finish the `/proses` task.

- **Bootstrap Web Server Binding**
```py
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```
- `host='0.0.0.0'`: Instructs the application to bind to all available network interfaces on the VPS. This allows the Node.js service which may run on a different local port to send `JSON` payloads without being blocked by internal security restrictions.

- `port=5000`: Specifies port 5000 on the VPS as the dedicated slot where Flask listens for incoming API requests.
