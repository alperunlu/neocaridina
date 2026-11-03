# App Store header ve search results görselleri (İngilizce)

Ekim 2026'da App Store Connect'e eklenen yeni alanlar (iOS 27 / iPadOS 27 ve sonrası): ürün sayfası **Header** ve **Search Results** görselleri. App Store Connect → sürüm sayfası → Product Page Information → **Header and Search Results** sekmesinden yüklenir. İsteğe bağlıdır; ekran görüntülerinin yerini almaz. Search results görseli yüklenirse arama sonucunda ilk ekran görüntülerinin yerine bu görünür.

| Dosya | Alan | Boyut | Oran |
|---|---|---|---|
| `header-en.png` | Product page header | 3840×1646 | 21:9 (Apple'ın istediği tam boyut) |
| `search-results-en.png` | Search results | 2400×1600 | 3:2 (izin verilen aralık 1920×1280 – 3840×2560) |

- İkisi de PNG (RGB, alfa kanalı yok; Apple şartı).
- Görsel dil oyunla aynı: üstte oyunun pencere başlıklarındaki su rengi şerit ve dalgalı alt kenar, altında oyunun gerçek 3D sahnesi. Başlıklar Zilla Slab, metin M PLUS Rounded 1c (oyunun kendi fontları).
- Header'ın üst şeridinde logo (karides) ve oyun adı var: "Neocaridina / Shrimp Farm". App Store kendi uygulama adını ve ikonunu da gösterdiği için Preview'da tekrar gibi duruyorsa logoyu kaldırmak kolay (`design/creative/compose.js`). Odak noktası ortada; Apple kenarların cihaza göre kırpılabileceğini söylüyor.
- Search results görseli header'la aynı sahneden kırpıldı (Apple tek bir "universal" görselle marka tutarlılığını öneriyor) ve üstüne kısa bir slogan eklendi: "Breed every colour / Build, cycle and grow your shrimp farm".
- Fiyat, URL, ödül, başka platform logosu yok (Apple kuralları).
- Yüklemeden önce App Store Connect'teki **Preview** ile iPhone/iPad ve yatay/dikey görünümü kontrol et; slogan bir cihazda arayüzle çakışırsa haber ver, konumunu değiştiririm.

Yeniden üretmek için: `design/screenshots/seed.js` ile kaydı üret ve `design/creative/` içine kopyala; `design/creative/render.js` oyunun 3D sahnesini arayüzsüz yakalar (header için `1920 823 2 raw-header.png 1 -40`, search için `1200 800 2 raw-search2.png 1 -40`), `design/creative/compose.js` iki görseli de oluşturur.
