---
title: "Migrasi dan Efisiensi Web Dari 1.2 GB ke 11.2 MB! Gila!"
translationKey: "web-adiendendra.documentation"
date: 2026-05-13T21:50:00+10:00
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

### Pendahuluan 
Website <a href="https://adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> sangat lambat dan tidak ada TLS, karenanya saya mencoba untuk mencari alternatif pilihan agar mendapatkan layanan website yang se efisien mungkin dari segi biaya, aman dan ongkos yang murah tiap DTI/DTO (Data Transfer In/Out). Akhirnya, saya memutuskan untuk mengganti shared hosting + domain dari <a href="https://sosys.net/" target="_blank" rel="noopener">sosys.net</a> dengan AWS S3 sebagai storage statis, Cloudflare untuk managing DNS+TLS dan rencananya akan bermigrasi domain menjadi *adiendendra.com.au* agar terlihat lebih lokal.

### Masalah
Saat ini menggunakan share hosting + domain dikenakan biaya Rp. 700rb/tahun. Biaya relatif murah sebetulnya, tapi sayangnya web lambat dan tidak stabil, beberapa kali domain <a href="https://adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> sempat terlempar ke website lain di server yang sama (eldersleamanor.co.nz).

### Metode
Hosting dan domain website akan saya pindahkan ke server lain, tidak lagi menggunakan sosys.net. Banyak pilihan alternatif diluar sana yang jauh lebih cepat dan efisien dari segi harga. Untuk domain, saya akan mencari alternatif resources lain yang lebih murah per-tahunnya. Metodenya saya akan saya jelaskan secara terperinci.

#### 1. Strategi Download database ke lokal
- Plan saat ini adalah, menjadikan website saya statis. Artinya pengelolaan database ada di komputer lokal, lalu "mengekspornya" menjadi file statis ke server lain.
- Karena website saya menggunakan wordpress, maka saya akan menginstall <a href="https://localwp.com/" target="_blank" rel="noopener">LocalWP</a> dan <a href="https://www.httrack.com/" target="_blank" rel="noopener">httrack</a> dahulu di PC saya.
- Database: export file .sql ke lokal PC melalui phpMyAdmin di CPanel.
- Aset: Download folder /wp-content/uploads. Karena foto dan gambar di website terkumpul didirektori tersebut.
- Cleanup: File inti WordPress (wp-admin, wp-includes) saya tidak download dari CPanel, karena saya bisa menggunakan versi bersih dari LocalWP.

#### 2. Pilihan Server
Sebetulnya pilihan ada dua, antara ke AWS S3 atau Cloudflare. Tetapi karena saya sedang belajar AWS Cloud maka saya akan gunakan AWS S3 sebagai mediumnya. Dari yang saya baca-baca, AWS S3 ini sangat kuat. Ia didesain untuk menangani ribuan request per detik secara simultan. Untuk kebutuhan portofolio web, saya yakin tidak akan pernah merasakan "lemot" karena batasan bandwidth server.


### Hosting
Setelah dihitung-hitung saya memutuskan untuk menggunakan AWS S3 Free tier. Dengan alasan sebagai berikut:
#### 1. Biaya  
- *Free Tier*: AWS memberikan 5 GB penyimpanan S3 secara gratis selama 12 bulan pertama sejak saya mendaftar akun AWS. Karena total data website saya saat ini 1.2 GB, maka masih masuk dalam kuota gratis.
- *Cost Setelah 12 Bulan*: Jika masa free tier sudah habis, saya akan mulai dikenakan biaya. Dari informasi yang saya dapatkan, untuk data sebesar 1.2 GB di region Sydney (ap-southeast-2):
  - Harga standar AWS S3 sekitar 0.025 USD per GB per bulan.
  - Estimasi biaya: 1.2 GB x 0.025 USD = 0.03 USD per bulan (sekitar Rp 550,- per bulan).
  - Artinya, biaya tahunannya hanya sekitar 0.36 USD (kurang dari Rp 10.000,-).
- *Data transfer*: Secara teknis ternyata tidak ada batasan jumlah data yang bisa mengalir (unlimited flow), tetapi ada aturan biayanya:
  - Data Transfer IN (Upload): Ternyata gratis. Saya bisa upload file 1.2 GB tadi sebanyak apa pun tanpa biaya bandwidth.
  - Data Transfer OUT (Download ke internet): Berbayar. Jika ada orang yang membuka website saya, artinya ada orang yang mengakses AWS S3 ke ke komputer lewat publik, nah disini, AWS akan menagih biaya per GB. 
  - Free Tier: Dari yang saya baca, AWS memberikan 100 GB per bulan gratis untuk Data Transfer Out ke internet. Namun, karena arsip saya maksimal cuma 1.2 GB, asumsinya selama tidak terdownload bolak-balik sebanyak 50 kali dalam sebulan, saya tidak akan membayar sepeser pun untuk bandwidth. Misalkan total ukuran halaman depan website saya (termasuk gambar-gambar di dalamnya) adalah 2 MB.
  - Jika 1 orang mengunjungi web: DTO = 2 MB.
  - Jika 500 orang mengunjungi web: DTO = 1.000 MB (1 GB).
  - Kabar baiknya AWS memberikan jatah gratis 100 GB per bulan untuk Data Transfer Out selamanya (bukan cuma di tahun pertama).

Ada satu perhatian khusus dalam AWS S3 ini, yaitu merujuk istilah PUT/GET Requests.
- *PUT*: Biaya saat unggahan file.
- *GET*: Biaya setiap kali ada orang yang "meminta" file tersebut untuk ditampilkan di browser. Nah, Free Tier memberikan 2.000 request PUT dan 20.000 request GET per bulan.

#### 2. Strategi lanjutan jika kuota free tier 100 GB habis

Jika kuota 100 GB per bulan (jatah gratis selamanya dari AWS) terlampaui, maka perhitungannya masuk ke skema *Tiered Pricing*.
Dari data yang saya dapatkan berikut adalah simulasi biaya untuk region Sydney (ap-southeast-2):
- Tarif Standar DTO (Data Transfer Out)
  Setelah melewati 100 GB pertama yang gratis, tarif berikutnya adalah:
  - Harga standar AWS S3 sekitar 0.025 USD per GB per bulan.
  - 100 GB sampai 10 TB berikutnya: ~0.114 USD per GB

- Simulasi Perhitungan
  Misalkan dalam satu bulan website ramai dan total keluar data mencapai 150 GB.
  - 100 GB pertama: 0 USD (Gratis).
  - Sisa 50 GB: 50 GB x 0.114 USD = 5.70 USD (Sekitar Rp 90.000,-).

#### 3. Strategi untuk menghindari Biaya lanjutan

Setelah saya baca-baca, ternyata di AWS ada biaya DTO yang jauh lebih murah bahkan bisa 0 USD jika dikombinasikan dengan benar:
- *AWS CloudFront (CDN)*: Jika saya berstrategi menggunakan CloudFront di depan S3, AWS memberikan jatah 1 TB (1.000 GB) transfer data keluar secara gratis setiap bulan. Ini jauh lebih besar daripada jatah S3 murni. Jadi, hampir bisa dipastikan web saya akan tetap 0 USD selamanya.
- *Cloudflare (Egress Filtering)*: Jika S3 terhubung dengan Cloudflare melalui Cloudflare R2 atau menggunakan S3 Proxy, Cloudflare akan mengambil data dari AWS sekali saja, lalu menyebarkannya ke ribuan pengunjung dari server mereka sendiri. Jadi saya hanya kena biaya 1 kali ambil data.

Tapi, melihat dari strategi dan kondisi data saya diatas, sepertinya tidak perlu sampai melakukan strategi nomor 3. Just in case saja.

### Domain
Hosting dan domain dari sosys.net akan berakhir pada 25 Februari 2027, sementara saya migrasi hosting saja, manfaatkan domainnya sebelum saya akhirnya membeli domain baru di registrar lain. Mungkin saya akan memanfaatkan harga promo ditahun pertama dari GoDaddy atau Namecheap, walaupun nanti harganya harganya akan menjadi normal (15 USD - 20 USD) saat perpanjangan di tahun kedua. Tapi ngga apa-apa, tetap masih lebih efisien dibandingkan dengan saya beli shared hosting + domain. Atau sebagai alternatif saya akan beli domain di registrar lokal Australia dan mengganti domain dengan .com.au

### Breakdown Teknis
#### 1. Export database melalui phpMyAdmin CPanel

{{< collapse title="export database" collapse="true">}}
![1](/images/projects/web-adiendendra-documentation/1.Download_database.JPG)
{{< /collapse >}}

#### 2. Export material website
Hanya 3 directory yang di export
- uploads
- themes
- plugins

{{< collapse title="export material" collapse="true">}}
![1](/images/projects/web-adiendendra-documentation/2.compress_updoad.JPG)
{{< /collapse >}}

#### 3. Download dan Install Local WP
Setup default untuk Local WP, mesti diperhatikan versi PHP, saya menggunakan 7.4.30. Karena php saya tidak jalan di versi 8. Kemudian replace ketiga directory ke tempat dimana Local WP terinstall.

{{< collapse title="local wp" collapse="true">}}
![3](/images/projects/web-adiendendra-documentation/3.localWP.JPG)
![4](/images/projects/web-adiendendra-documentation/3.replace_upload.JPG)
![4A](/images/projects/web-adiendendra-documentation/9.change_php_version.JPG)
{{< /collapse >}}

#### 4. Import Database
Local WP secara otomatis akan mengarahkan database kita tinggal mengimportnya saja.

{{< collapse title="database" collapse="true">}}
![5](/images/projects/web-adiendendra-documentation/5.import_databes.JPG)
{{< /collapse >}}

#### 5. Nama Site dan table prefix
Ubah nama site dari localhost ke nama domain. Kemudian, karena case saya database menggunakan prefix wpvb dari CPanel, maka saya mesti mengubah prefixnya.

{{< collapse title="site & table prefix" collapse="true">}}
![7](/images/projects/web-adiendendra-documentation/6.ubah_nama_site.JPG)
![8](/images/projects/web-adiendendra-documentation/7.tableprefix_diubah.JPG)
{{< /collapse >}}

#### 6. Debug
Memastikan untuk error return, jadi lebih mudah untuk di debug

{{< collapse title="debug" collapse="true">}}
![9](/images/projects/web-adiendendra-documentation/8.debug_display.JPG)
{{< /collapse >}}


#### 7. HTTrack
Install HT Track, fungsi apps ini adalah untuk 'memasak' web menjadi statis.
{{< collapse title="HTTrack" collapse="true">}}
![10](/images/projects/web-adiendendra-documentation/11.HTdownload.JPG)
![11](/images/projects/web-adiendendra-documentation/12.log.JPG)
{{< /collapse >}}

#### 8. AWS S3
Jalankan bucket untuk S3. Seperti yang saya sebutkan sebelumnya, bucket S3 ini sebagai penyimpan data web statis.
{{< collapse title="bucket" collapse="true">}}
![12](/images/projects/web-adiendendra-documentation/14.bucket_AWS_S3.JPG)
![13](/images/projects/web-adiendendra-documentation/15.bucket_setup.JPG)
{{< /collapse >}}

#### 9. AWS CLI (Command Line Interface)
Cara mudah untuk mengakses bucket di S3 ialah melalui AWS CLI. Untuk dapat masuk kesana, kita harus menggenerate Access Key dan Security key yang ada di S3. Disini saya beri contoh untuk mengsinkronisasikan update file dari lokal PC saya ke S3.
{{< collapse title="cli" collapse="true">}}
![12](/images/projects/web-adiendendra-documentation/17.aws_configure.JPG)
![13](/images/projects/web-adiendendra-documentation/18.lokal_sync_s3.JPG)
{{< /collapse >}}

### Kesimpulan
Setelah web di 'masak' menjadi static, total kapasitas datanya turun jauh sehingga menjadi 11.2 MB! Sangat signifikan sekali bedanya yang sebelumnya 1.2 GB tertampung di CPanel dengan fitur-fitur dari Wordpress yang menurut saya banyak yang kurang penting untuk web portofolio.

Kini website <a href="https://adiendendra.com/" target="_blank" rel="noopener">adiendendra.com</a> berjalan mulus dan sempurna diatas infrastruktur AWS S3, memberikan tingkat durabilitas data hingga 99% yang pastinya dapat menangani skalabilitas tanpa risiko downtime. 

Selain itu ditambah juga dengan integrasi Cloudflare DNS. Cloudflare yang memiliki teknologi Edge Computing yang dapat memastikan latensi yang sangat rendah bagi pengunjung global. Sehingga strategi caching di level Edge membuat web adiendendra.com jauh lebih ringan karena didistribusikan dari pusat data terdekat dengan pengguna. Hal ini secara signifikan akan meningkatkan kecepatan load serta meminimalisir biaya tambahan tagihan AWS S3 setelah free-tier saya habis!