import test from "node:test";
import assert from "node:assert/strict";

import {
  kucult, sadelestir,
  telefonSadelestir, telefonAyniMi, telefonYaz, cepMi, telefonlariBul,
  epostaTuru, epostalariBul,
  tcKimlikGecerliMi, vergiNoGecerliMi,
  ibanGecerliMi, ibanYaz,
  ayirtEdiciKelimeler, isletmeEslesmesi,
} from "../src/index.js";

/* ── Türkçe metin ─────────────────────────────────────────────────────────── */

test("büyük I küçülünce ı olur, i değil", () => {
  assert.equal(kucult("IŞIK"), "ışık");
  assert.equal(kucult("İSTANBUL"), "istanbul");
  /* Düz toLowerCase burada "işik" verir ve bütün eşleştirme bozulur. */
  assert.notEqual(kucult("IŞIK"), "IŞIK".toLowerCase());
});

test("sadeleştirme aksanı düşürür", () => {
  assert.equal(sadelestir("Diş Polikliniği"), "dis poliklinigi");
  assert.equal(sadelestir("ÇAĞDAŞ Güzellik"), "cagdas guzellik");
  assert.equal(sadelestir("A.Ş. — Ltd. Şti."), "a s ltd sti");
});

/* ── Telefon ──────────────────────────────────────────────────────────────── */
/* Bu dosyadaki bütün numaralar uydurma: "000" ile başlayan abone numarası ve
   "500" cep kodu Türkiye'de verilmiyor. İşletme ve alan adları da uydurma. */

test("aynı numara farklı yazımlarda aynı değere iner", () => {
  const beklenen = "2120001234";
  for (const b of ["0212 000 12 34", "+90 212 000 12 34", "(0212) 0001234",
                   "02120001234", "0212-000-12-34", "90 212 000 12 34"]) {
    assert.equal(telefonSadelestir(b), beklenen, b);
  }
});

test("444'lü kurumsal hat 7 hane olarak korunur", () => {
  assert.equal(telefonSadelestir("444 00 01"), "4440001");
  assert.equal(telefonSadelestir("4440001"), "4440001");
  /* "en az 10 hane" varsayan kod bunu sessizce eler. */
  assert.notEqual(telefonSadelestir("444 00 01"), "");
});

test("444'lü hat ülke koduyla yazılınca da korunur", () => {
  /* 🔴 Bu vaka bir kusuru yakaladı: "+90 444 0 002" toplam 9 hanedir ve
     "uzunluk > 10 ise ülke kodunu at" kuralı bu kapıdan geçmez. Numara
     hata vermeden boş dönüyordu — kütüphanenin önlemek için var olduğu şey. */
  for (const b of ["+90 444 0 002", "90 444 0 002", "0090 444 0 002", "+904440002"]) {
    assert.equal(telefonSadelestir(b), "4440002", b);
  }
  assert.ok(telefonAyniMi("+90 444 0 002", "444 00 02"));
});

test("ülke kodu yalnız kalan geçerliyse atılır", () => {
  assert.equal(telefonSadelestir("0090 500 111 22 33"), "5001112233");
  /* "90" ile başlayan ama ülke kodu OLMAYAN bir şey kırpılmamalı. */
  assert.equal(telefonSadelestir("9012"), "");
});

test("yabancı numara Türk numarasına benzetilmez", () => {
  /* 🔴 Codex denetimi yakaladı (13 Eki 2026): eski sürüm fazla haneyi kırpıp
     son 10 haneyi alıyordu. "+44 20 7946 0958" böylece "0207 946 09 58" diye
     bir Türk numarası oluyor ve yanlış kayıtla eşleşebiliyordu. */
  for (const b of ["+44 20 7946 0958", "+1 212 555 0123", "0044 20 7946 0958", "+49 30 1234 5678"]) {
    assert.equal(telefonSadelestir(b), "", b);
  }
  assert.ok(!telefonAyniMi("+44 20 7946 0958", "0207 946 09 58"));
});

test("fazla haneli numara kırpılmaz, reddedilir", () => {
  assert.equal(telefonSadelestir("0212 000 12 34 5"), "");
  assert.equal(telefonSadelestir("+90 212 000 12 34 5"), "");
});

test("eksik numara boş döner, kabul edilmez", () => {
  for (const kotu of ["0500 112 23", "123", "", null, "abc"]) {
    assert.equal(telefonSadelestir(kotu), "", String(kotu));
  }
});

test("iki numara aynı mı", () => {
  assert.ok(telefonAyniMi("0212 000 12 34", "+902120001234"));
  assert.ok(!telefonAyniMi("0212 000 12 34", "0216 000 11 22"));
  assert.ok(!telefonAyniMi("", ""), "boş numara eşleşme saymaz");
});

test("okunabilir biçim", () => {
  assert.equal(telefonYaz("+902120001234"), "0212 000 12 34");
  assert.equal(telefonYaz("4440001"), "444 00 01");
  assert.equal(telefonYaz("bozuk"), "");
});

test("cep telefonu ayırt edilir", () => {
  assert.ok(cepMi("0500 111 22 33"));
  assert.ok(!cepMi("0212 000 12 34"));
  assert.ok(!cepMi("444 00 01"));
});

test("metinden telefon toplama", () => {
  const b = telefonlariBul("Bize ulaşın: 444 00 01 veya 0212 000 12 34 (faks 0212 000 12 35)");
  assert.deepEqual(b.sort(), ["2120001234", "2120001235", "4440001"].sort());
});

/* ── E-posta ──────────────────────────────────────────────────────────────── */

test("rol adresleri tanınır", () => {
  for (const a of ["info@x.com", "iletisim@x.com", "bilgi@x.com", "randevu@x.com", "RESEPSIYON@x.com"]) {
    const t = epostaTuru(a);
    assert.ok(t.rol, a);
    assert.ok(!t.kisisel, a);
  }
});

test("kişisel adresler rol sayılmaz", () => {
  for (const a of ["drmehmet@x.com", "dt.ayse@x.com", "ahmet.yilmaz@x.com"]) {
    const t = epostaTuru(a);
    assert.ok(!t.rol, a);
    assert.ok(t.kisisel, a);
  }
});

test("belirsiz adres rol sayılmaz", () => {
  const t = epostaTuru("kariyer2026@x.com");
  assert.ok(!t.rol);
  assert.ok(!t.kisisel);
  assert.match(t.sebep, /beyaz liste/);
});

test("rol adı yalnız tam eşleşirse rol sayılır", () => {
  /* 🔴 Eski sürüm harf dışını silip karşılaştırıyordu: "info123" -> "info"
     ve kişisel olabilecek bir adres rol adresi sayılıyordu. Beyaz liste
     kuralının tersi. */
  for (const a of ["info123@x.com", "info2026@x.com", "info_ahmet@x.com"]) {
    assert.ok(!epostaTuru(a).rol, a);
  }
});

test("bozuk biçim geçersiz", () => {
  for (const a of ["ahmet@", "@x.com", "ahmet x@y.com", "", null]) {
    assert.ok(!epostaTuru(a).gecerli, String(a));
  }
});

test("metinden e-posta toplama, örnek alanlar elenir", () => {
  const b = epostalariBul("info@lirvadis.example, a@example.com, logo@cdn.png, DR.MEHMET@lirvadis.example.");
  assert.deepEqual(b, ["info@lirvadis.example", "dr.mehmet@lirvadis.example"]);
});

/* ── Kimlik ve vergi ──────────────────────────────────────────────────────── */

test("T.C. kimlik sağlaması", () => {
  /* Algoritmayı sağlayan sentetik bir numara; gerçek bir kişiye ait değil. */
  assert.ok(tcKimlikGecerliMi("10000000146"));
  assert.ok(!tcKimlikGecerliMi("10000000147"), "son hane bozuk");
  assert.ok(!tcKimlikGecerliMi("01000000146"), "sıfırla başlayamaz");
  assert.ok(!tcKimlikGecerliMi("1000000014"), "on hane");
  assert.ok(!tcKimlikGecerliMi("12345678901"), "rastgele 11 hane geçmemeli");
});

/* ⚠️ Bu testin ilk sürümü şu satırla başlıyordu:
 *     assert.ok(vergiNoGecerliMi("1234567890") === false || ... === true);
 * Yani "sonuç ya doğru ya yanlış" diyordu ve HER KOŞULDA geçiyordu. Suit
 * yeşildi, o vaka hiçbir şey ölçmüyordu. Boş bir iddia, eksik bir testten
 * kötüdür: eksik test görünür, boş iddia güven verir. */
test("vergi numarası sağlaması gerçekten çalışıyor", () => {
  /* Sağlama basamağı olan bir doğrulayıcının iki özelliği vardır ve ikisi de
     burada ölçülüyor: her şeye evet DEMEZ, ve son hane bozulunca hayır DER. */
  const ilkOnZip = Array.from({ length: 400 }, (_, i) => String(1_000_000_000 + i * 7).slice(-10));
  const gecerliler = ilkOnZip.filter(vergiNoGecerliMi);

  assert.ok(gecerliler.length > 0, "hicbir numarayi kabul etmiyorsa dogrulayici degil, reddedicidir");
  assert.ok(gecerliler.length < ilkOnZip.length, "her seye evet diyorsa saglama calismiyor demektir");

  for (const g of gecerliler.slice(0, 5)) {
    /* Tek hane kaydırınca geçersiz olmalı. Olmuyorsa son hane hesaba hiç
       girmiyor demektir ve doğrulayıcı yalnızca uzunluk sayıyordur. */
    const bozuk = g.slice(0, 9) + String((Number(g[9]) + 1) % 10);
    assert.ok(!vergiNoGecerliMi(bozuk), `son hane bozulunca gecersiz olmali: ${g} -> ${bozuk}`);
  }

  assert.ok(!vergiNoGecerliMi("123"), "kisa numara");
  assert.ok(!vergiNoGecerliMi(""), "bos");
  assert.ok(!vergiNoGecerliMi("12345678901"), "on bir hane VKN degil");
});

test("VKN sağlaması elle hesaplanmış örnekle tutuyor", () => {
  /* Doğrulayıcının kendi seçtiği numaralarla değil, elle hesaplanmış bir
     örnekle karşılaştırma. "000000000?" için dokuz basamağın katkıları:
     t = (0 + 10 - i) % 10 -> 9, 8, 7, 6, 5, 4, 3, 2, 1
     t = 9 ise 9, değilse t * 2^(10-i) mod 9 -> 9, 5, 5, 6, 7, 1, 6, 8, 2
     toplam 49, sağlama basamağı (10 - 49 % 10) % 10 = 1. */
  assert.ok(vergiNoGecerliMi("0000000001"));
  for (let d = 0; d <= 9; d++) {
    if (d !== 1) assert.ok(!vergiNoGecerliMi("000000000" + d), "son hane " + d);
  }
});

/* Rastgele testler tohumlu: her koşuda aynı numaralar, başarısızlık tekrar üretilebilir. */
function tohumlu(tohum) {
  let x = tohum >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

test("VKN kabul oranı sağlama basamağına uyuyor", () => {
  /* Tek sağlama basamağı olan bir algoritmada rastgele numaraların yaklaşık
     onda biri geçerli çıkar. Oran çok düşükse algoritma fazla reddediyor,
     çok yüksekse sağlama hiç çalışmıyordur. Bu, uygulamayı KENDİ testiyle
     değil matematiğiyle karşılaştıran bir kontrol. */
  const rastgele = tohumlu(2026);
  let gecerli = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const s = String(Math.floor(rastgele() * 1e10)).padStart(10, "0");
    if (vergiNoGecerliMi(s)) gecerli++;
  }
  const oran = gecerli / n;
  assert.ok(oran > 0.06 && oran < 0.14, `beklenen ~0.10, olculen ${oran.toFixed(3)}`);
});

test("TCKN kabul oranı iki sağlama basamağına uyuyor", () => {
  /* İki sağlama basamağı: yaklaşık yüzde bir. */
  const rastgele = tohumlu(1013);
  let gecerli = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const s = String(Math.floor(rastgele() * 9) + 1) +
      String(Math.floor(rastgele() * 1e10)).padStart(10, "0").slice(0, 10);
    if (tcKimlikGecerliMi(s)) gecerli++;
  }
  const oran = gecerli / n;
  assert.ok(oran > 0.004 && oran < 0.02, `beklenen ~0.010, olculen ${oran.toFixed(4)}`);
});

/* ── IBAN ─────────────────────────────────────────────────────────────────── */

test("IBAN sağlaması", () => {
  /* Yaygın kullanılan örnek IBAN (ISO 13616 örnek listesi); bir hesaba ait değil. */
  const gecerli = "TR330006100519786457841326";
  assert.ok(ibanGecerliMi(gecerli));
  assert.ok(ibanGecerliMi("tr33 0006 1005 1978 6457 8413 26"), "bosluk ve kucuk harf sorun degil");
  /* Tek hane kayarsa para başkasına gider. Tek uyarı bu kontroldür. */
  assert.ok(!ibanGecerliMi("TR330006100519786457841327"));
  assert.ok(!ibanGecerliMi("DE89370400440532013000"), "TR disi kabul edilmiyor");
  assert.ok(!ibanGecerliMi("TR33"));
});

test("IBAN okunabilir yazılır", () => {
  assert.equal(ibanYaz("TR330006100519786457841326"), "TR33 0006 1005 1978 6457 8413 26");
});

/* ── İşletme eşleştirme ───────────────────────────────────────────────────── */

const SAYFA_DOGRU =
  "Lirva Diş Polikliniği. Bahçelievler'de implant ve gülüş tasarımı. " +
  "Randevu için 0212 000 12 34. İletişim: info@lirvadis.example. Lirva Diş Polikliniği, İstanbul.";

const SAYFA_OTO_SERVIS =
  "Lirva Oto Servis. Motor bakımı, kaporta ve boya. Telefon: 0216 000 11 22. " +
  "Adres: Ümraniye. info@lirvaoto.example üzerinden yazabilirsiniz.";

test("genel kelimeler ayırt edici sayılmaz", () => {
  assert.deepEqual(ayirtEdiciKelimeler("Lirva Diş Polikliniği"), ["lirva"]);
  /* Hepsi genelse elde bir şey kalmasın diye ham listeye düşülür. */
  assert.ok(ayirtEdiciKelimeler("Diş Polikliniği").length > 0);
});

test("telefon tutunca güçlü eşleşme", () => {
  const s = isletmeEslesmesi({
    ad: "Lirva Diş Polikliniği", telefon: "0212 000 12 34",
    alanAdi: "lirvadis.example", sayfaMetni: SAYFA_DOGRU,
  });
  assert.ok(s.eslesti);
  assert.equal(s.guc, "guclu");
});

test("ad tutup telefon tutmayan sayfa REDDEDİLİR", () => {
  /* Ölçülmüş vaka: diş kliniği arandı, oto servis sitesi geldi. */
  const s = isletmeEslesmesi({
    ad: "Lirva Diş Polikliniği", telefon: "0212 000 12 34",
    alanAdi: "lirvaoto.example", sayfaMetni: SAYFA_OTO_SERVIS,
  });
  assert.ok(!s.eslesti);
  assert.ok(s.sebepler.some((x) => /yanlış eşleşme/.test(x)));
});

test("telefon bilinmiyorsa ad ve alan adı birlikte gerekir", () => {
  const iyi = isletmeEslesmesi({ ad: "Lirva Diş Polikliniği", alanAdi: "lirvadis.example", sayfaMetni: SAYFA_DOGRU });
  assert.ok(iyi.eslesti);
  assert.equal(iyi.guc, "zayif", "telefonsuz gecen kayit zayif isaretlenmeli");

  const kotu = isletmeEslesmesi({ ad: "Lirva Diş Polikliniği", alanAdi: "rastgele.net", sayfaMetni: SAYFA_DOGRU });
  assert.ok(!kotu.eslesti);
});

test("başka bir klinik bu sayfayla eşleşmez", () => {
  const s = isletmeEslesmesi({ ad: "Ada Diş Polikliniği", alanAdi: "lirvadis.example", sayfaMetni: SAYFA_DOGRU });
  assert.ok(!s.eslesti);
});

test("boş sayfa eşleşme sayılmaz", () => {
  const s = isletmeEslesmesi({ ad: "Lirva Diş Polikliniği", telefon: "02120001234", sayfaMetni: "" });
  assert.ok(!s.eslesti);
  assert.equal(s.guc, "yok");
});
