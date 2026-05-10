---
title: "Migrasi dan Efisiensi Web Dari 1.2 GB ke 11.2 MB! Gila!"
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

### 1. Pembukaan 

<div style="padding-left: 26px;">
Mencari alternatif pilihan agar mendapatkan layanan website yang se efisien mungkin dari segi biaya dan ongkos yang murah tiap DTI/DTO (Data Transfer In/Out). Plan saya mengganti shared hosting + domain dari <a href="https://sosys.net/" target="_blank" rel="noopener">sosys.net</a> dengan AWS S3 sebagai storage statis, Cloudflare untuk managing DNS dan migrasi domain menjadi adiendendra.com.au agar terlihat lebih lokal.
</div>

### 2. Masalah

<div style="padding-left: 26px;">
Saat ini menggunakan share hosting + domain dikenakan biaya Rp. 700rb/tahun. Biaya relatif murah sebetulnya, tapi sayangnya web lambat dan tidak stabil, beberapa kali domain saya adiendendra.com sempat terlempar ke website lain di server yang sama (eldersleamanor.co.nz)
</div>

### 3. Metode

<div style="padding-left: 26px;">
Hosting dan domain website akan saya pindahkan ke server lain, tidak lagi menggunakan sosys.net. Banyak pilihan alternatif diluar sana yang jauh lebih cepat dan efisien dari segi harga. Untuk domain, saya akan mencari alternatif resources lain yang lebih murah per-tahunnya. Metodenya saya akan saya jelaskan secara terperinci.

#### A. Strategi Download database ke lokal
<div style="padding-left: 20px;">

- Plan saat ini adalah, menjadikan website saya statis. Artinya pengelolaan database ada di komputer lokal, lalu "mengekspornya" menjadi file statis ke server lain.
- Karena website saya menggunakan wordpress, maka saya akan menginstall <a href="https://localwp.com/" target="_blank" rel="noopener">LocalWP</a> dan <a href="https://www.httrack.com/" target="_blank" rel="noopener">httrack</a> dahulu di PC saya.
- Database: export file .sql ke lokal PC melalui phpMyAdmin di CPanel.
- Aset: Download folder /wp-content/uploads. Karena foto dan gambar di website terkumpul didirektori tersebut.
- Cleanup: File inti WordPress (wp-admin, wp-includes) saya tidak download dari, karena saya bisa menggunakan versi bersih dari LocalWP.

</div>

#### B. Pilihan Server

<div style="padding-left: 20px;">
Sebetulnya pilihan ada dua, antara ke AWS S3 atau Cloudflare. Tetapi karena saya sedang belajar AWS Cloud maka saya akan gunakan AWS S3 sebagai mediumnya. Dari yang saya baca-baca, AWS S3 ini sangat kuat. Ia didesain untuk menangani ribuan request per detik secara simultan. Untuk kebutuhan portofolio web, saya yakin tidak akan pernah merasakan "lemot" karena batasan bandwidth server.
</div>


### 4. Biaya
<div style="padding-left: 26px;">

#### A. Hosting

<div style="padding-left: 20px;">
Setelah dihitung-hitung saya memutuskan untuk menggunakan AWS S3 Free tier. Dengan alasan sebagai berikut:

- *Free Tier*: AWS memberikan 5 GB penyimpanan S3 secara gratis selama 12 bulan pertama sejak saya mendaftar akun AWS. Karena total data website saya saat ini 1.2 GB, maka masih masuk dalam kuota gratis.
- *Cost Setelah 12 Bulan*: Jika masa free tier sudah habis, saya akan mulai dikenakan biaya. Dari informasi yang saya dapatkan, untuk data sebesar 1.2 GB di region Sydney (ap-southeast-2):
  - Harga standar AWS S3 sekitar $0.025 per GB per bulan.
  - Estimasi biaya: 1.2 GB x $0.025 = $0.03 USD per bulan (sekitar Rp 550,- per bulan).
  - Artinya, biaya tahunannya hanya sekitar $0.36 USD (kurang dari Rp 10.000,-).
- *Data transfer*: Secara teknis ternyata tidak ada batasan jumlah data yang bisa mengalir (unlimited flow), tetapi ada aturan biayanya:
  - Data Transfer IN (Upload): Gratis. Kamu bisa upload file 1.8 GB tadi sebanyak apa pun tanpa biaya bandwidth.
  - Data Transfer OUT (Download ke internet): Berbayar. Jika ada orang yang membuka website saya, artinya ada orang yang mengakses AWS S3 ke ke komputer merek (lewat publik), nah disini, AWS akan menagih biaya per GB. 
  - Free Tier: AWS memberikan 100 GB per bulan gratis untuk Data Transfer Out ke internet. Namun, karena arsip saya maksimal cuma 1.8 GB, asumsinya selama tidak terdownload bolak-balik sebanyak 50 kali dalam sebulan, saya tidak akan membayar sepeser pun untuk bandwidth. Misalkan total ukuran halaman depan website saya (termasuk gambar-gambar di dalamnya) adalah 2 MB.




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
