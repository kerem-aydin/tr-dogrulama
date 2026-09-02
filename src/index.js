/**
 * tr-dogrulama — Türk işletme verisiyle çalışırken defalarca yeniden yazılan
 * küçük şeyler, bir kez doğru yazılmış hâli.
 *
 * Hiçbiri zor değil. Hepsi, elle yazıldığında sessizce yanlış çalışıyor:
 * hata vermez, uyarı vermez, sadece bir kayıt yanlış eşleşir ya da bir mail
 * yanlış kişiye gider. Buradaki her fonksiyonun altında, gerçek bir veriyle
 * karşılaşınca öğrenilmiş bir ayrıntı var.
 *
 * Bağımlılık yok. Node 18+ ve tarayıcı, ikisinde de çalışır.
 */

/* ── Türkçe metin ─────────────────────────────────────────────────────────── */

const BUYUK_KUCUK = { I: "ı", İ: "i", Ğ: "ğ", Ü: "ü", Ş: "ş", Ö: "ö", Ç: "ç" };
const AKSANSIZ = { ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c", â: "a", î: "i", û: "u" };

/**
 * Türkçe duyarlı küçültme.
 *
 * `"I".toLowerCase()` JavaScript'te `"i"` verir. Türkçe'de `I`'nın küçüğü
 * `ı`'dır ve bu bir incelik değil: "IŞIK" kelimesi düz `toLowerCase` ile
 * "işik" olur, doğrusu "ışık"tır. Sıralama, arama ve eşleştirme bu yüzden
 * sessizce yanlış çalışır.
 */
export function kucult(metin) {
  return String(metin ?? "").replace(/[IİĞÜŞÖÇ]/g, (c) => BUYUK_KUCUK[c]).toLowerCase();
}

/**
 * Karşılaştırma için sade biçim: küçük harf, aksansız, yalnız harf ve rakam.
 *
 * Aynı işletme listede "Dis Poliklinigi", sitesinde "Diş Polikliniği" yazar.
 * İkisi eşleşmezse kayıt eşleştirme çalışmaz.
 */
export function sadelestir(metin) {
  return kucult(metin)
    .replace(/[ığüşöçâîû]/g, (c) => AKSANSIZ[c])
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* ── Telefon ──────────────────────────────────────────────────────────────── */

/**
 * Telefonu karşılaştırılabilir biçime indirir.
 *
 * Dönen değer: 10 haneli abone numarası (alan kodu dahil, baştaki sıfır ve
 * ülke kodu atılmış) ya da 7 haneli kurumsal kısa hat (444 ile başlayan).
 * Çözülemezse boş dize.
 *
 * 🔴 444'lü hatlar 7 hanedir ve "en az 10 hane" varsayan her kod onları
 * sessizce eler. Türkiye'de kurumsal numaraların büyük kısmı böyle.
 */
export function telefonSadelestir(girdi) {
  let r = String(girdi ?? "").replace(/\D/g, "");
  if (r.startsWith("90") && r.length > 10) r = r.slice(2);
  r = r.replace(/^0+/, "");
  if (r.length === 7 && r.startsWith("444")) return r;
  return r.length >= 10 ? r.slice(-10) : "";
}

/** İki telefon aynı numarayı mı gösteriyor. Biçimleri farklı olabilir. */
export function telefonAyniMi(a, b) {
  const x = telefonSadelestir(a);
  return x !== "" && x === telefonSadelestir(b);
}

/** Okunabilir biçim: "0212 000 12 34" ya da "444 99 33". */
export function telefonYaz(girdi) {
  const r = telefonSadelestir(girdi);
  if (r.length === 7) return `${r.slice(0, 3)} ${r.slice(3, 5)} ${r.slice(5)}`;
  if (r.length !== 10) return "";
  return `0${r.slice(0, 3)} ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`;
}

/** Cep telefonu mu. Türkiye'de cep alan kodları 5 ile başlar. */
export function cepMi(girdi) {
  const r = telefonSadelestir(girdi);
  return r.length === 10 && r.startsWith("5");
}

/** Bir metindeki bütün telefon adaylarını sadeleştirilmiş hâlde toplar. */
export function telefonlariBul(metin) {
  const duz = String(metin ?? "").replace(/[()\s.\-/]/g, "");
  const adaylar = [
    ...(duz.match(/(?:\+?90)?0?\d{10}/g) ?? []),
    ...(duz.match(/444\d{4}/g) ?? []),
  ];
  return [...new Set(adaylar.map(telefonSadelestir).filter(Boolean))];
}

/* ── E-posta ──────────────────────────────────────────────────────────────── */

/**
 * Kurumsal rol adresleri. Bir MASAYI gösterirler, bir KİŞİYİ değil.
 *
 * Ayrım hukuki olarak önemli: Türkiye'de gerçek kişiye ait e-posta adresi
 * kişisel veridir ve izinsiz ticari ileti göndermek yaptırıma tabidir.
 * Kurumsal rol adresi ayrı değerlendirilir.
 *
 * ⚠️ Bu bir hukuk görüşü değil. Fonksiyonun yaptığı şey belirsizlik karşısında
 * hangi tarafa düşüleceğini SABİTLEMEK: beyaz listede yoksa alma.
 */
export const ROL_ON_EKLERI = new Set([
  "info", "bilgi", "iletisim", "contact", "hello", "merhaba",
  "destek", "support", "kurumsal", "satis", "sales",
  "randevu", "rezervasyon", "reservation", "booking",
  "resepsiyon", "reception", "ofis", "office", "klinik",
  "mail", "eposta", "posta", "admin", "yonetim", "musteri", "hizmet",
]);

const EPOSTA = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const KISISEL_UNVAN = /^(dr|dt|doc|doç|prof|op|uzm|av|mim|muh|müh)[._-]?[a-zçğıöşü]+/i;

/**
 * Bir e-posta adresi kurumsal rol adresi mi.
 *
 * @returns {{ gecerli: boolean, rol: boolean, kisisel: boolean, sebep: string }}
 */
export function epostaTuru(adres) {
  const a = String(adres ?? "").trim().toLowerCase();
  if (!EPOSTA.test(a)) return { gecerli: false, rol: false, kisisel: false, sebep: "geçerli bir e-posta biçimi değil" };

  const yerel = a.split("@")[0];
  const sadeYerel = yerel.replace(/[^a-z]/g, "");

  if (ROL_ON_EKLERI.has(yerel) || ROL_ON_EKLERI.has(sadeYerel)) {
    return { gecerli: true, rol: true, kisisel: false, sebep: "kurumsal rol adresi" };
  }
  if (KISISEL_UNVAN.test(yerel) || (yerel.includes(".") && !ROL_ON_EKLERI.has(yerel.split(".")[0]))) {
    return { gecerli: true, rol: false, kisisel: true, sebep: "kişisel adres görünümünde" };
  }
  return { gecerli: true, rol: false, kisisel: false, sebep: "rol beyaz listesinde değil" };
}

/** Metindeki e-posta adayları. Örnek alanlar ve dosya adları elenir. */
const SAHTE_ALANLAR = new Set([
  "example.com", "domain.com", "email.com", "test.com",
  "sentry.io", "sentry.wixpress.com", "wixpress.com", "godaddy.com",
]);

export function epostalariBul(metin) {
  const bulunan = String(metin ?? "").match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
  const cikti = [];
  for (const ham of bulunan) {
    const a = ham.toLowerCase().replace(/\.+$/, "");
    const alan = a.split("@")[1];
    if (SAHTE_ALANLAR.has(alan)) continue;
    if (/\.(png|jpe?g|gif|svg|webp)$/.test(alan)) continue;
    if (!cikti.includes(a)) cikti.push(a);
  }
  return cikti;
}

/* ── Vergi ve kimlik numaraları ───────────────────────────────────────────── */

/**
 * T.C. kimlik numarası doğrulaması.
 *
 * Uzunluk kontrolü yetmiyor: son iki hane sağlama basamağıdır ve rastgele
 * 11 hane büyük ihtimalle geçersizdir. Bunu kontrol etmemek, formda yazım
 * hatasını kabul edip faturayı geçersiz kılmak demek.
 */
export function tcKimlikGecerliMi(girdi) {
  const n = String(girdi ?? "").replace(/\D/g, "");
  if (n.length !== 11 || n[0] === "0") return false;
  const h = [...n].map(Number);
  const tek = h[0] + h[2] + h[4] + h[6] + h[8];
  const cift = h[1] + h[3] + h[5] + h[7];
  if ((tek * 7 - cift) % 10 !== h[9]) return false;
  return h.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === h[10];
}

/**
 * Vergi kimlik numarası (10 hane) doğrulaması.
 * Maliye'nin yayımladığı sağlama algoritması.
 */
export function vergiNoGecerliMi(girdi) {
  const n = String(girdi ?? "").replace(/\D/g, "");
  if (n.length !== 10) return false;
  const h = [...n].map(Number);
  let toplam = 0;
  for (let i = 0; i < 9; i++) {
    const t = (h[i] + 10 - (i + 1)) % 10;
    toplam += t === 9 ? t : (t * 2 ** (10 - (i + 1))) % 9;
  }
  return (10 - (toplam % 10)) % 10 === h[9];
}

/* ── IBAN ─────────────────────────────────────────────────────────────────── */

/**
 * Türk IBAN doğrulaması (TR + 24 hane, mod 97).
 * Elle yazılmış bir IBAN'ın tek harfi kayarsa para başkasına gider ve
 * bankanın verdiği tek uyarı budur.
 */
export function ibanGecerliMi(girdi) {
  const s = String(girdi ?? "").replace(/\s/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(s)) return false;
  const cevrik = s.slice(4) + s.slice(0, 4);
  let kalan = 0;
  for (const c of cevrik) {
    const d = c >= "A" && c <= "Z" ? String(c.charCodeAt(0) - 55) : c;
    for (const r of d) kalan = (kalan * 10 + Number(r)) % 97;
  }
  return kalan === 1;
}

/** Okunabilir IBAN: dörderli gruplar. */
export function ibanYaz(girdi) {
  const s = String(girdi ?? "").replace(/\s/g, "").toUpperCase();
  return s.replace(/(.{4})/g, "$1 ").trim();
}

/* ── İşletme eşleştirme ───────────────────────────────────────────────────── */

/** Her işletmede geçen, ayırt etmeyen kelimeler. */
export const GENEL_KELIMELER = new Set([
  "dis", "poliklinigi", "poliklinik", "klinik", "klinigi", "agiz", "ve",
  "saglik", "merkezi", "merkez", "tip", "medikal", "ozel", "hizmetleri",
  "otel", "hotel", "tesisi", "tesis", "konaklama", "pansiyon", "apart",
  "sanayi", "ticaret", "ltd", "sti", "as", "anonim", "sirketi", "grup",
  "group", "center", "clinic", "dental", "kurs", "kursu", "egitim", "akademi",
]);

/**
 * İşletme adının onu başkalarından ayıran kelimeleri.
 *
 * "Ada Diş Polikliniği" ile "Lirva Diş Polikliniği" ortak üç kelime taşıyor.
 * Genel kelimeler elenmezse her klinik her klinikle eşleşir.
 */
export function ayirtEdiciKelimeler(ad) {
  const parcalar = sadelestir(ad).split(" ").filter((p) => p.length >= 3);
  const ozgun = parcalar.filter((p) => !GENEL_KELIMELER.has(p));
  return ozgun.length ? ozgun : parcalar;
}

/**
 * Bu sayfa bu işletmenin mi.
 *
 * @returns {{ eslesti: boolean, guc: "guclu"|"zayif"|"yok", telefon: boolean, ad: boolean, alanAdi: boolean, sebepler: string[] }}
 *
 * Kural: telefon biliniyorsa telefon eşleşmesi ŞARTTIR. Ad ve alan adı tutsa
 * bile telefon tutmuyorsa eşleşme sayılmaz. Ölçülmüş sebep: bir diş kliniği
 * araması, adı benzeyen bir oto servisin sitesini getirdi. Ad ve alan adı
 * tutuyordu; tutmayan tek şey telefondu.
 */
export function isletmeEslesmesi({ ad, telefon = "", alanAdi = "", sayfaMetni = "" }) {
  const sebepler = [];
  const sadeSayfa = sadelestir(sayfaMetni);
  if (sadeSayfa.length < 40) {
    return { eslesti: false, guc: "yok", telefon: false, ad: false, alanAdi: false,
             sebepler: ["sayfa metni yok ya da çok kısa"] };
  }

  const beklenen = telefonSadelestir(telefon);
  const telefonEslesti = beklenen !== "" && telefonlariBul(sayfaMetni).includes(beklenen);

  const kelimeler = ayirtEdiciKelimeler(ad);
  const tutan = kelimeler.filter((k) => sadeSayfa.includes(k));
  const adEslesti = kelimeler.length > 0 && tutan.length >= Math.max(1, Math.floor(kelimeler.length / 2));

  const sadeAlan = sadelestir(String(alanAdi).replace(/^www\./, "").split(".")[0]).replace(/ /g, "");
  const alanEslesti = kelimeler.some((k) => k.length >= 4 && sadeAlan.includes(k));

  if (beklenen) {
    if (telefonEslesti) {
      sebepler.push("bilinen telefon sayfada bulundu");
      return { eslesti: true, guc: "guclu", telefon: true, ad: adEslesti, alanAdi: alanEslesti, sebepler };
    }
    sebepler.push("bilinen telefon sayfada yok");
    if (adEslesti) sebepler.push("ad tutuyor ama telefon tutmuyor: yanlış eşleşme kalıbı");
    return { eslesti: false, guc: "yok", telefon: false, ad: adEslesti, alanAdi: alanEslesti, sebepler };
  }

  sebepler.push("telefon bilinmiyor, zayıf kanıtla değerlendiriliyor");
  if (adEslesti && alanEslesti) {
    sebepler.push("ad ve alan adı birlikte tutuyor");
    return { eslesti: true, guc: "zayif", telefon: false, ad: true, alanAdi: true, sebepler };
  }
  if (!adEslesti) sebepler.push("işletme adı sayfada geçmiyor");
  if (!alanEslesti) sebepler.push("alan adı işletme adını taşımıyor");
  return { eslesti: false, guc: "yok", telefon: false, ad: adEslesti, alanAdi: alanEslesti, sebepler };
}
