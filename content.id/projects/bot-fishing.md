---
title: "Bot-Mancing: Sistem Analisis Cuaca dan Identifikasi Spesies Secara Real-Time"
date: 2026-05-21T19:25:00+10:00
tags: ["cloud", "vps", "jaringan", "sydney", "mancing"]
categories: ["dokumentasi"]
---

### Latar Belakang
Sudah lebih dari tiga tahun saya menekuni hobi memancing. Berawal dari sekadar iseng saat piknik di pantai bersama keluarga dan teman-teman, hingga sampai akhirnya dua tahun terakhir ini memancing telah berubah menjadi sesuatu yang lebih mendalam. Memancing bukan lagi sekadar pengisi waktu luang, melainkan sebuah olahraga dan game-fishing.

Karena itu, fokus saya lebih dari sekedar pada perangkat pancing atau apparel yang tepat. Variabel lain seperti pengetahuan mendalam untuk membaca cuaca dan informasi jenis hasil tangkapan kini menjadi hal yang wajib diketahui.

Mengapa hal tersebut begitu krusial? Sebab, hampir seluruh aktivitas land-based game-fishing ini dilakukan di area tebing batu (rock/ledge) di sekitar Sydney. Medan seperti ini menyimpan risiko besar, sehingga keselamatan menjadi hal mendasar yang tidak bisa ditawar. Selain itu, regulasi memancing di New South Wales (NSW) sangatlah ketat, sementara beberapa spesies hasil tangkapan memiliki karakteristik yang sulit diidentifikasi secara visual. Dalam kondisi yang membutuhkan keputusan yang tepat seperti ini, kehadiran sebuah medium yang simpel, instan, dan akurat untuk menyajikan informasi mutlak diperlukan.

### Masalah

**Friksi Data Mentah**: Tantangan utama bagi pemancing adalah keharusan membuka berbagai platform mentah, seperti data teks atau grafik dari Bureau of Meteorology / BOM, kemudian dibandingkan dengan WillyWeather atau Fishing Point secara terpisah.

**Interpretasi Manual**: Saya sering kali kesulitan menginterpretasikan data tersebut secara cepat sebelum berangkat. Kelalaian dalam membaca anomali data, seperti potensi datangnya rogue waves (ombak liar) bisa berakibat fatal untuk saya.

### Solusi
**Jembatan Informasi Otomatis**: Proyek Bot-Mancing dibangun sebagai sistem otomasi analitik cuaca di pesisir Australia  yang menjembatani data cuaca mentah dan identifikasi spesies berbasis teks dan gambar ke WhatsApp secara on-demand.

**Decoupled Architecture**: Sistem dipisahkan oleh tiga fungsi pemrosesan yaitu:

1. **Messaging Gateway (Node.js)**: Bertindak sebagai pintu masuk instruksi teks (`/cek [lokasi]`) maupun interaksi berbasis gambar (`/spesies` + lampiran foto) dari WhatsApp. 

2. **Data Ingestion Engine (Python)**: Untuk menarik, menyaring, dan menyusun data maritim mentah.

3. **Generative AI**: Bertindak sebagai analisis ganda.Memanfaatkan Large Language Model (`Gemini-3-Flash`) untuk melakukan analisis prediktif, taktis, dan kontekstual dari data cuaca yang telah disusun oleh Python. Dan memanfaatkan kemampuan Computer Vision untuk memproses gambar/foto hasil tangkapan yang di upload oleh user secara real-time.

### Output
User cukup menggunakan WhatsApp untuk dua skenario utama:
1. **Skenario A**: Pemantauan Cuaca (`/cek [lokasi]`)  
Sistem langsung mengembalikan laporan cuaca, analisis gelombang, analisis keselamatan, hingga prediksi fish activity hour berdasarkan elongasi bulan terhadap bumi.

    ```Bash
    /cek manly
    ```
{{< collapse title="Output Cuaca" collapse="true" >}}
![2](/images/projects/bot-mancing/cuaca.jpg)
{{< /collapse >}}

2. **Skenario B**: Identifikasi Spesies (`/spesies` + Foto).  
User meng-upload-nya foto hasil tangkapan ke WhatsApp, dan mengetik caption:
    ```Bash
    /spesies
    ```
{{< collapse title="Output Identifikasi" collapse="true" >}}
![1](/images/projects/bot-mancing/spesies.jpg)
{{< /collapse >}}