# App Review bilgileri (Guideline 2.1 – Information Needed)

App Store Connect → uygulama → sürüm sayfası → **App Review Information**.

- **Notes:** aşağıdaki İngilizce metni olduğu gibi yapıştır (~2.700 karakter; sınır 4.000).
- **Attachment:** ekran kaydını buraya yükle. Bu alan yoksa kaydı paylaşılabilir bir bağlantıyla (örneğin liste dışı YouTube ya da iCloud bağlantısı) Notes metnindeki `[recording link]` yerine koy.
- **Sign-in required:** işaretleme (hesap yok).

---

## Notes alanına yapıştırılacak metin

```
Thank you for reviewing Neocaridina: Shrimp Farm.

1. SCREEN RECORDING
A screen recording from a physical iPhone on the latest iOS is attached (App Review Information > Attachment) [recording link]. It starts at app launch and shows the typical flow: main menu, new game, setting up and cycling the tank, buying and caring for shrimp, a water test, breeding, and shipping a customer order.
The app has no account registration or login, no user-generated content, no in-app purchases and no paid content, so none of those flows exist.

2. PURPOSE AND AUDIENCE
Neocaridina is a calm, single-player aquarium simulation for casual players and for aquarium hobbyists (ages 4+). The player sets up a planted shrimp tank, cycles the water, keeps the water healthy and breeds dwarf shrimp to discover new colour varieties. It teaches real aquarium-keeping basics (the nitrogen cycle, water changes, careful feeding) in a relaxing, no-pressure way. There are no timers that punish the player, no ads and no purchases.

3. HOW TO USE THE MAIN FEATURES (no login, no sample files needed)
- Launch the app and tap "New game". A short guide explains the steps.
- Tap Shop > Setup: choose a substrate, then tap "Fill with tap water".
- Shop > Equipment: buy a filter and a light.
- Tap the red Care button > Bacteria, then Care > Suggested once per in-game day. The tank cycles in a few in-game days. Use the speed button at the top (1x, 4x, 12x) to make days pass faster.
- Care > Test shows the water values. When ammonia and nitrite are zero, Shop > Shrimp lets you buy shrimp.
- Drag to rotate the tank, pinch to zoom, tap a shrimp to see its details. The camera buttons switch views (side, top, underwater, shelf with all tanks).
- Messages: customers ask for a colour; once you have bred it, "Pack & ship" sells it.
- Journal: goals, discovered colours and statistics. Settings: language (English, Turkish, Dutch), sound and haptics.

4. EXTERNAL SERVICES
None. The game runs fully offline and makes no network requests. There are no analytics, ads, tracking, authentication, payment or AI services. Progress is saved only on the device. The 3D view is drawn with the open-source three.js library (MIT licence) bundled inside the app; the fonts are bundled open-source fonts (SIL Open Font License).

5. REGIONAL DIFFERENCES
None. The app works the same in every region. Only the interface language changes (English, Turkish or Dutch, following the device language or the in-game setting).

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Not applicable. The app is not in a regulated industry and contains no protected third-party material. All art, text and game content are our own; the bundled code and fonts are open source as listed above.
```

---

## Ekran kaydı nasıl alınır (fiziksel iPhone, en güncel iOS)

1. Telefonda **Ayarlar → Denetim Merkezi**'ne **Ekran Kaydı**'nı ekle.
2. TestFlight'tan yüklü son build'i kullan. Temiz bir başlangıç için uygulamayı silip yeniden yükleyebilirsin.
3. Denetim Merkezi'nden kaydı başlat, sonra **uygulamayı ana ekrandan aç** (kayıt açılışla başlamalı).
4. Sırayla göster (toplam 2–4 dakika yeterli):
   - Açılış menüsü → **Yeni oyun** → rehberi kapat.
   - **Mağaza → Kurulum:** taban seç, "Musluk suyuyla doldur".
   - **Mağaza → Makineler:** filtre ve ışık al.
   - **Bakım → Bakteri**, sonra **Bakım → Önerilen** yem. Üstteki hız düğmesiyle 4× yap, birkaç gün geçsin (her gün Önerilen'e bas).
   - **Bakım → Test:** amonyak ve nitrit sıfır.
   - **Mağaza → Karidesler:** birkaç karides al.
   - Tankı parmakla döndür, yakınlaş, bir karidese dokun, kamera düğmeleriyle su altı ve raf görünümüne geç.
   - **Mesajlar**, **Koloni**, **Günlük** ekranlarını kısaca aç.
   - **Ayarlar**'da dil seçeneğini göster.
5. Kaydı durdur. Video **Fotoğraflar**'a kaydedilir; bilgisayara aktarıp App Store Connect'te **Attachment** alanına yükle.

Bebek karides doğumu ve sipariş göndermek oyunda haftalar sürer. Kayıtta göstermek istersen ilerlemiş bir kayıtla ikinci kısa bir bölüm ekleyebilirsin; zorunlu değil.

---

## Ekran görüntüleri (Guideline 2.3.3)

Apple, ekran görüntülerinin yalnızca başlık ya da açılış ekranı değil, uygulamanın kullanımını göstermesini istiyor. `1-title` görüntüsü açılış menüsü. Riski azaltmak için App Store Connect'te **ilk sıraya `2-tank` görüntüsünü koy**, `1-title`'ı en sona al ya da hiç yükleme.
