---
title: "Isso-Comments Setup on VPS"
translationKey: "post-web-isso-comment-ionos"
date: 2026-05-24T19:41:52+10:00
lastmod: 2026-05-28T14:31:52+10:00
tags: ["sydney", "documentation", "website", "isso-comments", "hugo"]
categories: ["documentation"]
---

{{< mermaid >}}
graph TD
    %% Define Styles and Themes (Dark-mode linear + Admin Route)
    classDef user fill:#1f1f1f,stroke:#fff,stroke-width:2px,color:#fff;
    classDef cloudflare fill:#f38020,stroke:#fff,stroke-width:1px,color:#fff;
    classDef docker fill:#00a8cc,stroke:#fff,stroke-width:1px,color:#fff;
    classDef storage fill:#ff5722,stroke:#fff,stroke-width:1px,color:#fff;
    classDef google fill:#4285F4,stroke:#fff,stroke-width:1px,color:#fff;
    classDef admin fill:#7b2cbf,stroke:#fff,stroke-width:1px,color:#fff;

    %% Nodes Configuration (Linear Sequence with Admin Validation)
    User["💻 BROWSER<br>(Admin URL)"]:::user
    CF_Proxy["🛡️ CLOUDFLARE PROXY & WAF<br>(Security & SSL Termination)"]:::cloudflare
    CF_Tunnel["🚇 CLOUDFLARE EDGE TUNNEL<br>(Reverse Bridge / Outbound Handshake)"]:::cloudflare
    Cont_Tunnel["📦 TUNNEL CONNECTOR<br>(cloudflare/cloudflared:latest)"]:::docker
    Cont_Isso["⚙️ ISSO APPS ENGINE<br>(machines/isso - Internal Port 8080)"]:::docker
    
    %% Environment Injection Addition
    Env_File["🔑 ENV VARIABLES<br>(.env File - Injection)"]:::storage
    
    %% Admin Validation Core
    Admin_Auth{"🔐 AUTH VALIDATION<br>(Check /admin Route)"}:::admin
    
    %% Storage & Email Branches
    Isso_Conf["📄 CONFIG VOLUME<br>(config/isso.conf - Verify Admin Password)"]:::storage
    Isso_DB[("🗄️ SQLITE DATABASE<br>(db/comments.db - Update/Approve Comment)")]:::storage
    Gmail["📧 GOOGLE SMTP<br>(smtp.gmail.com:587)"]:::google
    Inbox["📩 EMAIL INBOX<br>(Notification Received)"]:::google

    %% Initialization Flow
    Env_File -.->|Inject Tokens & Passwords| Cont_Tunnel
    Env_File -.->|Inject Tokens & Passwords| Cont_Isso

    %% Linear Flow Connections
    User -->|1. HTTP POST Request| CF_Proxy
    CF_Proxy -->|2. Internal Routing| CF_Tunnel
    CF_Tunnel -->|3. QUIC / HTTP2 Tunnel Pipe| Cont_Tunnel
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

### Architecture Flow Evaluation

- **System Initialization (.env Injection):**  
  Before receiving any traffic, Docker Compose reads the `**\.env**` file to inject credentials (`TUNNEL_TOKEN`, `ISSO_ADMIN_PASSWORD`, and `ISSO_SMTP_PASSWORD`) directly into the runtime memory of both the **Tunnel Connector** and **Isso Apps Engine** containers in an isolated manner.

- **Step 1 (Client Request):**  
  The admin accesses the website URL. Incoming traffic enters the **Cloudflare Proxy & WAF** as inbound traffic for SSL/TLS encryption and baseline security filtering.

- **Step 2 & 3 (Reverse Proxy via Tunnel):**  
  The traffic is forwarded to the Cloudflare Edge Tunnel, then flows through an encrypted pipe (QUIC/HTTP2) toward the **Tunnel Connector (`cloudflared`)** container running inside the VPS.

- **Step 4 (Service Discovery):**  
  The Tunnel Connector container forwards the data packets to the **Isso Apps Engine** container through internal port `8080` using Docker’s internal DNS translation (`isso-net`).

- **Step 5 (Path Routing):**  
  The Isso engine evaluates the incoming URL path via the **Auth Validation** component to separate operational access rights:
    * **Path `/admin`:** Routed to the **Config Volume (`isso.conf`)** to validate the administrator password.
    * **Path `/id/new`:** New comment submissions are routed directly to the **SQLite Database (`comments.db`)** and stored with a *Pending* status.

- **Step 6 & 7 (Output Notification):**  
  After the database is updated and moderation is triggered, Isso acts as an SMTP client, authenticates using the password from `.env`, and sends an email via **Google SMTP (`smtp.gmail.com:587`)** until the notification arrives in the **Email Inbox**.
