# tr-dogrulama

[![test](https://github.com/kerem-aydin/tr-dogrulama/actions/workflows/test.yml/badge.svg)](https://github.com/kerem-aydin/tr-dogrulama/actions/workflows/test.yml) ![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen) ![license: MIT](https://img.shields.io/badge/license-MIT-blue)

Validation and normalization for Turkish business data — written once, correctly.

None of it is hard. All of it fails **silently** when written by hand: no error,
no warning, just a record that matches the wrong company or an email that goes
to the wrong person. Every function here has a detail underneath it that was
learned by hitting real data.

No dependencies. Runs on Node 18+ and in the browser.

```js
import { kucult, telefonSadelestir, epostaTuru, tcKimlikGecerliMi } from "./src/index.js";

kucult("IŞIK");                 // "ışık"   — plain toLowerCase gives "işik"
telefonSadelestir("+90 444 1 444"); // "4441444" — 7-digit corporate line, not junk
epostaTuru("info@klinik.com");  // { rol: true, kisisel: false, ... }
tcKimlikGecerliMi("10000000146"); // checksum-verified, not just length
```

## What is in it

| Area | Functions |
|---|---|
| Text | `kucult` · `sadelestir` |
| Phone | `telefonSadelestir` · `telefonAyniMi` · `telefonYaz` · `cepMi` · `telefonlariBul` |
| Email | `epostaTuru` · `epostalariBul` · `ROL_ON_EKLERI` |
| Identity | `tcKimlikGecerliMi` · `vergiNoGecerliMi` |
| Banking | `ibanGecerliMi` · `ibanYaz` |
| Matching | `ayirtEdiciKelimeler` · `isletmeEslesmesi` · `GENEL_KELIMELER` |

## Four details worth naming

**`"I".toLowerCase()` is wrong in Turkish.** JavaScript returns `"i"`. The
lowercase of `I` in Turkish is `ı`. So `"IŞIK"` becomes `"işik"` instead of
`"ışık"`, and every sort, search and match built on it is quietly wrong.

**Corporate short lines are 7 digits.** Numbers starting with `444` are a large
share of Turkish business phone numbers, and any code that assumes "at least 10
digits" drops them without saying so.

**A role address points at a desk, not a person.** `info@`, `iletisim@`,
`satis@` are different from a named individual's address — in Turkey an
individual's email is personal data and unsolicited commercial messages to it
carry a penalty. `epostaTuru` does not give a legal opinion; it *fixes which way
you fall* when the answer is unclear: not on the allowlist, do not take it.

**Name and domain matching is not enough.** A dental clinic search once returned
an auto repair shop's website. The name matched, the domain matched; the only
thing that did not match was the phone number. So the rule in `isletmeEslesmesi`
is: **if the phone is known, the phone must match** — otherwise it is not a
match, no matter what else agrees.

## Tests

```bash
node --test test/*.test.js    # 28 cases, no browser, no dependencies
```

## License

MIT.

---
---

## Türkçe

Türk işletme verisiyle çalışırken defalarca yeniden yazılan küçük şeylerin bir
kez doğru yazılmış hâli.

Hiçbiri zor değil. Hepsi, elle yazıldığında **sessizce** yanlış çalışıyor: hata
vermez, uyarı vermez, sadece bir kayıt yanlış eşleşir ya da bir mail yanlış
kişiye gider. Buradaki her fonksiyonun altında, gerçek bir veriyle karşılaşınca
öğrenilmiş bir ayrıntı var.

Bağımlılık yok. Node 18+ ve tarayıcı, ikisinde de çalışır.

```js
import { kucult, telefonSadelestir, epostaTuru, tcKimlikGecerliMi } from "./src/index.js";

kucult("IŞIK");                     // "ışık"   — düz toLowerCase "işik" verir
telefonSadelestir("+90 444 1 444"); // "4441444" — 7 haneli kurumsal hat, çöp değil
epostaTuru("info@klinik.com");      // { rol: true, kisisel: false, ... }
tcKimlikGecerliMi("10000000146");   // sağlama basamağı kontrollü, sadece uzunluk değil
```

### İçindekiler

| Alan | Fonksiyonlar |
|---|---|
| Metin | `kucult` · `sadelestir` |
| Telefon | `telefonSadelestir` · `telefonAyniMi` · `telefonYaz` · `cepMi` · `telefonlariBul` |
| E-posta | `epostaTuru` · `epostalariBul` · `ROL_ON_EKLERI` |
| Kimlik | `tcKimlikGecerliMi` · `vergiNoGecerliMi` |
| Banka | `ibanGecerliMi` · `ibanYaz` |
| Eşleştirme | `ayirtEdiciKelimeler` · `isletmeEslesmesi` · `GENEL_KELIMELER` |

### Adı konması gereken dört ayrıntı

**`"I".toLowerCase()` Türkçe'de yanlıştır.** JavaScript `"i"` döndürür.
Türkçe'de `I`'nın küçüğü `ı`'dır. "IŞIK" bu yüzden "ışık" değil "işik" olur ve
üstüne kurulan her sıralama, arama ve eşleştirme sessizce yanlış çalışır.

**Kurumsal kısa hatlar 7 hanedir.** `444` ile başlayan numaralar Türkiye'de
kurumsal numaraların büyük kısmını oluşturuyor ve "en az 10 hane" varsayan her
kod onları haber vermeden eliyor.

**Rol adresi bir masayı gösterir, bir kişiyi değil.** `info@`, `iletisim@`,
`satis@` ile adı geçen bir kişinin adresi aynı şey değil — Türkiye'de gerçek
kişiye ait e-posta kişisel veridir ve izinsiz ticari ileti yaptırıma tabidir.
`epostaTuru` hukuki görüş vermiyor; belirsizlik karşısında **hangi tarafa
düşüleceğini sabitliyor:** beyaz listede yoksa alma.

**Ad ve alan adı tutması yetmez.** Bir diş kliniği araması, adı benzeyen bir oto
servisin sitesini getirdi. Ad tutuyordu, alan adı tutuyordu; tutmayan tek şey
telefondu. `isletmeEslesmesi` bu yüzden şunu kural yapıyor: **telefon
biliniyorsa telefon eşleşmesi şarttır**, başka her şey tutsa bile.

### Test

```bash
node --test test/*.test.js    # 28 vaka, tarayıcısız, bağımlılıksız
```

### Lisans

MIT.
