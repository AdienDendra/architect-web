---
title: "Setup Isso-Comments dengan AWS Lambda & AWS EFS"
translationKey: "post-web-isso-comment-lambda"
date: 2026-05-24T19:41:52+10:00
lastmod: 2026-05-24T19:41:52+10:00
tags: ["sydney", "dokumentasi", "website", "isso-comments", "hugo"]
categories: ["dokumentasi"]
---

{{< mermaid >}}

graph TD
    %% Define Styles and Themes
    classDef user fill:#1f1f1f,stroke:#ffff,stroke-width:2px,color:#fff;
    classDef cloudflare fill:#f38020,stroke:#fff,stroke-width:1px,color:#fff;
    classDef awsPublic fill:#232F3E,stroke:#f38020,stroke-width:1px,color:#fff;
    classDef awsVpc fill:#3b4856,stroke:#fff,stroke-width:2px,color:#fff;
    classDef internal fill:#111,stroke:#f38020,stroke-width:1px,color:#fff;
    classDef google fill:#4285F4,stroke:#fff,stroke-width:1px,color:#fff;

    %% Nodes Configuration
    User["💻 USER BROWSER<br>(Klik Submit Komentar)"]:::user
    CF["☁️ CLOUDFLARE<br>(DNS & WAF Proxy)"]:::cloudflare
    APIGW["🔌 AWS API GATEWAY<br>(HTTP API Endpoint)"]:::awsPublic
    SQS["📥 AMAZON SQS<br>(Email Queue - Outside VPC)"]:::awsPublic
    Lambda2["⚡ LAMBDA 2: EMAIL SENDER<br>(Python - Outside VPC)"]:::awsPublic
    Gmail["📧 GOOGLE SMTP<br>(smtp.gmail.com:587)"]:::google
    Inbox["📩 INBOX EMAIL<br>(Notifikasi Diterima)"]:::google

    subgraph VPC ["🔒 AWS VPC (Jaringan Privat)"]
        Lambda1["⚡ LAMBDA 1: ISSO ENGINE<br>(Docker Container)"]:::internal
        EFS["💾 AMAZON EFS<br>(SQLite: comments.db)"]:::internal
        VPCE["🔗 SQS VPC ENDPOINT<br>(Jalur Internal Privat)"]:::internal
    end

    %% Flow Connections
    User -->|1. HTTPS POST| CF
    CF -->|2. Forward Request| APIGW
    APIGW -->|3. Trigger Function| Lambda1
    
    %% Inside VPC Operations
    Lambda1 -->|4a. Write/Read SQL| EFS
    Lambda1 -->|4b. Send Payload| VPCE
    VPCE -->|5. Push Message| SQS
    
    %% Async Email Operations
    SQS -->|6. Event Trigger| Lambda2
    Lambda2 -->|7. Auth via App Password| Gmail
    Gmail -->|8. Deliver Email| Inbox

    %% Assign Subgraph Style
    style VPC fill:#1a2332,stroke:#1473e6,stroke-width:2px,color:#fff

    {{< /mermaid >}}
