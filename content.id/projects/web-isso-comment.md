---
title: "Setup Isso-Comments dengan AWS EC2 & Cloudflare"
translationKey: "web-isso-comment"
date: 2026-05-19T18:50:00+10:00
tags: ["sydney", "dokumentasi", "website", "isso-comments", "hugo"]
categories: ["dokumentasi"]
---

### Pendahuluan  
Untuk menambahkan komentar pada web ini sangat menantang, dikarenakan web ini statis, artinya jika saya ingin menambahkan fitur tersebut maka saya butuh database untuk menampung konten yang masuk dari guest.  

Ada beberapa pilihan layanan platform komentar dari yang berbayar sampai gratis. Beberapa sudah saya coba, seperti Remark24, instalasi mudah tapi sulit sekali di modifikasi front end nya. Akhirnya pilihan ke <a href="https://isso-comments.de/" target="_blank" rel="noopener">isso-comments</a>, alasanya karena simpel, clean, dan mudah dimodifikasi tampilannya.

### Metode
Setup AWS EC2 dengan pengaturan default, saya menggunakan Linux Ubuntu dengan instace tipe t3.micro. Untuk pengaturan DNS-nya, saya menghubungkan dengan tunnel di cloudflare yang terinstall di EC2. Jadi ketika ada kondisi IP publiknya berubah, maka tersinkronisasi secara otomatis ke Cloudflare. Nanti saya akan breakdown detail teknisnya dibawah.

### Breakdown Cloudflare di Dashboard
#### Setup Cloudflare tunnel
Alasan saya menggunakan Cloudflare sebetulnya pengen coba-coba tunnel.. hehe. Alih-alih request langsung ke EC2 (inbound) melalui port 80/443, tapi ini justru melalui Cloudflare terlebih dahulu lalu melalui tunnel ke EC2. Dan untuk koneksi keluar (Outbound Tunnel), EC2 langsung menuju data center Cloudflare terdekat.  
Dari yang saya baca-baca, Cloudflare ini anak menggenerate
SSL dari request yang masuk, artinya koneksi dari web dienkripsi oleh Cloudflare (https://issocomment.adiendendra.com) lalu ke EC2.

Setup di Cloudflare sebagai berikut 
1. Nama: `isso-aws`
2.  Install Connector:
    *   Pilih tab *Linux* > *AMD64*
3.  Route Traffic:
    *   Subdomain: `issocomment`
    *   Domain: `adiendendra.com`
    *   Service: Type: `HTTP` | URL: `localhost:8080`

Hasil publish seperti ini
![1](/images/projects/web-isso-comment/isso_cloudflare_connectors.jpg)


### Breakdown instalasi Cloudflare dan Docker Isso di AWS EC2
#### Konfigurasi Cloudflared di EC2
Perintah ini digunakan untuk menginstal cloudflared sebagai background service (daemon) di EC2. Begitu service ini dijalankan, agen cloudflared akan otomatis membuka koneksi keluar (outbound tunnel), menuju edge network Cloudflare hingga statusnya berubah menjadi HEALTHY.

Dengan arsitektur ini, Cloudflare dapat meneruskan request publik dari subdomain langsung ke port lokal Docker Isso tanpa perlu membuka Inbound Port 80/443 pada Security Group di EC2.

```Bash
# download paket cloudflared ke Ubuntu
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# install paketnya ke sistem di EC2
sudo dpkg -i cloudflared.deb

# jalankan sistem service dengan token yg diberi dari cloudflare
sudo cloudflared service install ********************* (nomor token)
```

#### Struktur Direktori Isso
Saya membuat struktur file dan directory Isso di AWS EC2 seperti ini
![1](/images/projects/web-isso-comment/docker.png)

#### Instalasi docker pada AWS EC2
Untuk memudahkan proses pemasangan Isso-Comment di EC2. Karena dengan adanya docker Isso akan terbungkus rapi dalam kontainer yang sudah ada Python dari versi yang tepat, dan library yang pas. Selain itu isolasi runtime Python tidak mengotori OS utama EC2, dan mempermudah manajemen persistent storage (comments.db) lewat Docker Volumes.
```python
sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker
```
#### Konfigurasi database comment.db
Untuk pengaturan database, Isso membuatnya sendiri jika file database belum ada dan Isso secara otomatis menyusun skema tabel internalnya (kolom komentar, email, timestamp, dll) saat kontainer pertama kali dijalankan.

Saat docker-compose berjalan, kontainer Isso beroperasi di dalam isolated environment menggunakan user internal dengan User ID (UID) 1000 dan Group ID (GID) 1000 (bukan sebagai root).

Agar kontainer Isso memiliki izin untuk membuat file comments.db tersebut di dalam host (EC2), perlu adanya folder direktori induknya terlebih dahulu dan mengubah kepemilikannya ke UID/GID 1000 menggunakan perintah:
```python
mkdir -p db
sudo chown -R 1000:1000 db
```
Dengan begitu, saat kontainer Isso menyala dengan menjalankan `docker compose up -d`, dia tidak akan terkena error *Permission Denied* dan bisa membuat serta menulis file *comments.db* secara otomatis di dalam folder tersebut.

#### Konfigurasi isso.conf 
File ini sebagai host untuk berbagai parameter dibawah ini, selain itu file ini juga ini memberi tahu Isso di mana dia harus membuat dan membaca file database SQLite (comments.db)

```Bash
[general]
dbpath = /db/comments.db
host = https://architect.adiendendra.com/
notify = smtp
max-age = 0 # tidak ada waktu jeda untuk komentator utk menghapus/mengedit komentar
reply-to-self = true

## Buat forwarder ke email tiap ada yang membalas di komentar
[smtp]
host = smtp.gmail.com
port = 587
security = starttls
timeout = 10

# Akun email pengirim
username = adien.dendra@gmail.com
password = *****************

# Isi detail pengiriman
from = "Isso Comments" <adien.dendra@gmail.com>
to = hello@adiendendra.com

[server]
listen = http://0.0.0.0:8080
public-endpoint = https://issocomment.adiendendra.com
ssl = true

# approval sebelum oleh admin sebelum komentar dirilis ke website
[moderation]
enabled = true

[admin]
enabled = true
password = ***********

[guard]
enabled = true
require-author = false
require-email = false  
```

#### Konfigurasi docker-compose.yml
Fungsi utama docker-compose.yml adalah untuk merangkum semua perintah config dan db dalam satu file. 

```yaml
services:
  isso:
    image: machines/isso
    container_name: isso
    restart: always
    environment:
      - UID=1000 # sudo chown pada db file
      - GID=1000
    volumes:
      - ./config:/config # menghubungkan file didalam config dir
      - ./db:/db  # menghubungkan file didalam db dir
      - /etc/localtime:/etc/localtime:ro # mengganti waktu server UTC EC2 ke lokal sydney
      - /etc/timezone:/etc/timezone:ro # mengganti timezone server ke lokal sydney
    ports:
      - "8080:8080" 
```

#### Running Docker
```Bash
sudo docker compose up -d # -d untuk detached mode
```

