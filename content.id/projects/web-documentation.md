---
title: "Membangun Web Statis dengan Hugo, GitHub, dan Cloudflare"
translationKey: "web-documentation"
date: 2026-05-05T20:20:00+10:00
tags: ["sydney", "dokumentasi", "website", "paperMod", "template"]
categories: ["cerita"]
author: "Adien Dendra"
ShowToc: true
TocOpen: false
---
<style>
  .post-content {
    font-size: 16px;
    line-height: 1.4;
  }
</style>

Proses membangun website ini bukan sekadar tentang "tampilan", melainkan tentang efisiensi, keamanan, dan performa. Berikut adalah dokumentasi teknis bagaimana website ini dirakit dari nol hingga mengudara.

Proses membangun website ini diawali oleh keresahan website <a href="http://www.adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> yang lambat karena terlalu banyak fitur yang kurang penting. Akhirnya gue mencari cara untuk membuat website yang ringan, efisien karena tujuannya hanya untuk dokumentasi satu arah.

#### 1. Arsitektur: Mengapa Memilih SSG?

<div style="padding-left: 18px;">
Seperti yang gue nyatakan diatas, website <a href="http://www.adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> menggunakan WordPress (CMS) secara konvensional yang menggunakan database aktif, sedangkan website ini menggunakan SSG (Static Site Generator). 

SSG disini bertugas 'memasak' semua konten menjadi file HTML statis, server hanya mengirimkan file yang sudah jadi, ditambah juga dengan edge computing dari cloudflare yang kita tahu mereka tersebar dimana-mana. Sehingga kecepatannya jadi jauh lebih tinggi. 

</div>

#### 2. Hugo: Mengelola Konten
<div style="padding-left: 18px;">
Instalasi hugo dan menambahkan tema PaperMod:

```bash
hugo new site architect-web
cd architect-web
git init
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

</div>