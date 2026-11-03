# App Store ekran görüntüleri

Gerçek oyun durumlarından üretilir. Sıra: kayıt üret → yakala → çerçevele.

```bash
npm run build:web
```

```bash
node design/screenshots/seed.js
```

```bash
NODE_PATH=/opt/node22/lib/node_modules node design/screenshots/capture.js iphone tr,en,nl
```

```bash
NODE_PATH=/opt/node22/lib/node_modules node design/screenshots/capture.js ipad tr,en,nl
```

```bash
NODE_PATH=/opt/node22/lib/node_modules node design/screenshots/compose.js
```

Çıktı `design/screenshots/out/<dil>/` altına yazılır; yayınlanacaklar `docs/store/screenshots/` klasörüne kopyalanır. Başlıklar `captions.json` içinde. Boyutlar: iPhone 6,9" 1320×2868, iPad 13" 2064×2752.
