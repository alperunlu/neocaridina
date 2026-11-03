# iOS yayın rehberi (Expo + EAS)

Bu repo bir Expo SDK 58 uygulaması. Oyun `web/src` altında yazılır ve `scripts/build-web.js` ile tek parça bir HTML'e (`game-html.js`) dönüştürülür. Uygulama bu HTML'i `react-native-webview` içinde çevrimdışı çalıştırır.

## 0. Her build'den önce: yerel kontrol (ücretsiz)

EAS build'leri sayılı ve yavaş. Her şeyi önce yerelde doğrula:

```bash
npm install
```

```bash
npm run release:check
```

Kontrol edilenler: giriş noktası, `app.json` alanları, ikon (1024×1024, alfasız), asset'lerin git'te olması, çevirilerin eksiksiz olması (TR/EN/NL), `game-html.js`'in kaynaklarla güncel olması, çevrimdışı duman testi, `expo export` ile üretim bundle'ı ve temiz çalışma ağacı. Hepsi ✓ olmadan build gönderme.

Ek olarak Expo sunucularına erişebilen bir makinede:

```bash
npx expo-doctor
```

```bash
npx expo install --fix
```

## 1. Bir kerelik kurulum

1. Apple Developer Program üyeliği (yıllık 99 USD).
2. EAS hesabı ve proje bağlama (bu komut `app.json`'a `owner` ve `extra.eas.projectId` ekler; değişikliği commit et):

```bash
npx eas login
```

```bash
npx eas init
```

3. App Store Connect'te uygulamayı oluştur: bundle ID `com.alu.neocaridina` (değiştireceksen önce `app.json`'da değiştir), birincil dil İngilizce, ek diller Türkçe ve Hollandaca.
4. App Store Connect'te kapat (kullanılmıyor): Game Center, In-App Purchase. Açık bırakılan ama binary'de olmayan bir özellik gönderimi engeller; kapatmak için yeni build gerekmez.

## 2. Build ve TestFlight

```bash
npx eas build --platform ios --profile production
```

```bash
npx eas submit --platform ios --profile production --latest
```

- Build numarası EAS tarafından otomatik artar (`appVersionSource: remote`, `autoIncrement`). Sadece kullanıcıya görünen `version` (`app.json`) elle değişir.
- EAS build sırasında `eas-build-post-install` kancası `npm run build:web` çalıştırır; yani gönderilen HTML her zaman kaynaklardan üretilir.
- `eas submit` build kredisi harcamaz. TestFlight'ta denenen binary incelemeye gönderilen binary'nin aynısıdır.

## 3. TestFlight'ta mutlaka denenecekler

Buradaki ortamda iOS cihaz yok; şunlar sadece gerçek cihazda doğrulanabilir:

- İlk açılış: splash → oyun, dil cihaz diline göre (TR/EN/NL), Ayarlar'dan dil değişimi.
- Kayıt: oyna, uygulamayı arka plana al, tamamen kapat, aç → ilerleme yerinde.
- Ses: su/ortam sesi, müzik; telefonun sessiz anahtarı; arka planda Spotify çalarken oyunun müziği kesmemesi.
- Titreşim (haptics), iPhone'da dikey kilit, iPad'de dönme ve Split View.
- Performans: 100+ karidesli tankta akıcılık, pil ve ısınma (10 dk oyun).
- WebView çökmesi zor tetiklenir; en azından düşük bellekli eski bir cihazda uzun süre oynayıp kontrol et.

## 4. App Store Connect bilgileri

- Kategori: Games → Simulation (ikincil: Games → Casual).
- Yaş derecelendirmesi: şiddet, kumar, kullanıcı içeriği yok → 4+.
- App Privacy: "Data Not Collected" (oyun hiçbir veri toplamaz, ağ isteği yapmaz, reklam/analytics yok).
- Export compliance: `usesNonExemptEncryption: false` (app.json'da tanımlı).
- Gizlilik politikası URL'si zorunlu: `docs/privacy-policy.md` metnini bir web sayfası olarak yayınla (ör. GitHub Pages) ve URL'yi gir.
- Mağaza metinleri: `docs/store/en.md`, `docs/store/tr.md`, `docs/store/nl.md`.
- App Store adı: "Neocaridina: Shrimp Farm" (EN), "Neocaridina: Karides Çiftliği" (TR), "Neocaridina: Garnalenkwekerij" (NL); hepsi 30 karakter sınırının altında. Ana ekrandaki kısa ad (`CFBundleDisplayName`) "Neocaridina"; iOS uzun adları ana ekranda kırpar.
- Ekran görüntüleri: 6,9" iPhone (1320×2868) ve 13" iPad (2064×2752), her dil için ayrı. Gerçek oyun durumlarından çekilmeli (dolu tank, gece lambası, mağaza, koleksiyon).

## 5. 2027 yayını öncesi

Expo SDK ve Apple'ın minimum Xcode/SDK şartı her yıl değişir. Yayından hemen önce SDK'yı güncel sürüme yükselt, `npx expo install --fix` çalıştır ve bu rehberi baştan uygula.
