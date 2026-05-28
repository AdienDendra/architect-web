---
title: "Setup Isso-Comments di VPS"
translationKey: "post-web-isso-comment-ionos"
date: 2026-05-24T19:41:52+10:00
lastmod: 2026-05-28T14:31:52+10:00
tags: ["sydney", "dokumentasi", "website", "isso-comments", "hugo"]
categories: ["dokumentasi"]
---

{{< mermaid >}}
graph TD
    %% Define Styles and Themes (Nuansa dark-mode linear + Admin Route)
    classDef user fill:#1f1f1f,stroke:#fff,stroke-width:2px,color:#fff;
    classDef cloudflare fill:#f38020,stroke:#fff,stroke-width:1px,color:#fff;
    classDef docker fill:#00a8cc,stroke:#fff,stroke-width:1px,color:#fff;
    classDef storage fill:#ff5722,stroke:#fff,stroke-width:1px,color:#fff;
    classDef google fill:#4285F4,stroke:#fff,stroke-width:1px,color:#fff;
    classDef admin fill:#7b2cbf,stroke:#fff,stroke-width:1px,color:#fff;

    %% Nodes Configuration (Linear Sequence with Admin Validation)
    User["💻 BROWSER<br>(Admin URL)"]:::user
    CF_Proxy["🛡️ CLOUDFLARE PROXY & WAF<br>(Security & SSL Termination)"]:::cloudflare
    CF_Tunnel["🚇 CLOUDFLARE EDGE TUNNEL<br>(Jembatan Balik / Outbound Handshake)"]:::cloudflare
    Cont_Tunnel["📦 TUNNEL CONNECTOR<br>(cloudflare/cloudflared:latest)"]:::docker
    Cont_Isso["⚙️ ISSO APPS ENGINE<br>(machines/isso - Port internal 8080)"]:::docker
    
    %% Environment Injection Addition
    Env_File["🔑 ENV VARIABLES<br>(.env File - Injection)"]:::storage
    
    %% Admin Validation Core
    Admin_Auth{"🔐 AUTH VALIDATION<br>(Cek Route /admin)"}:::admin
    
    %% Storage & Email Branches
    Isso_Conf["📄 CONFIG VOLUME<br>(config/isso.conf - Verify Admin Password)"]:::storage
    Isso_DB[("🗄️ SQLITE DATABASE<br>(db/comments.db - Update/Approve Comment)")]:::storage
    Gmail["📧 GOOGLE SMTP<br>(smtp.gmail.com:587)"]:::google
    Inbox["📩 INBOX EMAIL<br>(Notifikasi Diterima)"]:::google

    %% Initialization Flow
    Env_File -.->|Inject Token & Passwords| Cont_Tunnel
    Env_File -.->|Inject Token & Passwords| Cont_Isso

    %% Linear Flow Connections
    User -->|1. Request HTTP POST| CF_Proxy
    CF_Proxy -->|2. Internal Routing| CF_Tunnel
    CF_Tunnel -->|3. Pipa Tunnel QUIC / HTTP2| Cont_Tunnel
    Cont_Tunnel -->|4. Docker DNS Forward| Cont_Isso
    
    %% Routing Logic inside Isso for Admin and Database
    Cont_Isso -->|5. Evaluate Request Path| Admin_Auth
    
    %% Conditional Branches flowing down
    Admin_Auth -->|Path: /admin| Isso_Conf
    Admin_Auth -->|Path: /id/new| Isso_DB
    
    %% Bottom Sequential Operations
    Isso_Conf -->|6a. Password Match Success| Isso_DB
    Isso_DB -->|6b. Trigger Moderation Alert| Gmail
    Gmail -->|7. Deliver Email| Inbox
{{< /mermaid >}}

### Evaluasi Logika Alur Arsitektur

- **Inisialisasi Sistem (.env Injection):** Sebelum menerima trafik, Docker Compose membaca file `**\.env**` untuk menyuntikkan kredensial (`TUNNEL_TOKEN`, `ISSO_ADMIN_PASSWORD`, dan `ISSO_SMTP_PASSWORD`) langsung ke memori *runtime* **Tunnel Connector** dan **Isso Apps Engine** secara terisolasi.
- **Langkah 1 (Client Request):** Admin mengakses URL website. Trafik masuk secara *Inbound* ke jaringan **Cloudflare Proxy & WAF** untuk enkripsi SSL/TLS dan penyaringan keamanan dasar.
- **Langkah 2 & 3 (Reverse Proxy via Tunnel):** Trafik diteruskan ke Cloudflare Edge Tunnel, lalu dialirkan turun melewati pipa terenkripsi (QUIC/HTTP2) menuju kontainer **Tunnel Connector (`cloudflared`)** yang stand-by di dalam VPS.
- **Langkah 4 (Service Discovery):** Kontainer Tunnel Connector meneruskan paket data tersebut ke kontainer **Isso Apps Engine** melalui port internal `8080` menggunakan fitur translasi DNS internal Docker (`isso-net`).
- **Langkah 5 (Path Routing):** Mesin Isso mengevaluasi jalur URL (*Request Path*) yang masuk lewat komponen **Auth Validation** untuk memisahkan hak akses operasi:  
   * **Jalur `/admin`:** Mengarahkannya ke **Config Volume (`isso.conf`)** untuk memvalidasi kecocokan password administrator.
   * **Jalur `/id/new`:** Submisi komentar baru langsung diarahkan ke **SQLite Database (`comments.db`)** untuk disimpan dengan status *Pending*.
- **Langkah 6 & 7 (Output Notification):** Setelah database terupdate dan memicu moderasi, Isso bertindak sebagai SMTP klien, melakukan otentikasi menggunakan password dari `.env`, lalu mengirim email lewat **Google SMTP (`smtp.gmail.com:587`)** hingga notifikasi mendarat di **Inbox Email**.