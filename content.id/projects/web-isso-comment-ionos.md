---
title: "Setup Isso-Comments di VPS"
translationKey: "post-web-isso-comment-ionos"
date: 2026-05-24T19:41:52+10:00
lastmod: 2026-05-24T19:41:52+10:00
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
    User["💻 CLIENT BROWSER<br>(Pengunjung/Admin Akses URL)"]:::user
    CF_Proxy["🛡️ CLOUDFLARE PROXY & WAF<br>(Security & SSL Termination)"]:::cloudflare
    CF_Tunnel["🚇 CLOUDFLARE EDGE TUNNEL<br>(Jembatan Balik / Outbound Handshake)"]:::cloudflare
    Cont_Tunnel["📦 TUNNEL CONNECTOR<br>(cloudflare/cloudflared:latest)"]:::docker
    Cont_Isso["⚙️ ISSO APPS ENGINE<br>(machines/isso - Port internal 8080)"]:::docker
    
    %% Admin Validation Core
    Admin_Auth{"🔐 AUTH VALIDATION<br>(Cek Route /admin)"}:::admin
    
    %% Storage & Email Branches
    Isso_Conf["📄 CONFIG VOLUME<br>(config/isso.conf - Verify Admin Password)"]:::storage
    Isso_DB[("🗄️ SQLITE DATABASE<br>(db/comments.db - Update/Approve Comment)")]:::storage
    Gmail["📧 GOOGLE SMTP<br>(smtp.gmail.com:587)"]:::google
    Inbox["📩 INBOX EMAIL<br>(Notifikasi Diterima)"]:::google

    %% Linear Flow Connections
    User -->|1. Request HTTP POST atau Akses /admin| CF_Proxy
    CF_Proxy -->|2. Internal Routing| CF_Tunnel
    CF_Tunnel -->|3. Pipa Aman Tunnel QUIC / HTTP2| Cont_Tunnel
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
