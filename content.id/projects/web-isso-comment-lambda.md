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
    %% Define Styles and Themes (Disesuaikan dengan nuansa dark-mode Mas)
    classDef user fill:#1f1f1f,stroke:#fff,stroke-width:2px,color:#fff;
    classDef cloudflare fill:#f38020,stroke:#fff,stroke-width:1px,color:#fff;
    classDef awsServerless fill:#232F3E,stroke:#ff9900,stroke-width:1px,color:#fff;
    classDef google fill:#4285F4,stroke:#fff,stroke-width:1px,color:#fff;

    %% Nodes Configuration
    User["💻 USER BROWSER<br>(Klik Submit Komentar)"]:::user
    CF["☁️ CLOUDFLARE<br>(DNS & WAF Proxy)"]:::cloudflare
    
    subgraph AWS ["☁️ AWS REGION GLOBAL (Fully Serverless - No VPC)"]
        APIGW["🔌 AWS API GATEWAY<br>(HTTP API Endpoint - Pay per Request)"]:::awsServerless
        Lambda1["⚡ LAMBDA 1: ISSO ENGINE<br>(Docker Container - Pay per Exec)"]:::awsServerless
        S3["🪣 AMAZON S3 BUCKET<br>(Storage: comments.db - Pay per GB)"]:::awsServerless
        SQS["📥 AMAZON SQS<br>(Email Queue - Pay per Message)"]:::awsServerless
        Lambda2["⚡ LAMBDA 2: EMAIL SENDER<br>(Python - Pay per Exec)"]:::awsServerless
    end
    
    Gmail["📧 GOOGLE SMTP<br>(smtp.gmail.com:587)"]:::google
    Inbox["📩 INBOX EMAIL<br>(Notifikasi Diterima)"]:::google

    %% Flow Connections (Aliran Data Real-Time)
    User -->|1. HTTPS POST| CF
    CF -->|2. Forward Request| APIGW
    APIGW -->|3. Trigger Function| Lambda1
    
    %% Lambda 1 Serverless Sync & Queue
    Lambda1 <-->|4a. Sync db via Entrypoint Script| S3
    Lambda1 -->|4b. Push Email Payload via Internet| SQS
    
    %% Async Email Operations
    SQS -->|5. Event Trigger| Lambda2
    Lambda2 -->|6. Auth via App Password| Gmail
    Gmail -->|7. Deliver Email| Inbox

    %% Assign Subgraph Style
    style AWS fill:#11161f,stroke:#ff9900,stroke-width:1.5px,color:#fff

    {{< /mermaid >}}
