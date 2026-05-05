---
title: "Dokumentasi Markdown"
translationKey: "view-documentation"
date: 2026-05-04T17:58:00+10:00
tags: ["sydney", "dokumentasi", "perjalanan", "mancing", "keluarga"]
categories: ["dokumentasi"]
author: "Adien Dendra"
ShowToc: true
TocOpen: false
---
{{< collapse title="Python format" collapse="true" >}}
```python
def solve_creature_rig(node):
    print(f"Processing: {node}")
    return True
```
{{< /collapse >}}

<div align="center">
  Diagram mermaid ini berada <mark>ditengah</mark>.
</div>

{{< mermaid >}}
graph TD;
    A[Data dari Open-meteo] -->|Kirim Data| B(Cloud Server);
    B --> C{Deteksi Bahaya?};
    C -->|Ya| D[Kirim Notifikasi ke HP];
    C -->|Tidak| E[Log ke Database];
{{< /mermaid >}}

{{< mermaid >}}
graph LR
    A[Mulai] --> B(Proses 1)
    B --> C{Keputusan}
    C -->|Ya| D[Selesai]
    C -->|Tidak| E[Ulangi]
{{< /mermaid >}}

```markdown
Penjelasan Kode Arah:
Selain LR, ada beberapa opsi arah lainnya di Mermaid:
LR (Left to Right): Diagram memanjang ke samping (kiri ke kanan).
RL (Right to Left): Diagram memanjang dari kanan ke kiri.
TB atau TD (Top to Bottom / Top Down): Diagram memanjang ke bawah (default).
BT (Bottom to Top): Diagram memanjang dari bawah ke atas.
```

{{< collapse title="Katex format" >}}
```\small (sedikit lebih kecil)
\footnotesize (ukuran catatan kaki)
\scriptsize (cukup kecil)
\tiny (paling kecil)
```
Rumus dasar energi adalah $\scriptsize E = mc^2$
$$
\small \text{CloudCost} = \sum_{i=1}^{n} (\text{Instance}_{i} \times \text{Hours})
$$
{{< /collapse >}}


{{< collapse title="Syntax Markdown" collapse="true">}}
# Heading 1 (Paling Besar)
## Heading 2
### Heading 3
#### Heading 4

- Item satu
- Item dua
  - Sub-item (kasih spasi/tab)

## 1. Pendahuluan
Ini adalah paragraf dengan teks **Tebal** dan *Miring*. Jangan lupa cek ~~isi yang lain~~.

## 2. Unordered list
* Rod
* Reel
* Life Jacket

## 3. Ordered list
1. Pakai helm.
2. Cek kiri-kanan.
3. Gas!

> Catatan: Keluarga adalah prioritas utama

1. Pertama
    2. Kedua
    3. Ketiga

### 4. Nested Unodered list
- Peralatan Safety Memancing
  - Life Jacket
  - Cleat
    - Ukuran XL
    - Ukuran L
- Peralatan Medis

### 5. Nested ordered list
1. Tahap Persiapan
   1. Cek Reel
   2. Cek Rod
2. Jalan ke spot
   1. Casting!

### 6. Mix
1. Daftar Belanja
   - Kertas A4
   - Tinta Printer
2. Daftar Tugas
   - Kirim Email
   - Update Website

- [x] Tugas selesai
- [ ] Tugas belum selesai

### 7. Ukuran Font
Di Markdown standar **tidak bisa** mengubah ukuran font secara bebas (seperti di Word). Ukuran diatur oleh **Heading**.
*   Jika ingin teks yang lebih kecil, biasanya menggunakan Heading yang lebih dalam (seperti `####`).
*   Jika ingin kustomisasi total, markdown harus menggunakan tag HTML: `<span style="font-size:20px">Teks Besar</span>`.

### 8. Blockquotes (Kutipan)
Gunakan tanda lebih besar `>`.
```markdown
> "Arsitektur cloud yang baik adalah yang aman dan efisien."
```
### 9. Table
```markdown
Align (Perataan):
:--- : Rata Kiri (Default)
:---: : Rata Tengah (Center)
---: : Rata Kanan
```
| No | Komponen | Status |
| :--- | :---: | ---: |
| 1 | Alat pancing | **OK** |
| 2 | Rod dan reel | *Maintenance* |
| 3 | Live vest dan cleat | ~~Rusak~~ |

### 10. Inline Markdown dalam Tabel
| Format | Contoh Penulisan |
| :--- | :--- |
| **Bold** | `**Tebal**` |
| *Italic* | `*Miring*` |
| `Code` | `` `Code` `` |
| [Link](https://google.com) | `[Link](url)` |

{{< collapse title="11. Collapse Expand" >}}
Semua rahasia ada di sini...
{{< /collapse >}}
{{< /collapse >}}

---