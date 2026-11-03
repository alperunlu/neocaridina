# Görsel kaynaklar

İkon ve açılış görseli SVG olarak koddan üretilir; karides çizimi `shrimp.js` içinde ortak.

```bash
node design/icon.js && NODE_PATH=/opt/node22/lib/node_modules node design/render.js design/icon.svg assets/icon.png 1024 1024
```

```bash
node design/splash.js && NODE_PATH=/opt/node22/lib/node_modules node design/render.js design/splash.svg assets/splash-icon.png 1200 1200 1
```

`assets/icon.png` alfa kanalı içermemeli (App Store reddeder): gerekirse PIL ile `convert('RGB')` yap. `release:check` bunu denetler.
