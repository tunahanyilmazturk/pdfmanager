# HanTech PDF Manager

Toplu PDF yonetimi, duzenleme ve cikti alma uygulamasi.

## Ozellikler

- PDF Yukleme (dosya secici + surukle-birak)
- PDF Listeleme, sirala, ara, filtrele
- PDF Bilgi Paneli (sayfa sayisi, metadata, yazar vb.)
- Surukle-Birak ile Siralama
- Toplu Yazdirma (yazici secimi, kopya sayisi)
- PDF Birlestirme (pdf-lib ile)
- Sayfa Ayirma / Cikarma
- Sayfa Silme
- PDF Icinde Metin Arama
- Toplu Yeniden Adlandirma (prefix, tarih, sayi)
- Kategori Yonetimi (ekle, sil, filtrele)
- Oturum Kaydetme / Yukleme
- Koyu Tema
- Gelismis Hata Yonetimi (kopyalama, log, rapor)

## Kurulum

### Gereksinimler
- Node.js v20+ 
- npm v9+

### Indir ve Calistir

```bash
git clone https://github.com/tunahan/hantech-pdf-manager.git
cd hantech-pdf-manager
npm install
npm run dev
```

### Build Alma (Windows exe)

```bash
npm run build
```

## Proje Yapisi

```
hantech-pdf-manager/
├── backend/
│   ├── main.js              # Electron entry point
│   ├── services/             # Is mantigi
│   │   ├── pdf.service.js
│   │   ├── print.service.js
│   │   ├── merge.service.js
│   │   ├── search.service.js
│   │   ├── fileops.service.js
│   │   ├── session.service.js
│   │   ├── category.service.js
│   │   └── error.service.js
│   └── ipc/                  # IPC handler'lari
│       ├── pdf.ipc.js
│       ├── print.ipc.js
│       ├── merge.ipc.js
│       ├── search.ipc.js
│       ├── fileops.ipc.js
│       ├── file.ipc.js
│       ├── session.ipc.js
│       ├── category.ipc.js
│       └── error.ipc.js
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── modals.css
│   │   └── error.css
│   └── js/
│       ├── state.js
│       ├── utils.js
│       ├── sendMessage.js
│       ├── errorHandler.js
│       ├── pdfActions.js
│       ├── uiRenderer.js
│       ├── listRenderer.js
│       ├── infoPanel.js
│       ├── printActions.js
│       ├── dragDrop.js
│       ├── modalManager.js
│       ├── bulkActions.js
│       ├── sessionManager.js
│       └── app.js
├── preload.js
├── package.json
└── .gitignore
```

## Lisans

MIT - HanTech
