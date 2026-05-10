---
title: "Alur Kerja Web Statis Dengan Hugo"
translationKey: "web-adiendendra.documentation"
date: 2026-05-10T18:50:00+10:00
tags: ["sydney", "dokumentasi", "website", "adiendendra.com", "template"]
categories: ["dokumentasi"]
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

Saya membangun website ini bukan sekadar tentang "tampilan", melainkan tentang efisiensi, dan performa. Berikut adalah dokumentasi teknis bagaimana website ini dirakit dari nol hingga jadi.

Proses membangun website ini diawali oleh keresahan website saya (<a href="http://www.adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a>) yang lambat, karena terlalu banyak fitur yang kurang penting. Akhirnya saya mencari cara untuk membuat website yang ringan dan efisien karena tujuannya hanya untuk dokumentasi satu arah.

### 1. Mengapa Memilih SSG?

<div style="padding-left: 26px;">
Seperti yang saya nyatakan diatas, website <a href="http://www.adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> menggunakan WordPress (CMS) secara konvensional yang menggunakan database aktif, sedangkan website ini menggunakan SSG (Static Site Generator). 

SSG yang saya gunakan yaitu Hugo, alasannya karena popular dan banyak dokumentasinya. Fungsi Hugo disini bertugas 'memasak' semua konten menjadi file HTML statis, server hanya mengirimkan file yang sudah jadi, ditambah juga dengan edge computing dari cloudflare yang kita tahu mereka tersebar dimana-mana. Sehingga kecepatannya jadi jauh lebih tinggi. 

</div>

### 2. Mengelola Konten Hugo
<div style="padding-left: 26px;">

#### A. Setup Awal
<div style="padding-left: 20px;">
Instalasi hugo dan menambahkan tema PaperMod:

```bash
hugo new site architect-web
cd architect-web
git init
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```
</div>

#### B. Konfigurasi (hugo.toml)
<div style="padding-left: 20px;">
Saya menggunakan format TOML untuk konfigurasi karena lebih bersih dan lebih gampang dibaca dibanding JSON. Di sinilah saya mengatur format konten dari web, menyertakan dwibahasa (inggris dan indonesia) dll:

```markdown
baseURL = 'https://architect.adiendendra.com/'
languageCode = 'en-us'
title = 'Adien'
theme = 'PaperMod'
defaultContentLanguage = "en"
defaultContentLanguageInSubdir = true 
enableRobotsTXT = true
```
selengkapnya bisa dilihat di <a href="https://github.com/AdienDendra/architect-web/blob/main/hugo.toml " target="_blank" rel="noopener">hugo.toml</a>
</div>

</div>

### 4. Anatomi Struktur Direktori Hugo
<div style="padding-left: 26px;">
Berikut adalah peran krusial dari direktori utama yang membentuk website ini:

#### A. content.en & content.id (Multilingual Content)
<div style="padding-left: 20px;">
Hugo memiliki fitur multibahasa.
Kenapa dipisah? Folder ini memisahkan konten berdasarkan bahasa (English dan Indonesia). Hugo secara otomatis akan membuat jalur URL /en/ dan /id/

<code>_index.md </code>: Penambahan file penting yang mendefinisikan metadata untuk halaman utama folder(misalnya judul kategori "Projects").

<code>posts/</code> vs <code> projects/</code>: Pemisahan ini sebagai Content Sections. Saya menggunakan ini untuk membedakan konten antara blog  dan proyek.
</div>

#### B. layouts/
<div style="padding-left: 20px;">
Ini adalah tempat saya "memerintah" Hugo untuk berperilaku di luar standar tema.
<code>shortcodes/</code>: Di sini terdapat file seperti <code>mermaid.html</code> atau <code>collapse.html</code>. Shortcode adalah cara saya memasukkan elemen atau atribute ke dalam Markdown tanpa menulis HTML panjang.

Contoh: Untuk membuat diagram, saya cukup memanggil di Markdown.

<code>partials/extend_head.html</code>: Digunakan untuk menyuntikkan kode tambahan ke dalam bagian website tanpa mengacak-acak file tema.
</div>


#### C. static/ vs assets/
<div style="padding-left: 20px;">
Dua folder ini bikin saya bingung sebenernya tapi ternyata fungsinya sangat berbeda:
<code>static/images/</code>: Semua file di sini akan disalin apa adanya ke folder public. Ini saya gunakan untuk menyimpan foto profil atau aset yang ngga perlu diproses.

<code>assets/css/</code>: File di sini akan diproses oleh Hugo (misalnya di-minify atau digabung) sebelum dipublish, tujuannya untuk mempercepat loading web.
</div>

#### D. public/ (Output)
<div style="padding-left: 20px;">
Ini adalah folder paling penting ketika web sudah "online".
Ini adalah hasil "masakan" Hugo. Semua file Markdown akhirnya berubah menjadi HTML murni.
Direktori inilah yang sebenarnya dibaca oleh Cloudflare Pages. Cloudflare tidak membaca folder content, mereka hanya menyajikan apa yang ada di dalam public.

Dalam prakteknya, saya tidak mendorong direktori <code>public</code> ke GitHub. Karena Cloudflare bakal menjalankan perintah Hugo diserver mereka. Hugo hanya mengunduh (clone) bahan mentah dari GitHub yang di push ke server mereka. Karenanya di pengaturan Cloudflare Pages diminta memasukkan Build Command <code>hugo --gc --minify</code>.
</div>
</div>

### 5. Integrasi GitHub & CI/CD (Continuous Integration)
<div style="padding-left: 26px;">
GitHub bukan sekadar tempat menyimpan kode (backup), tapi disini bertindak sebagai pemicu otomatisasi. 

- **Push Data**: Saat saya melakukan git push dari VS Code di PC atau melalui commit di HP.
- **Webhook**: GitHub mengirim sinyal ke Cloudflare Pages.
- **Build Process**: Cloudflare akan menjalankan mesin Hugo di server mereka: <code>hugo --gc --minify</code>
- **Deployment**: Jika tidak ada error pada kode, hasil di directory public yang di'masak' oleh Cloudflare langsung disebarkan ke seluruh edge computing Cloudflare di dunia dalam waktu yang sangat cepat.

Ini settingan Cloudflare Pages:
![Setting](/images/cloudflare_setting.JPG)
</div>


### 6. Ringkasan Teknis 
<div style="padding-left: 26px;">

| Komponen | Teknologi | Peran |
| :--- | :---: | :--- |
| Engine | Hugo | Generator file statis dari Markdown |
| Config | TOML | Pengaturan global dan multibahasa |
| Repository | GitHub | Manajemen versi dan pemicu otomatisasi |
| Hosting | Cloudflare Pages | CDN, SSL, dan penyaji file global |
| Domain | CPanel DNS | Penghubung identitas domain pribadi |

</div>
