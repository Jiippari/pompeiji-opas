/* Pompeiji-opas — sovelluslogiikka.
 * Ei riippuvuuksia Leafletin lisäksi. Data tulee tiedostoista data/*.js
 * (window.KARTTA, window.KOHTEET, window.REITIT, window.VERKKO, window.TIETOA).
 * Muista nostaa VERSIO sekä täällä että sw.js:ssä, kun julkaiset muutoksia. */
'use strict';
(() => {
const VERSIO = '2026-11-11.4';

const KARTTA = window.KARTTA;
const KOHTEET = window.KOHTEET || [];
const REITIT = window.REITIT || [];
const VERKKO = window.VERKKO || null;   // kävelyverkko oman reitin laskemiseen
const TIETOA = window.TIETOA || { kaytanto: [], taustaa: [], ennen: [] };

const KATEGORIAT = {
  julkinen: { nimi: 'Aukiot ja julkiset', vari: '#3d6a9e' },
  temppeli: { nimi: 'Temppelit', vari: '#a8790f' },
  talo:     { nimi: 'Talot', vari: '#9e2f22' },
  kylpyla:  { nimi: 'Kylpylät', vari: '#1f7f86' },
  viihde:   { nimi: 'Teatterit ja areena', vari: '#6e4596' },
  arki:     { nimi: 'Arki ja työ', vari: '#c0631a' },
  purkaus:  { nimi: 'Purkauksen jäljet', vari: '#4a4a4a' },
  ulko:     { nimi: 'Muurien ulkopuolella', vari: '#4f7a35' },
};
const TILAT = {
  alue:     { nimi: 'Ulkoalue – aina nähtävissä', luokka: 'ok' },
  auki:     { nimi: 'Auki', luokka: 'ok' },
  ulkoa:    { nimi: 'Nähtävissä vain ulkoa', luokka: 'huom' },
  tarkista: { nimi: 'Tarkista paikan päällä', luokka: 'huom' },
  suljettu: { nimi: 'Suljettu', luokka: 'kiinni' },
};
const ALUEJARJESTYS = [
  'Sisäänkäynti ja Forum', 'Teatterialue', 'Keskusta', 'Pohjoiset talot',
  'Itäosa', 'Amfiteatterin seutu', 'Muurien ulkopuolella',
];

const kohdeById = Object.fromEntries(KOHTEET.map(k => [k.id, k]));
const reittiById = Object.fromEntries(REITIT.map(r => [r.id, r]));

// ------------------------------------------------------------- apurit
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalisoi = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const S = {
  get(k, d) { try { const v = localStorage.getItem('pompeiji.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('pompeiji.' + k, JSON.stringify(v)); } catch { /* täysi tai estetty */ } },
};

let nahty = new Set(S.get('nahty', []));
let aktiivinenReitti = S.get('reitti', null);           // { id, i }
// Oma reitti: käyttäjän valitsemat kohteet. Lasketaan puhelimessa (ks. osio "oma reitti").
let omaAsetukset = { valitut: [], alku: 'porta-marina', loppu: 'porta-marina', portaat: false, ...S.get('omaReitti', {}) };
let verkko = null;                                     // kävelyverkon naapurilistat, alustetaan tarvittaessa
paivitaOmaReitti();
if (aktiivinenReitti && !reittiById[aktiivinenReitti.id]) aktiivinenReitti = null;

function etaisyys(a, b) {
  const kx = 111320 * Math.cos((a[0] + b[0]) / 2 * Math.PI / 180);
  return Math.hypot((a[1] - b[1]) * kx, (a[0] - b[0]) * 110540);
}
function matka(m) {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}
function kesto(min) {
  if (min < 60) return `${Math.round(min / 5) * 5} min`;
  const h = Math.floor(min / 60), m = Math.round((min % 60) / 15) * 15;
  return m === 60 ? `${h + 1} h` : m ? `${h} h ${m} min` : `${h} h`;
}
function dekoodaa(arr) {
  const [la0, lo0] = KARTTA.origo, q = KARTTA.q, ulos = [];
  let x = 0, y = 0;
  for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; ulos.push([la0 + y / q, lo0 + x / q]); }
  return ulos;
}
const piste = p => [KARTTA.origo[0] + p[1] / KARTTA.q, KARTTA.origo[1] + p[0] / KARTTA.q];

let ilmoitusAjastin = null;
function ilmoita(teksti, ms = 3500) {
  const el = $('#ilmoitus');
  el.textContent = teksti; el.hidden = false;
  clearTimeout(ilmoitusAjastin);
  ilmoitusAjastin = setTimeout(() => { el.hidden = true; }, ms);
}

// ------------------------------------------------------------- osoitteet (Regio.Insula.Ovi)
const ROOMA = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };
function osoiteOsat(s) {
  const t = normalisoi(s).replace(/[.,/:;\-–]/g, ' ').replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2')
    .trim().split(/\s+/).filter(Boolean);
  if (!t.length || t.length > 3) return null;
  const regio = ROOMA[t[0]] || (/^[1-9]$/.test(t[0]) ? +t[0] : null);
  if (!regio) return null;
  if (t[1] && !/^\d{1,2}$/.test(t[1])) return null;
  if (t[2] && !/^(\d{1,3}|[a-z])$/.test(t[2])) return null;
  return [regio, t[1] ? +t[1] : null, t[2] || null];
}
const OSOITE_RE = /\b(IX|IV|V?I{1,3}|V)\s*[.\s,]\s*(\d{1,2})(?:\s*[.\s,]\s*(\d{1,3}|[A-Za-z])\b)?/;
function osoiteNimesta(nimi) {
  const m = OSOITE_RE.exec(nimi || '');
  return m ? [ROOMA[m[1].toLowerCase()], +m[2], m[3] ? m[3].toLowerCase() : null] : null;
}
function osoiteTasmaa(haku, os) {
  if (!os || !haku) return false;
  if (haku[0] !== os[0]) return false;
  if (haku[1] !== null && haku[1] !== os[1]) return false;
  if (haku[2] !== null && haku[2] !== os[2]) return false;
  return true;
}
for (const k of KOHTEET) k._os = k.osoite ? osoiteOsat(k.osoite) : null;

// ------------------------------------------------------------- puhe (ääneen luku)
const LYHENTEET = [
  [/\beaa\./g, 'ennen ajanlaskun alkua'], [/\bjaa\./g, 'jälkeen ajanlaskun alun'],
  [/\besim\./g, 'esimerkiksi'], [/\bn\. (?=\d)/g, 'noin '], [/\bns\./g, 'niin sanottu'],
  [/\bklo\b/g, 'kello'], [/\bm²/g, 'neliömetriä'], [/(\d) ?€/g, '$1 euroa'],
  [/(\d)\s?–\s?(\d)/g, '$1 – $2'],
];
const LYHENNESANAT = new Set(['DNA', 'PDF', 'WC']);
function puheeksi(teksti) {
  let s = String(teksti || '');
  for (const [re, kor] of LYHENTEET) s = s.replace(re, kor);
  // Isoilla kirjaimilla kirjoitetut latinan sanat (HAVE, SALVE LUCRU) sanoina, ei kirjaimittain
  return s.replace(/\b([A-ZÄÖ]{3,})\b/g, (m, w) => (LYHENNESANAT.has(w) ? w : w[0] + w.slice(1).toLowerCase()));
}
function pilkoLauseiksi(kappaleet) {
  const ulos = [];
  for (const k of kappaleet) {
    if (!k) continue;
    for (let lause of puheeksi(k).split(/(?<=[.!?…])\s+/)) {
      while (lause.length > 230) {
        const i = lause.lastIndexOf(', ', 200);
        if (i < 60) break;
        ulos.push(lause.slice(0, i + 1)); lause = lause.slice(i + 2);
      }
      if (lause.trim()) ulos.push(lause.trim());
    }
  }
  return ulos;
}

const Puhe = {
  tuettu: 'speechSynthesis' in window,
  aanet: [], jono: [], indeksi: 0, otsikko: '', id: null,
  kaynnissa: false, tauolla: false, utt: null,
  init() {
    if (!this.tuettu) return;
    const lataa = () => { this.aanet = speechSynthesis.getVoices(); paivitaAaniasetus(); };
    lataa();
    speechSynthesis.addEventListener('voiceschanged', lataa);
  },
  suomi() { return this.aanet.filter(v => /^fi/i.test(v.lang)); },
  aani() {
    const fi = this.suomi(), nimi = S.get('aani', null);
    return fi.find(v => v.name === nimi) || fi.find(v => v.localService) || fi[0] || null;
  },
  puhu(id, otsikko, kappaleet, kieli = 'fi-FI') {
    if (!this.tuettu) { ilmoita('Tämä selain ei osaa lukea tekstiä ääneen.'); return; }
    this.lopeta(true);
    this.id = id; this.otsikko = otsikko; this.kieli = kieli;
    this.jono = kieli === 'fi-FI' ? pilkoLauseiksi(kappaleet) : kappaleet; this.indeksi = 0;
    this.kaynnissa = true; this.tauolla = false;
    if (kieli === 'fi-FI' && !this.suomi().length && !S.get('aaniVaroitettu', false)) {
      ilmoita('Puhelimesta ei löytynyt suomenkielistä puheääntä. Lataa ääniopastus: Tietoa → Ääniopastus.', 6000);
      S.set('aaniVaroitettu', true);
    }
    this.seuraava(); paivitaPuhepalkki();
  },
  seuraava() {
    if (!this.kaynnissa || this.tauolla) return;
    if (this.indeksi >= this.jono.length) { this.lopeta(); return; }
    const u = new SpeechSynthesisUtterance(this.jono[this.indeksi]);
    u.lang = this.kieli || 'fi-FI';
    const a = u.lang === 'fi-FI' ? this.aani() : this.aanet.find(v => v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
    if (a) u.voice = a;
    u.rate = S.get('nopeus', 1);
    u.onend = () => { if (this.utt !== u) return; this.indeksi++; this.seuraava(); };
    u.onerror = e => {
      if (this.utt !== u || e.error === 'interrupted' || e.error === 'canceled') return;
      this.indeksi++; this.seuraava();
    };
    this.utt = u;
    speechSynthesis.speak(u);
  },
  // Androidin Chrome ei tue pause()-kutsua luotettavasti: tauko = keskeytys ja paluu samaan lauseeseen.
  tauko() { this.tauolla = true; this.utt = null; speechSynthesis.cancel(); paivitaPuhepalkki(); },
  jatka() { this.tauolla = false; this.seuraava(); paivitaPuhepalkki(); },
  lopeta(hiljaa) {
    this.kaynnissa = false; this.tauolla = false; this.utt = null;
    if (this.tuettu) speechSynthesis.cancel();
    if (!hiljaa) paivitaPuhepalkki();
  },
};
// ------------------------------------------------------------- valmiit äänitiedostot (ääniopastus)
// Tekstit on luettu etukäteen neuroäänellä (tools/tee_aanet.py). Tiedostot ladataan omaan
// välimuistiinsa, joka säilyy oppaan versiopäivitysten yli. Ilman latausta ääni soi netistä,
// ja ilman nettiä käytetään puhelimen omaa puheääntä.
const AANET = window.AANET || null;
const AANIVARASTO = 'opas-aanet';
const Aani = {
  el: new Audio(), id: null, otsikko: '', blobUrl: null,
  get kaynnissa() { return this.id !== null; },
  get tauolla() { return this.id !== null && this.el.paused; },
  onko(id) { return !!(AANET && AANET.tiedostot[id]) && S.get('aaniopas', true); },
  async soita(id, otsikko) {
    this.lopeta(true); Puhe.lopeta(true);
    const url = new URL(AANET.tiedostot[id].f, location.href).href;
    let lahde = null;
    try {
      const r = 'caches' in window ? await caches.match(url) : null;
      if (r) { this.blobUrl = URL.createObjectURL(await r.blob()); lahde = this.blobUrl; }
    } catch { /* välimuisti ei käytettävissä */ }
    if (!lahde) {
      if (!navigator.onLine) return false;   // ei ladattu eikä verkkoa → puhelimen puheääni
      lahde = url;                            // soitetaan suoraan netistä
    }
    this.id = id; this.otsikko = otsikko;
    this.el.src = lahde;
    this.el.playbackRate = S.get('nopeus', 1);
    asetaMediaSession(otsikko);
    paivitaPuhepalkki();
    try { await this.el.play(); } catch (e) { if (e.name !== 'AbortError') { this.lopeta(); return false; } }
    return true;
  },
  tauko() { this.el.pause(); },
  jatka() { this.el.play().catch(() => {}); },
  siirra(s) {
    const d = isFinite(this.el.duration) ? this.el.duration : Infinity;
    this.el.currentTime = Math.max(0, Math.min(d - 0.5, this.el.currentTime + s));
  },
  lopeta(hiljaa) {
    const oli = this.id !== null;
    this.id = null;
    if (oli) { this.el.pause(); this.el.removeAttribute('src'); this.el.load(); }
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; }
    if (!hiljaa) paivitaPuhepalkki();
  },
};
Aani.el.preload = 'auto';
Aani.el.addEventListener('ended', () => Aani.lopeta());
Aani.el.addEventListener('play', () => paivitaPuhepalkki());
Aani.el.addEventListener('pause', () => paivitaPuhepalkki());
Aani.el.addEventListener('timeupdate', () => paivitaAika());
Aani.el.addEventListener('error', () => {
  if (!Aani.id) return;
  const id = Aani.id;
  Aani.lopeta(true);
  ilmoita('Äänitiedostoa ei saatu – luetaan puhelimen puheäänellä.');
  puhuTekstina(id);
});
// Lukitusnäytön ja kuulokkeiden ohjaimet (toisto jatkuu, vaikka näyttö sammuu)
function asetaMediaSession(otsikko) {
  if (!('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  ms.metadata = new MediaMetadata({ title: otsikko, artist: 'Pompeiji-opas', album: 'Ääniopastus',
    artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
  const kasittelijat = { play: () => Aani.jatka(), pause: () => Aani.tauko(), stop: () => Aani.lopeta(),
    seekbackward: () => Aani.siirra(-10), seekforward: () => Aani.siirra(10) };
  for (const [tapahtuma, f] of Object.entries(kasittelijat)) {
    try { ms.setActionHandler(tapahtuma, f); } catch { /* ei tuettu */ }
  }
}

const IKONI_TAUKO = '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
const IKONI_TOISTO = '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>';
const aktiivinenToisto = () => (Aani.kaynnissa ? Aani : Puhe.kaynnissa ? Puhe : null);
function mmss(s) { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function paivitaAika() {
  if (!Aani.kaynnissa) return;
  const d = Aani.el.duration;
  $('#puhe-aika').textContent = isFinite(d) ? `${mmss(Aani.el.currentTime)} / ${mmss(d)}` : mmss(Aani.el.currentTime);
}
function paivitaPuhepalkki() {
  const t = aktiivinenToisto();
  $('#puhepalkki').hidden = !t;
  document.body.classList.toggle('puhuu', !!t);
  $('#puhe-otsikko').textContent = t ? t.otsikko : '';
  $('#puhe-tauko').innerHTML = t && t.tauolla ? IKONI_TOISTO : IKONI_TAUKO;
  $('#puhe-tauko').setAttribute('aria-label', t && t.tauolla ? 'Jatka' : 'Tauko');
  $('#puhe-taakse').hidden = t !== Aani;
  $('#puhe-aika').hidden = t !== Aani;
  paivitaAika();
  document.querySelectorAll('[data-kuuntele]').forEach(b => {
    const paalla = !!t && t.id === b.dataset.kuuntele;
    b.classList.toggle('ensisijainen', paalla);
    b.querySelector('span').textContent = paalla ? (t.tauolla ? 'Tauolla' : 'Kuuntelet…') : 'Kuuntele';
  });
}
function puhuTekstina(id) {
  const k = kohdeById[id];
  if (k) {
    Puhe.puhu(id, k.nimi, [k.nimi + '.', k.lyhyt, ...(k.teksti || []),
      k.katso?.length ? 'Katso erityisesti: ' + k.katso.join('. ') + '.' : '',
      k.tiesitko ? 'Tiesitkö? ' + k.tiesitko : '']);
    return;
  }
  const a = TIETOA.taustaa.find(x => 'a-' + x.id === id);
  if (a) { Puhe.puhu(id, a.otsikko, [a.otsikko + '.', ...(a.teksti || [])]); return; }
  const l = id.startsWith('lause-') && window.MATKA?.lauseet[+id.slice(6)];
  if (l) Puhe.puhu(id, l.it, [l.it], 'it-IT');
}
async function kuuntele(id) {
  const t = aktiivinenToisto();
  if (t && t.id === id) { t.tauolla ? t.jatka() : t.tauko(); paivitaPuhepalkki(); return; }
  const otsikko = kohdeById[id]?.nimi || TIETOA.taustaa.find(x => 'a-' + x.id === id)?.otsikko
    || (id.startsWith('lause-') ? window.MATKA?.lauseet[+id.slice(6)]?.it : '') || '';
  if (Aani.onko(id) && await Aani.soita(id, otsikko)) return;
  puhuTekstina(id);
}

// Ääniopastuksen lataus puhelimeen
const aanetUrlit = () => (AANET ? Object.values(AANET.tiedostot).map(t => new URL(t.f, location.href).href) : []);
let aanetLatautuu = false, aanetEdistys = '';
async function aanetTila() {
  if (!AANET || !('caches' in window)) return { ladattu: 0, yht: 0 };
  const c = await caches.open(AANIVARASTO);
  const olemassa = new Set((await c.keys()).map(r => r.url));
  const urlit = aanetUrlit();
  return { ladattu: urlit.filter(u => olemassa.has(u)).length, yht: urlit.length };
}
async function lataaAanet() {
  if (aanetLatautuu || !AANET) return;
  aanetLatautuu = true;
  try { await navigator.storage?.persist?.(); } catch { /* ei tuettu */ }
  const c = await caches.open(AANIVARASTO);
  const urlit = aanetUrlit(), halutut = new Set(urlit);
  for (const r of await c.keys()) if (!halutut.has(r.url)) await c.delete(r);   // vanhentuneet pois
  const olemassa = new Set((await c.keys()).map(r => r.url));
  const jono = urlit.filter(u => !olemassa.has(u));
  const yht = jono.length;
  let valmiina = 0, virheet = 0;
  const lataaja = async () => {
    while (jono.length) {
      const u = jono.shift();
      try {
        const r = await fetch(u, { cache: 'no-store' });
        if (!r.ok) throw new Error(String(r.status));
        await c.put(u, r);
      } catch { virheet++; }
      valmiina++;
      aanetEdistys = `Ladataan… ${valmiina}/${yht}`;
      paivitaAanetKortti();
    }
  };
  await Promise.all([lataaja(), lataaja(), lataaja()]);
  aanetLatautuu = false;
  aanetEdistys = virheet ? `${virheet} tiedoston lataus epäonnistui. Tarkista netti ja yritä uudelleen.` : '';
  paivitaAanetKortti();
  if (!virheet) ilmoita('Ääniopastus on ladattu puhelimeen.');
}
async function paivitaAanetKortti() {
  const el = $('#aanet-kortti'); if (!el) return;
  if (!AANET) { el.innerHTML = '<p class="pieni-teksti" style="margin:0">Tässä versiossa ei ole valmiita äänitiedostoja.</p>'; return; }
  const { ladattu, yht } = await aanetTila();
  const mt = Math.round(AANET.yhteensa / 1e6), min = Math.round(AANET.yhteensa / 6000 / 60);
  const valmis = yht && ladattu === yht;
  el.className = 'kortti' + (valmis ? ' offline ok' : '');
  el.innerHTML = valmis
    ? `<b>✓ Ääniopastus on ladattu puhelimeen.</b>
       <p class="pieni-teksti" style="margin:4px 0 0">${yht} äänitiedostoa, noin ${min} minuuttia, ${esc(AANET.nimi)} lukee. Kuuntele-painike toimii myös ilman nettiä, ja toisto jatkuu, vaikka näyttö sammuu.</p>`
    : `<b>Lataa ääniopastus puhelimeen</b>
       <p class="pieni-teksti" style="margin:4px 0 8px">Kaikki kohteet ja artikkelit on luettu valmiiksi luonnollisella äänellä (${esc(AANET.nimi)}, noin ${min} minuuttia). Lataa ne kotona wifissä (noin ${mt} Mt), niin ne toimivat myös ilman nettiä. Ilman latausta ääni soi netin kautta.</p>
       ${aanetLatautuu ? '' : `<button class="nappi ensisijainen" data-lataa-aanet>${ladattu ? `Jatka latausta (${ladattu}/${yht} valmiina)` : `Lataa ääniopastus (${mt} Mt)`}</button>`}`;
  if (aanetEdistys) el.insertAdjacentHTML('beforeend', `<p class="pieni-teksti" style="margin:8px 0 0">${esc(aanetEdistys)}</p>`);
}
const kuunteleNappi = id =>
  `<button class="nappi" data-kuuntele="${esc(id)}"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/></svg><span>Kuuntele</span></button>`;

// ------------------------------------------------------------- näkymät ja reititys
const OTSIKOT = { kartta: 'Pompeiji', kohteet: 'Kohteet', reitit: 'Reitit', tietoa: 'Tietoa' };
const VALILEHTI = { kohde: 'kohteet', artikkeli: 'tietoa', matka: 'tietoa', omareitti: 'reitit' };
let nykyinen = null;

function reititys() {
  const [nimi, arg] = (location.hash.slice(1) || 'kartta').split('/');
  nayta(nimi in OTSIKOT || nimi in VALILEHTI ? nimi : 'kartta', arg ? decodeURIComponent(arg) : null);
}
function nayta(nimi, arg) {
  suljeArkki();
  $('#lause-iso').hidden = true;
  document.querySelectorAll('.nakyma').forEach(n => { n.hidden = n.id !== 'nakyma-' + nimi; });
  const tab = VALILEHTI[nimi] || nimi;
  document.querySelectorAll('#alapalkki a').forEach(a => a.classList.toggle('aktiivinen', a.dataset.v === tab));
  $('#takaisin').hidden = !(nimi in VALILEHTI);
  let otsikko = OTSIKOT[nimi];
  if (nimi === 'kartta') naytaKartta();
  if (nimi === 'kohteet') { if (listaLikainen) piirraLista(); }
  if (nimi === 'kohde') { otsikko = piirraKohde(arg); }
  if (nimi === 'reitit') piirraReitit();
  if (nimi === 'tietoa') piirraTietoa();
  if (nimi === 'artikkeli') { otsikko = piirraArtikkeli(arg); }
  if (nimi === 'matka') { otsikko = piirraMatka(); }
  if (nimi === 'omareitti') { otsikko = piirraOmaValinta(); }
  $('#otsikko').textContent = otsikko || 'Pompeiji';
  if (nimi in VALILEHTI) $('#nakyma-' + nimi).scrollTop = 0;
  nykyinen = nimi;
}
$('#takaisin').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.hash = '#' + (VALILEHTI[nykyinen] || 'kohteet');
});

// ------------------------------------------------------------- kartta
let kartta = null, renderer = null;
const K = {};                      // karttatasot
let merkit = {};                   // kohde-id -> marker
let paikat = [];                   // OSM:n nimetyt paikat napautusta varten
let korostus = null;
let tarkennaKohteeseen = null;     // { id } tai { paikka } — käsitellään kun kartta näkyy
let palvelutNakyvissa = S.get('palvelut', true);

let odotaKokoa = null;
let sovitaReittiin = false;         // reitti aloitettiin ennen kuin kartta oli luotu
function alustaKartta() {
  // Kartta luodaan vasta, kun elementillä on koko — muuten Leaflet laskee näkymän
  // nollakokoiseen ikkunaan ja zoomaa maksimiin.
  const el = $('#kartta');
  if (el.clientHeight === 0) {
    if (!odotaKokoa) {
      odotaKokoa = new ResizeObserver(() => {
        if (el.clientHeight > 0) { odotaKokoa.disconnect(); odotaKokoa = null; if (!kartta) alustaKartta(); }
      });
      odotaKokoa.observe(el);
    }
    return;
  }
  const [s, w, n, e] = KARTTA.rajat;
  const rajat = L.latLngBounds([s, w], [n, e]);
  kartta = L.map('kartta', {
    zoomControl: false, preferCanvas: true, minZoom: 15, maxZoom: 21,
    maxBounds: rajat.pad(0.4), maxBoundsViscosity: 0.8, zoomSnap: 0.25, zoomDelta: 0.5,
    bounceAtZoomLimits: false,
  });
  window.__kartta = kartta;   // vianetsintää varten selaimen konsolista
  kartta.attributionControl.setPrefix(false).addAttribution('© OpenStreetMap-tekijät');
  renderer = L.canvas({ padding: 0.4, tolerance: 4 });

  const T = KARTTA.tasot;
  const poly = (taso, tyyli) => L.polygon(T[taso].map(p => p.map(dekoodaa)), { renderer, interactive: false, ...tyyli });
  const viiva = (taso, tyyli) => L.polyline(T[taso].map(dekoodaa), { renderer, interactive: false, ...tyyli });

  K.alue = poly('alue', { color: '#cbb48c', weight: 1, fillColor: '#e9dcc2', fillOpacity: 1 });
  K.vihrea = poly('vihrea', { stroke: false, fillColor: '#c9d7a8', fillOpacity: .95 });
  K.tie = viiva('tie', { color: '#fffdf8', weight: 3, opacity: 1 });
  K.rata = viiva('rata', { color: '#8b8278', weight: 1.5, dashArray: '5 4' });
  K.rakM = poly('rak_m', { stroke: false, fillColor: '#d8d2c8', fillOpacity: 1 });
  K.katuReuna = viiva('katu', { color: '#cdb995', weight: 6, lineCap: 'round', lineJoin: 'round' });
  K.katu = viiva('katu', { color: '#f8f1e2', weight: 4, lineCap: 'round', lineJoin: 'round' });
  K.rakA = poly('rak_a', { stroke: false, fillColor: '#d6b68b', fillOpacity: .9 });
  K.seina = viiva('seina', { color: '#7c4f33', weight: 1, opacity: .9 });
  K.muuri = viiva('muuri', { color: '#6b4428', weight: 4, opacity: .85 });
  for (const t of ['alue', 'vihrea', 'tie', 'rata', 'rakM', 'katuReuna', 'katu', 'rakA', 'muuri']) K[t].addTo(kartta);

  // Regioiden ja katujen nimet sekä palvelut
  for (const r of KARTTA.regiot) {
    L.marker(piste(r.p), { interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'regionimi', html: `<span>${esc(r.n)}</span>`, iconSize: null }) }).addTo(kartta);
  }
  for (const k of KARTTA.kadut) {
    L.marker(piste(k.p), { interactive: false, keyboard: false,
      icon: L.divIcon({ className: `katunimi l${k.z}`, iconSize: null,
        html: `<span style="transform:translate(-50%,-50%) rotate(${k.a}deg)">${esc(k.n)}</span>` }) }).addTo(kartta);
  }
  const PALVELU_HTML = { wc: 'WC', vesi: '<i>💧</i>', ovi: '<svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 21V4h10v17M3 21h18M13 12h.5"/></svg>', kahvila: '☕' };
  const PALVELU_NIMI = { wc: 'Vessa', vesi: 'Juomavesipiste', ovi: 'Sisäänkäynti', kahvila: 'Ravintola ja kahvila' };
  for (const p of KARTTA.palvelut) {
    const m = L.marker(piste(p.p), {
      icon: L.divIcon({ className: '', iconSize: null, html: `<div class="palvelu ${p.t}">${PALVELU_HTML[p.t]}</div>` }) }).addTo(kartta);
    m.on('click', () => avaaArkki(`<h2>${esc(p.n || PALVELU_NIMI[p.t])}</h2>
      <div class="alaots">${esc(PALVELU_NIMI[p.t])}</div>
      ${p.t === 'vesi' ? '<p>Täytä oma juomapullo. Jätä hana kiinni käytön jälkeen.</p>' : ''}
      ${p.t === 'wc' ? '<p>Vessojen sijainnit ovat OpenStreetMap-kartasta. Viralliset vessat ovat sisäänkäyntien luona sekä Casina dell’Aquilan, Antiquariumin, Gladiaattorien kasarmin ja Mysteerien huvilan luona.</p>' : ''}
      ${sijainti ? `<p class="pieni-teksti">${matka(etaisyys(sijainti, piste(p.p)))} sinusta</p>` : ''}`));
  }
  $('#kartta').classList.toggle('palvelut-pois', !palvelutNakyvissa);
  $('#nappi-palvelut').classList.toggle('palvelut-pois', !palvelutNakyvissa);

  // Nimetyt paikat (OSM) napautusta varten
  paikat = KARTTA.paikat.map(p => {
    const o = { n: p.n, e: p.e, os: osoiteNimesta(p.n) };
    if (p.g) {
      o.renkaat = p.g.map(dekoodaa);
      o.bb = L.latLngBounds(o.renkaat.flat());
      const c = o.bb.getCenter(); o.keski = [c.lat, c.lng];
      o.ala = (o.bb.getNorth() - o.bb.getSouth()) * (o.bb.getEast() - o.bb.getWest());
    } else { o.keski = piste(p.p); o.ala = 1; }
    return o;
  });

  K.reitti = L.layerGroup().addTo(kartta);
  K.merkit = L.layerGroup().addTo(kartta);
  K.oma = L.layerGroup().addTo(kartta);
  for (const k of KOHTEET) {
    const m = L.marker(k.sijainti, { riseOnHover: true, keyboard: false, icon: kohdeIkoni(k) });
    m.on('click', ev => { L.DomEvent.stopPropagation(ev); avaaKohdeArkki(k.id); });
    m.addTo(K.merkit);
    merkit[k.id] = m;
  }

  const oma = sijainti && rajat.pad(0.05).contains(sijainti);
  if (oma) kartta.setView(sijainti, 18);
  else kartta.fitBounds(L.latLngBounds([[40.7475, 14.4775], [40.7540, 14.4960]]), { padding: [10, 10] });
  // Kuuntelijat vasta näkymän asettamisen jälkeen: ensimmäinen zoomend tulee ennen
  // Leafletin load-tapahtumaa, jolloin piirtäjä ei ole vielä valmis.
  kartta.on('zoomend', paivitaZoomTyylit);
  kartta.on('click', karttaKlikki);
  paivitaZoomTyylit();
  piirraReittiKartalle(sovitaReittiin);
  sovitaReittiin = false;
  paivitaOmaSijainti();
  kasitteleTarkennus();
}

function kohdeIkoni(k, numero = '') {
  const kat = KATEGORIAT[k.kategoria] || KATEGORIAT.julkinen;
  let luokat = 'merkki';
  if (nahty.has(k.id)) luokat += ' nahty';
  if (aktiivinenReitti && !numero) luokat += ' himmea';
  if (valittuKohde === k.id) luokat += ' valittu';
  return L.divIcon({ className: '', iconSize: null,
    html: `<div class="${luokat}" style="--v:${kat.vari}">${numero}</div><div class="merkki-nimi">${esc(k.nimi.split(' – ')[0])}</div>` });
}
let valittuKohde = null;
function paivitaMerkit() {
  if (!kartta) return;
  const numerot = {};
  if (aktiivinenReitti) {
    reittiById[aktiivinenReitti.id].pysakit.forEach((id, i) => { if (!(id in numerot)) numerot[id] = String(i + 1); });
  }
  for (const k of KOHTEET) merkit[k.id].setIcon(kohdeIkoni(k, numerot[k.id] || ''));
}

function paivitaZoomTyylit() {
  const z = kartta.getZoom();
  const mpp = 156543.03 * Math.cos(40.75 * Math.PI / 180) / Math.pow(2, z);   // metriä / pikseli
  const katu = Math.max(2.5, 4.5 / mpp);
  K.katu.setStyle({ weight: katu });
  K.katuReuna.setStyle({ weight: katu + 2 });
  K.muuri.setStyle({ weight: Math.max(2.5, 3.5 / mpp) });
  if (z >= 17) {
    K.seina.setStyle({ weight: Math.max(.6, .6 / mpp) });
    if (!kartta.hasLayer(K.seina)) K.seina.addTo(kartta);
  } else if (kartta.hasLayer(K.seina)) kartta.removeLayer(K.seina);
  const el = $('#kartta');
  for (const [luokka, raja] of [['zz165', 16.5], ['zz17', 17], ['zz175', 17.5], ['zz18', 18]]) el.classList.toggle(luokka, z >= raja);
}

function karttaKlikki(e) {
  if (!$('#arkki').hidden) { suljeArkki(); return; }
  const p = [e.latlng.lat, e.latlng.lng];
  let paras = null;
  for (const o of paikat) {
    if (o.renkaat) {
      if (!o.bb.contains(e.latlng)) continue;
      if (!o.renkaat.some(r => sisalla(p, r))) continue;
      if (!paras || o.ala < paras.ala) paras = o;
    }
  }
  if (!paras) {
    const pikseli = 156543.03 * Math.cos(40.75 * Math.PI / 180) / Math.pow(2, kartta.getZoom());
    let lahin = null, d0 = 16 * pikseli;
    for (const o of paikat) {
      if (o.renkaat) continue;
      const d = etaisyys(p, o.keski);
      if (d < d0) { d0 = d; lahin = o; }
    }
    paras = lahin;
  }
  if (paras) naytaPaikka(paras);
}
function sisalla(p, ring) {
  let s = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > p[0]) !== (yj > p[0]) && p[1] < (xj - xi) * (p[0] - yi) / (yj - yi) + xi) s = !s;
  }
  return s;
}
function naytaPaikka(o) {
  if (korostus) { kartta.removeLayer(korostus); korostus = null; }
  if (o.renkaat) korostus = L.polygon(o.renkaat, { renderer, color: '#1f6fd1', weight: 2.5, fillOpacity: .12, interactive: false }).addTo(kartta);
  else korostus = L.circleMarker(o.keski, { renderer, radius: 9, color: '#1f6fd1', weight: 3, fillOpacity: .15, interactive: false }).addTo(kartta);
  // Onko tämä oppaan kohde (sama osoite tai hyvin lähellä)?
  let kohde = o.os ? KOHTEET.find(k => k._os && k._os[0] === o.os[0] && k._os[1] === o.os[1] && k._os[2] === o.os[2]) : null;
  if (!kohde) kohde = KOHTEET.find(k => etaisyys(k.sijainti, o.keski) < 12);
  avaaArkki(`<h2>${esc(o.n)}</h2>
    ${o.e ? `<div class="alaots">${esc(o.e)}</div>` : ''}
    ${kohde ? `<p>Oppaassa: <a href="#kohde/${kohde.id}"><b>${esc(kohde.nimi)}</b></a></p>` : ''}
    ${sijainti ? `<p class="pieni-teksti">${matka(etaisyys(sijainti, o.keski))} sinusta</p>` : ''}
    <p class="pieni-teksti">Nimi on OpenStreetMap-kartasta. Numerosarja, esimerkiksi VI.12.2, on paikan osoite: alue, kortteli ja oven numero.</p>`);
}

function kasitteleTarkennus() {
  if (!tarkennaKohteeseen || !kartta._loaded) return;
  const t = tarkennaKohteeseen; tarkennaKohteeseen = null;
  if (t.id) { kartta.setView(kohdeById[t.id].sijainti, Math.max(kartta.getZoom(), 18.5)); avaaKohdeArkki(t.id); }
  if (t.paikka) { kartta.setView(t.paikka.keski, 19); naytaPaikka(t.paikka); }
}
function naytaKartta() {
  if (!kartta) alustaKartta();
  else setTimeout(() => {
    if ($('#kartta').clientHeight > 0) kartta.invalidateSize();
    kasitteleTarkennus();
  }, 30);
  paivitaLahin();
}

// ------------------------------------------------------------- alapaneeli
function avaaArkki(html) {
  $('#arkki-sisalto').innerHTML = html;
  $('#arkki').hidden = false;
  $('#arkki').scrollTop = 0;
  paivitaPuhepalkki();
}
function suljeArkki() {
  $('#arkki').hidden = true;
  if (korostus && kartta) { kartta.removeLayer(korostus); korostus = null; }
  if (valittuKohde) { valittuKohde = null; paivitaMerkit(); }
}
$('#arkki-sulje').addEventListener('click', suljeArkki);

function tilaHtml(k, pitka = false) {
  const t = TILAT[k.tila] || TILAT.tarkista;
  return `<span class="tila ${t.luokka}">${esc(t.nimi)}</span>${k.tilaTeksti && pitka ? `<p class="tilateksti">${esc(k.tilaTeksti)}</p>` : ''}`;
}
function avaaKohdeArkki(id) {
  const k = kohdeById[id];
  valittuKohde = id; paivitaMerkit();
  const d = sijainti ? ` · ${matka(etaisyys(sijainti, k.sijainti))} sinusta` : '';
  avaaArkki(`<h2>${esc(k.nimi)}</h2>
    <div class="alaots">${esc(k.it)}${k.osoite ? ` · <span class="osoite">${esc(k.osoite)}</span>` : ''}${d}</div>
    ${tilaHtml(k)}
    <p>${esc(k.lyhyt)}</p>
    <div class="nappirivi">
      <a class="nappi ensisijainen" href="#kohde/${k.id}">Lue lisää</a>
      ${kuunteleNappi(k.id)}
    </div>`);
}

// ------------------------------------------------------------- sijainti (GPS)
let sijainti = null, tarkkuus = null, seuranta = null, ekaPaikannus = true, listanSijainti = null;
let omaMerkki = null, omaYmpyra = null;
function kaynnistaGps(kayttajaPyysi) {
  if (!('geolocation' in navigator)) { ilmoita('Puhelin ei tue paikannusta.'); return; }
  if (seuranta !== null) return;
  seuranta = navigator.geolocation.watchPosition(pos => {
    sijainti = [pos.coords.latitude, pos.coords.longitude];
    tarkkuus = pos.coords.accuracy;
    S.set('gps', true);
    $('#nappi-sijainti').classList.add('paalla');
    paivitaOmaSijainti();
    if (ekaPaikannus) {
      ekaPaikannus = false;
      $('#ilmoitus').hidden = true;
      if (kayttajaPyysi) keskitaOmaan();
    }
    paivitaLahin();
    // Lista piirretään uudelleen vain, kun on liikuttu yli 20 m (muuten se hyppii vierittäessä).
    if (!listanSijainti || etaisyys(listanSijainti, sijainti) > 20) {
      listanSijainti = sijainti;
      listaLikainen = true;
      if (nykyinen === 'kohteet') piirraLista(true);
    }
    if (aktiivinenReitti) paivitaReittipalkki();
  }, err => {
    seuranta !== null && navigator.geolocation.clearWatch(seuranta);
    seuranta = null;
    $('#nappi-sijainti').classList.remove('paalla');
    if (err.code === 1) { S.set('gps', false); ilmoita('Sijainnin käyttö on estetty. Salli se selaimen asetuksista.', 5000); }
    else if (kayttajaPyysi) ilmoita('Sijaintia ei saatu. Yritä uudelleen ulkona.');
  }, { enableHighAccuracy: true, maximumAge: 4000, timeout: 30000 });
}
function sisallaAlueella(p) {
  const [s, w, n, e] = KARTTA.rajat;
  return p && p[0] > s - .003 && p[0] < n + .003 && p[1] > w - .004 && p[1] < e + .004;
}
function keskitaOmaan() {
  if (!sijainti || !kartta) return;
  if (sisallaAlueella(sijainti)) kartta.setView(sijainti, Math.max(kartta.getZoom(), 18));
  else ilmoita(`Olet ${matka(etaisyys(sijainti, [40.7503, 14.4880]))} päässä Pompeijista. Sijaintisi näkyy kartalla, kun olet alueella.`, 5000);
}
function paivitaOmaSijainti() {
  if (!kartta || !sijainti) return;
  if (!omaMerkki) {
    omaYmpyra = L.circle(sijainti, { renderer, radius: tarkkuus, color: '#1f6fd1', weight: 1, fillOpacity: .1, interactive: false }).addTo(K.oma);
    omaMerkki = L.marker(sijainti, { interactive: false, keyboard: false, zIndexOffset: 1000,
      icon: L.divIcon({ className: '', iconSize: null, html: '<div class="oma-sijainti"></div>' }) }).addTo(K.oma);
  } else {
    omaMerkki.setLatLng(sijainti);
    omaYmpyra.setLatLng(sijainti).setRadius(tarkkuus);
  }
}
function paivitaLahin() {
  const el = $('#lahin');
  if (!sijainti || !sisallaAlueella(sijainti) || aktiivinenReitti) { el.hidden = true; return; }
  let paras = null, d0 = Infinity;
  for (const k of KOHTEET) { const d = etaisyys(sijainti, k.sijainti); if (d < d0) { d0 = d; paras = k; } }
  el.innerHTML = `Lähin: <b>${esc(paras.nimi)}</b> · ${matka(d0)}`;
  el.dataset.id = paras.id;
  el.hidden = false;
}
$('#lahin').addEventListener('click', e => {
  const id = e.currentTarget.dataset.id;
  if (id) { kartta.setView(kohdeById[id].sijainti, Math.max(kartta.getZoom(), 18.5)); avaaKohdeArkki(id); }
});
$('#nappi-sijainti').addEventListener('click', () => {
  if (seuranta === null) { ilmoita('Haetaan sijaintia…', 2500); kaynnistaGps(true); }
  else if (sijainti) keskitaOmaan();
});
$('#nappi-palvelut').addEventListener('click', () => {
  palvelutNakyvissa = !palvelutNakyvissa;
  S.set('palvelut', palvelutNakyvissa);
  $('#kartta').classList.toggle('palvelut-pois', !palvelutNakyvissa);
  $('#nappi-palvelut').classList.toggle('palvelut-pois', !palvelutNakyvissa);
  ilmoita(palvelutNakyvissa ? 'Vessat, vesipisteet ja sisäänkäynnit näkyvissä' : 'Palvelut piilotettu', 2000);
});

// ------------------------------------------------------------- kohdelista ja haku
let suodatin = 'kaikki', hakusana = '', listaLikainen = true;

function piirraSuodattimet() {
  const sirut = [['kaikki', 'Kaikki', null], ...Object.entries(KATEGORIAT)
    .filter(([id]) => KOHTEET.some(k => k.kategoria === id)).map(([id, k]) => [id, k.nimi, k.vari])];
  $('#suodattimet').innerHTML = sirut.map(([id, nimi, vari]) =>
    `<button class="siru${suodatin === id ? ' valittu' : ''}" data-suodatin="${id}">${vari ? `<i style="--v:${vari}"></i>` : ''}${esc(nimi)}</button>`).join('');
}
function kohdeRivi(k, lisa = '') {
  const kat = KATEGORIAT[k.kategoria] || KATEGORIAT.julkinen;
  const d = sijainti && sisallaAlueella(sijainti) ? matka(etaisyys(sijainti, k.sijainti)) : '';
  return `<a class="rivi" href="#kohde/${k.id}">
    <span class="pallo" style="--v:${kat.vari}"></span>
    <span class="runko"><span class="nimi">${esc(k.nimi)}</span>
      <span class="lisa">${lisa || esc(k.it)}${k.osoite ? ' · ' + esc(k.osoite) : ''}</span></span>
    <span class="oikea">${nahty.has(k.id) ? '<span class="check">✓</span><br>' : ''}${d}</span></a>`;
}
function piirraLista(vainEtaisyydet) {
  const el = $('#kohdelista');
  if (vainEtaisyydet && hakusana) return;   // ei hypitä listaa haun aikana
  listaLikainen = false;
  const q = hakusana.trim();
  let html = '';
  if (q) {
    const os = osoiteOsat(q);
    let osumat, muut = [];
    if (os) {
      osumat = KOHTEET.filter(k => osoiteTasmaa(os, k._os));
      muut = paikat.length ? paikat.filter(p => osoiteTasmaa(os, p.os)) : [];
    } else {
      const n = normalisoi(q);
      osumat = KOHTEET.filter(k => [k.nimi, k.it, k.osoite, k.alue, ...(k.hakusanat || [])].some(s => normalisoi(s).includes(n)));
      if (n.length >= 3) muut = paikat.filter(p => normalisoi(p.n).includes(n) || normalisoi(p.e).includes(n));
    }
    muut = muut.filter(p => !(p.os && osumat.some(k => k._os && k._os.join() === p.os.join()))).slice(0, 40);
    if (osumat.length) html += `<div class="ryhma">Oppaan kohteet</div>` + osumat.map(k => kohdeRivi(k)).join('');
    if (muut.length) {
      html += `<div class="ryhma">Muut paikat kartalla</div>` + muut.map(p =>
        `<button class="rivi" data-paikka="${paikat.indexOf(p)}"><span class="pallo" style="--v:#b9a68a"></span>
          <span class="runko"><span class="nimi">${esc(p.n)}</span>${p.e ? `<span class="lisa">${esc(p.e)}</span>` : ''}</span>
          <span class="oikea">${sijainti && sisallaAlueella(sijainti) ? matka(etaisyys(sijainti, p.keski)) : 'kartalle ›'}</span></button>`).join('');
    }
    if (!html) html = `<p class="tyhja">Ei osumia haulla ”${esc(q)}”.<br>Kokeile nimeä italiaksi tai osoitetta muodossa VI 12 2.</p>`;
  } else {
    const lista = KOHTEET.filter(k => suodatin === 'kaikki' || k.kategoria === suodatin);
    if (sijainti && sisallaAlueella(sijainti)) {
      lista.sort((a, b) => etaisyys(sijainti, a.sijainti) - etaisyys(sijainti, b.sijainti));
      html = `<div class="ryhma">Lähimmät ensin</div>` + lista.map(k => kohdeRivi(k)).join('');
    } else {
      for (const alue of ALUEJARJESTYS) {
        const osa = lista.filter(k => k.alue === alue);
        if (osa.length) html += `<div class="ryhma">${esc(alue)}</div>` + osa.map(k => kohdeRivi(k)).join('');
      }
      const loput = lista.filter(k => !ALUEJARJESTYS.includes(k.alue));
      if (loput.length) html += `<div class="ryhma">Muut</div>` + loput.map(k => kohdeRivi(k)).join('');
    }
    const n = KOHTEET.filter(k => nahty.has(k.id)).length;
    if (n) html += `<p class="pieni-teksti" style="text-align:center;margin-top:16px">Nähty ${n}/${KOHTEET.length} kohdetta</p>`;
  }
  el.innerHTML = html;
}
$('#hakukentta').addEventListener('input', e => { hakusana = e.target.value; piirraLista(); });
$('#suodattimet').addEventListener('click', e => {
  const b = e.target.closest('[data-suodatin]'); if (!b) return;
  suodatin = b.dataset.suodatin; piirraSuodattimet(); piirraLista();
});

// ------------------------------------------------------------- kohdesivu
function piirraKohde(id) {
  const k = kohdeById[id];
  const el = $('#nakyma-kohde');
  if (!k) { el.innerHTML = '<p class="tyhja">Kohdetta ei löytynyt.</p>'; return 'Kohde'; }
  const kat = KATEGORIAT[k.kategoria] || KATEGORIAT.julkinen;
  const lahella = KOHTEET.filter(x => x.id !== k.id)
    .map(x => [x, etaisyys(k.sijainti, x.sijainti)]).sort((a, b) => a[1] - b[1]).slice(0, 4);
  let reittiHtml = '';
  if (aktiivinenReitti) {
    const r = reittiById[aktiivinenReitti.id], i = r.pysakit.indexOf(k.id);
    if (i >= 0) {
      const ed = r.pysakit[i - 1], seur = r.pysakit[i + 1];
      reittiHtml = `<div class="ryhma">Reitti: ${esc(r.nimi)} · kohde ${i + 1}/${r.pysakit.length}</div><div class="reittinav">
        ${ed ? `<a class="nappi" href="#kohde/${ed}">‹ ${esc(kohdeById[ed].nimi)}</a>` : ''}
        ${seur ? `<a class="nappi ensisijainen" href="#kohde/${seur}">${esc(kohdeById[seur].nimi)} ›</a>` : ''}</div>`;
    }
  }
  el.innerHTML = `<article class="kohde">
    <div class="kohde-yla"><span class="pallo" style="--v:${kat.vari}"></span><div>
      <h1>${esc(k.nimi)}</h1>
      <div class="alaots">${esc(k.it)}${k.osoite ? ` · <span class="osoite">${esc(k.osoite)}</span>` : ''} · ${esc(kat.nimi)}</div>
    </div></div>
    ${tilaHtml(k, true)}
    <div class="nappirivi">
      ${kuunteleNappi(k.id)}
      <button class="nappi" data-kartalle="${k.id}"><svg viewBox="0 0 24 24"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>Kartalla</button>
      <button class="nappi vihrea${nahty.has(k.id) ? ' paalla' : ''}" data-nahty="${k.id}">${nahty.has(k.id) ? '✓ Nähty' : 'Merkitse nähdyksi'}</button>
      ${omaNappi(k.id)}
    </div>
    <p class="lyhyt">${esc(k.lyhyt)}</p>
    ${(k.teksti || []).map(p => `<p>${esc(p)}</p>`).join('')}
    ${k.katso?.length ? `<h2>Katso erityisesti</h2><ul class="katso">${k.katso.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${k.tiesitko ? `<aside class="tiesitko"><h3>Tiesitkö?</h3><p>${esc(k.tiesitko)}</p></aside>` : ''}
    ${reittiHtml}
    <h2>Lähellä</h2>
    <div class="lahella">${lahella.map(([x, d]) => kohdeRivi(x, `${matka(d)} täältä`)).join('')}</div>
  </article>`;
  paivitaPuhepalkki();
  return k.nimi;
}

// ------------------------------------------------------------- reitit
function piirraReitit() {
  const el = $('#nakyma-reitit');
  if (!REITIT.length) { el.innerHTML = '<p class="tyhja">Reittejä ei ole vielä laskettu.</p>'; return; }
  el.innerHTML = matkaLinkki() + `<p class="pieni-teksti">Reitit kulkevat katuja pitkin. Ajat ovat suuntaa antavia: kävely rauhallisella vauhdilla
    epätasaisella kivetyksellä sekä tavallinen pysähtyminen kohteissa. Talvella viimeinen sisäänpääsy on jo klo 15.30.</p>` +
  omaKortti() +
  REITIT.map(r => {
    const aktiivinen = aktiivinenReitti?.id === r.id;
    const pysakit = pysakkiLista(r);
    return `<div class="kortti reitti${aktiivinen ? ' aktiivinen-reitti' : ''}">
      <h2>${esc(r.nimi)}</h2>
      <div class="tiedot"><span><b>${kesto(r.kavely_min + r.kohde_min)}</b> yhteensä</span>
        <span>${(r.metrit / 1000).toFixed(1).replace('.', ',')} km</span><span>${r.pysakit.length} kohdetta</span></div>
      <p>${esc(r.kuvaus)}</p>
      ${r.huom ? `<p class="varoitus">${esc(r.huom)}</p>` : ''}
      <div class="nappirivi">
        ${aktiivinen
          ? `<a class="nappi ensisijainen" href="#kartta">Jatka reittiä (kohde ${aktiivinenReitti.i + 1})</a><button class="nappi" data-reitti-lopeta>Lopeta</button>`
          : `<button class="nappi ensisijainen" data-reitti-aloita="${r.id}">Aloita reitti</button>`}
      </div>
      <details><summary>Kohteet järjestyksessä</summary>${pysakit}</details>
    </div>`;
  }).join('');
}
function pysakkiLista(r) {
  return r.pysakit.map((id, i) => {
    const k = kohdeById[id], kat = KATEGORIAT[k.kategoria] || KATEGORIAT.julkinen;
    const m = i > 0 ? r.osuudet[i - 1].m : null;
    return `<a class="pysakki" href="#kohde/${id}"><span class="numero" style="--v:${kat.vari}">${i + 1}</span>
      <span>${esc(k.nimi)}${nahty.has(id) ? ' <span style="color:var(--ok)">✓</span>' : ''}</span>${m ? `<small>${matka(m)}</small>` : ''}</a>`;
  }).join('');
}
function aloitaReitti(id) {
  aktiivinenReitti = { id, i: 0 };
  S.set('reitti', aktiivinenReitti);
  if (!kartta) sovitaReittiin = true;
  piirraReittiKartalle(true);
  location.hash = '#kartta';
}
function lopetaReitti() {
  aktiivinenReitti = null;
  S.set('reitti', null);
  piirraReittiKartalle();
  if (nykyinen === 'reitit') piirraReitit();
}
function piirraReittiKartalle(sovita) {
  if (!kartta) return;
  K.reitti.clearLayers();
  paivitaMerkit();
  $('#reittipalkki').hidden = !aktiivinenReitti;
  $('#nakyma-kartta').classList.toggle('reitilla', !!aktiivinenReitti);
  paivitaLahin();
  if (!aktiivinenReitti) return;
  const r = reittiById[aktiivinenReitti.id];
  const i = aktiivinenReitti.i;
  r.osuudet.forEach((o, j) => {
    const g = dekoodaa(o.g);
    const kuljettu = j < i;   // osuus j vie pysäkiltä j pysäkille j+1
    L.polyline(g, { renderer, color: '#fff', weight: 8, opacity: .9, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(K.reitti);
    L.polyline(g, { renderer, color: kuljettu ? '#a99a8c' : (j === i ? '#1f6fd1' : '#b8322a'), weight: j === i ? 5 : 4,
      opacity: .95, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(K.reitti);
  });
  if (sovita) {
    const kaikki = r.osuudet.flatMap(o => dekoodaa(o.g));
    setTimeout(() => kartta.fitBounds(L.latLngBounds(kaikki), { padding: [30, 30] }), 60);
  }
  paivitaReittipalkki();
}
function paivitaReittipalkki() {
  if (!aktiivinenReitti) return;
  const r = reittiById[aktiivinenReitti.id], i = aktiivinenReitti.i, k = kohdeById[r.pysakit[i]];
  const d = sijainti && sisallaAlueella(sijainti) ? ` · ${matka(etaisyys(sijainti, k.sijainti))}` : '';
  $('#reitti-nyt').innerHTML = `<small>Kohde ${i + 1}/${r.pysakit.length}${d}</small><strong>${esc(k.nimi)}</strong>`;
  $('#reitti-edel').disabled = i === 0;
  $('#reitti-seur').disabled = i === r.pysakit.length - 1;
}
function siirryReitilla(delta) {
  const r = reittiById[aktiivinenReitti.id];
  aktiivinenReitti.i = Math.min(r.pysakit.length - 1, Math.max(0, aktiivinenReitti.i + delta));
  S.set('reitti', aktiivinenReitti);
  piirraReittiKartalle();
  kartta.panTo(kohdeById[r.pysakit[aktiivinenReitti.i]].sijainti);
}
$('#reitti-edel').addEventListener('click', () => siirryReitilla(-1));
$('#reitti-seur').addEventListener('click', () => siirryReitilla(1));
$('#reitti-nyt').addEventListener('click', () => {
  const id = reittiById[aktiivinenReitti.id].pysakit[aktiivinenReitti.i];
  kartta.panTo(kohdeById[id].sijainti); avaaKohdeArkki(id);
});
$('#reitti-lopeta').addEventListener('click', () => { lopetaReitti(); ilmoita('Reitti lopetettu'); });

// ------------------------------------------------------------- oma reitti
// Käyttäjä valitsee kohteet, opas järjestää ne lyhimmäksi kävelyreitiksi ja laskee ajan.
// Kävelyverkko (data/verkko.js): solmut ovat risteyksiä, kaaret niiden välisiä katupätkiä
// muodossa [alku, loppu, pituus dm, tyyppi, muoto]; tyyppi 0 = katu, 1 = portaat, 2 = huoltotie.
// Kohde kiinnittyy lähimpään katupisteeseen: kohteet[id] = [solmu, etäisyys kadulle dm].
// Funktiot ovat tavallisia funktiomäärittelyjä, koska oma reitti lasketaan jo käynnistyksessä.
const SISAANKAYNNIT = [['porta-marina', 'Porta Marina (lähinnä asemaa)'], ['piazza-anfiteatro', 'Piazza Anfiteatro']];

function alustaVerkko() {
  if (verkko || !VERKKO) return verkko;
  const vierus = Array.from({ length: VERKKO.solmuja }, () => []);
  VERKKO.kaaret.forEach((e, i) => { vierus[e[0]].push(i); vierus[e[1]].push(i); });
  verkko = { vierus, muodot: new Map() };
  return verkko;
}
// Kaaren muoto kokonaislukupisteinä [x, y], sama koodaus kuin kartta.js:ssä.
function kaarenMuoto(i) {
  let m = verkko.muodot.get(i);
  if (!m) {
    const a = VERKKO.kaaret[i][4];
    let x = 0, y = 0;
    m = [];
    for (let j = 0; j < a.length; j += 2) { x += a[j]; y += a[j + 1]; m.push([x, y]); }
    verkko.muodot.set(i, m);
  }
  return m;
}
function solmunPiste(v) {
  const i = verkko.vierus[v][0], m = kaarenMuoto(i);
  return VERKKO.kaaret[i][0] === v ? m[0] : m[m.length - 1];
}
function kokonaisPiste(p) {
  return [Math.round((p[1] - KARTTA.origo[1]) * KARTTA.q), Math.round((p[0] - KARTTA.origo[0]) * KARTTA.q)];
}
function koodaa(pts) {
  const ulos = [];
  let px = 0, py = 0;
  for (const [x, y] of pts) { ulos.push(x - px, y - py); px = x; py = y; }
  return ulos;
}
// Lyhimmät polut yhdestä solmusta kaikkiin (Dijkstra). Painot kuten tools/build_map.py:ssä:
// portaat 1,6 ja huoltotiet 1,3 kertaa pituus; portaita vältettäessä portaat vielä 8-kertaisesti.
function lyhimmat(alku, valtaPortaat) {
  const kerroin = [1, valtaPortaat ? 1.6 * 8 : 1.6, 1.3];
  const n = VERKKO.solmuja, hinta = new Float64Array(n).fill(Infinity), edel = new Int32Array(n).fill(-1);
  const keko = [];
  const lisaa = (h, v) => {
    keko.push([h, v]);
    for (let i = keko.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (keko[p][0] <= keko[i][0]) break;
      [keko[p], keko[i]] = [keko[i], keko[p]]; i = p;
    }
  };
  const ota = () => {
    const ylin = keko[0], viim = keko.pop();
    if (keko.length) {
      keko[0] = viim;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < keko.length && keko[l][0] < keko[m][0]) m = l;
        if (r < keko.length && keko[r][0] < keko[m][0]) m = r;
        if (m === i) break;
        [keko[m], keko[i]] = [keko[i], keko[m]]; i = m;
      }
    }
    return ylin;
  };
  hinta[alku] = 0; lisaa(0, alku);
  while (keko.length) {
    const [h, u] = ota();
    if (h > hinta[u]) continue;
    for (const i of verkko.vierus[u]) {
      const e = VERKKO.kaaret[i], v = e[0] === u ? e[1] : e[0], nh = h + e[2] * kerroin[e[3]];
      if (nh < hinta[v]) { hinta[v] = nh; edel[v] = i; lisaa(nh, v); }
    }
  }
  return { hinta, edel };
}
// Kohteiden järjestys: C on hintamatriisi, jossa 0 = alku, 1..n = kohteet ja n+1 = loppu.
// Enintään 12 kohdetta käydään läpi tarkasti (Held–Karp), muuten lähin naapuri + 2-opt.
function jarjesta(n, C) {
  if (n <= 1) return n ? [1] : [];
  if (n <= 12) {
    const T = 1 << n, dp = new Float64Array(T * n).fill(Infinity), ed = new Int8Array(T * n).fill(-1);
    for (let j = 0; j < n; j++) dp[(1 << j) * n + j] = C[0][j + 1];
    for (let mask = 1; mask < T; mask++) {
      for (let j = 0; j < n; j++) {
        const h = dp[mask * n + j];
        if (!(mask & (1 << j)) || h === Infinity) continue;
        for (let k = 0; k < n; k++) {
          if (mask & (1 << k)) continue;
          const i2 = (mask | (1 << k)) * n + k, nh = h + C[j + 1][k + 1];
          if (nh < dp[i2]) { dp[i2] = nh; ed[i2] = j; }
        }
      }
    }
    let paras = Infinity, j = -1, mask = T - 1;
    for (let k = 0; k < n; k++) {
      const h = dp[mask * n + k] + C[k + 1][n + 1];
      if (h < paras) { paras = h; j = k; }
    }
    const jarj = [];
    while (j >= 0) { jarj.push(j + 1); const p = ed[mask * n + j]; mask &= ~(1 << j); j = p; }
    return jarj.reverse();
  }
  const jaljella = new Set(Array.from({ length: n }, (_, i) => i + 1)), polku = [0];
  while (jaljella.size) {
    const u = polku[polku.length - 1];
    let paras = null;
    for (const v of jaljella) if (paras === null || C[u][v] < C[u][paras]) paras = v;
    polku.push(paras); jaljella.delete(paras);
  }
  polku.push(n + 1);
  for (let parani = true; parani;) {
    parani = false;
    for (let i = 1; i < polku.length - 2; i++) {
      for (let k = i + 1; k < polku.length - 1; k++) {
        const a = polku[i - 1], b = polku[i], c = polku[k], d = polku[k + 1];
        if (C[a][c] + C[b][d] < C[a][b] + C[c][d] - 1e-6) {
          polku.splice(i, k - i + 1, ...polku.slice(i, k + 1).reverse());
          parani = true;
        }
      }
    }
  }
  return polku.slice(1, -1);
}
// Kävelyosuus kohteesta a kohteeseen b: muoto kartalle ja pituus metreinä.
function osuus(a, b, haut) {
  const K = VERKKO.kohteet, va = K[a][0], vb = K[b][0], { edel } = haut.get(va);
  const ketju = [];
  for (let v = vb; v !== va;) {
    const i = edel[v];
    if (i < 0) break;
    ketju.push(i);
    const e = VERKKO.kaaret[i];
    v = e[0] === v ? e[1] : e[0];
  }
  ketju.reverse();
  const pts = [kokonaisPiste(kohdeById[a].sijainti)];
  let m = (K[a][1] + K[b][1]) / 10, v = va;
  if (!ketju.length) pts.push(solmunPiste(va));
  for (const i of ketju) {
    const e = VERKKO.kaaret[i];
    let muoto = kaarenMuoto(i);
    if (e[0] !== v) muoto = muoto.slice().reverse();
    pts.push(...(pts.length > 1 ? muoto.slice(1) : muoto));
    m += e[2] / 10;
    v = e[0] === v ? e[1] : e[0];
  }
  pts.push(kokonaisPiste(kohdeById[b].sijainti));
  return { g: koodaa(pts), m };
}
// Palauttaa reitin samassa muodossa kuin data/reitit.js:n reitit, tai null jos kohteita ei ole.
function laskeOmaReitti(a) {
  if (!alustaVerkko()) return null;
  const K = VERKKO.kohteet;
  const alku = K[a.alku] ? a.alku : 'porta-marina', loppu = K[a.loppu] ? a.loppu : alku;
  const valitut = [...new Set(a.valitut)].filter(id => kohdeById[id] && K[id] && id !== alku && id !== loppu);
  if (!valitut.length) return null;
  const pisteet = [alku, ...valitut, loppu], haut = new Map();
  for (const id of pisteet) { const v = K[id][0]; if (!haut.has(v)) haut.set(v, lyhimmat(v, a.portaat)); }
  const C = pisteet.map(p => pisteet.map(q => haut.get(K[p][0]).hinta[K[q][0]] + K[p][1] + K[q][1]));
  const pysakit = [alku, ...jarjesta(valitut.length, C).map(i => pisteet[i]), loppu];
  const osuudet = [];
  let metrit = 0;
  for (let i = 0; i + 1 < pysakit.length; i++) {
    const o = osuus(pysakit[i], pysakit[i + 1], haut);
    osuudet.push({ g: o.g, m: Math.round(o.m) });
    metrit += o.m;
  }
  return {
    id: 'oma', nimi: 'Oma reitti', pysakit, osuudet, metrit: Math.round(metrit),
    kavely_min: metrit / 1000 / 2.8 * 60,   // rauhallinen tahti, kuten valmiissa reiteissä
    kohde_min: [...new Set(pysakit)].reduce((s, id) => s + (kohdeById[id].kesto || 5), 0),
  };
}
function paivitaOmaReitti() {
  const r = omaAsetukset.valitut.length ? laskeOmaReitti(omaAsetukset) : null;
  if (r) reittiById.oma = r; else delete reittiById.oma;
  if (aktiivinenReitti?.id === 'oma') {
    if (r) aktiivinenReitti.i = Math.min(aktiivinenReitti.i, r.pysakit.length - 1);
    else aktiivinenReitti = null;
    S.set('reitti', aktiivinenReitti);
  }
  return r;
}
function muutaOmaa(muutos) {
  Object.assign(omaAsetukset, muutos);
  S.set('omaReitti', omaAsetukset);
  paivitaOmaReitti();
  piirraReittiKartalle();
}
function asetaOmaan(id, mukana) {
  const v = new Set(omaAsetukset.valitut);
  if (mukana) v.add(id); else v.delete(id);
  muutaOmaa({ valitut: [...v] });
}
// Kesto 5 minuutin tarkkuudella (valmiiden reittien kesto() pyöristää varttiin).
function viisi(min) { return Math.max(5, Math.round(min / 5) * 5); }
function kestoTarkka(min) {
  const m = viisi(min);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;
}
// Yhteisaika pyöristettyjen osien summana, jotta näytetty kävely + kohteet = yhteensä.
function omaYhteensa(r) { return viisi(r.kavely_min) + viisi(r.kohde_min); }
// Aika Pompeijissa matkaohjeen aikalaskurin mukaan (minuutteina), tai null jos laskuri on tyhjä.
function aikaaPompeijissa() {
  const maihin = minuutit(S.get('matkaMaihin', '')), aboard = minuutit(S.get('matkaAboard', ''));
  return maihin === null || aboard === null ? null : (aboard - MATKA_VARA) - (maihin + MATKA_PERILLE);
}
function omaNappi(id) {
  if (!VERKKO?.kohteet[id] || SISAANKAYNNIT.some(([s]) => s === id)) return '';
  const mukana = omaAsetukset.valitut.includes(id);
  return `<button class="nappi${mukana ? ' oma-paalla' : ''}" data-oma-vaihda="${id}">${mukana ? '✓ Omassa reitissä' : '+ Omaan reittiin'}</button>`;
}
function omaKortti() {
  if (!VERKKO) return '';
  const r = reittiById.oma;
  if (!r) {
    return `<div class="kortti reitti oma-reitti"><h2>Oma reitti</h2>
      <p>Valitse itse kohteet, niin opas järjestää ne lyhimmäksi kävelyreitiksi ja laskee, kauanko kierros kestää.</p>
      <div class="nappirivi"><a class="nappi ensisijainen" href="#omareitti">Valitse kohteet</a></div></div>`;
  }
  const aktiivinen = aktiivinenReitti?.id === 'oma', yht = omaYhteensa(r), aika = aikaaPompeijissa();
  let aikaHtml;
  if (aika === null) aikaHtml = `<p class="pieni-teksti">Täyttäkää <a href="#matka">matkaohjeen aikalaskuri</a>, niin opas kertoo, mahtuuko reitti aikaanne.</p>`;
  else if (yht <= aika) aikaHtml = `<p class="mahtuu">Mahtuu aikaanne: aikalaskurin mukaan Pompeijissa on aikaa ${kestoTarkka(aika)}, ${
    aika - yht >= 5 ? `joten väljyyttä jää noin ${kestoTarkka(aika - yht)}` : 'mutta väljyyttä ei juuri jää'}.</p>`;
  else aikaHtml = `<p class="varoitus">Reitti kestää noin ${kestoTarkka(yht - aika)} pidempään kuin aikalaskurin mukainen aika Pompeijissa (${kestoTarkka(Math.max(0, aika))}). Poistakaa kohteita tai valitkaa lyhyempiä.</p>`;
  const huvilat = r.pysakit.some(id => id === 'misteri' || id === 'diomede')
    ? '<p class="varoitus">Mysteerien ja Diomedeen huviloille tarvitaan Pompeii+-lippu tai 8 euron lisämaksu (vain kortilla Porta Ercolanolla).</p>' : '';
  const alku = kohdeById[r.pysakit[0]].nimi, loppu = kohdeById[r.pysakit[r.pysakit.length - 1]].nimi;
  return `<div class="kortti reitti oma-reitti${aktiivinen ? ' aktiivinen-reitti' : ''}">
    <h2>Oma reitti</h2>
    <div class="tiedot"><span><b>${kestoTarkka(yht)}</b> yhteensä</span>
      <span>${(r.metrit / 1000).toFixed(1).replace('.', ',')} km</span><span>${r.pysakit.length - 2} kohdetta</span></div>
    <p>Kävelyä noin ${kestoTarkka(r.kavely_min)} ja kohteissa noin ${kestoTarkka(r.kohde_min)}. ${alku === loppu
      ? `Alkaa ja päättyy: ${esc(alku)}.` : `Alkaa: ${esc(alku)}, päättyy: ${esc(loppu)}.`}${omaAsetukset.portaat ? ' Portaita vältetään.' : ''}</p>
    ${aikaHtml}${huvilat}
    <div class="nappirivi">
      ${aktiivinen
        ? `<a class="nappi ensisijainen" href="#kartta">Jatka reittiä (kohde ${aktiivinenReitti.i + 1})</a><button class="nappi" data-reitti-lopeta>Lopeta</button>`
        : `<button class="nappi ensisijainen" data-reitti-aloita="oma">Aloita reitti</button>`}
      <a class="nappi" href="#omareitti">Muokkaa</a>
    </div>
    <details><summary>Kohteet järjestyksessä</summary>${pysakkiLista(r)}</details>
  </div>`;
}
function piirraOmaValinta() {
  const el = $('#nakyma-omareitti');
  if (!VERKKO) { el.innerHTML = '<p class="tyhja">Kävelyverkkoa ei löytynyt.</p>'; return 'Oma reitti'; }
  const a = omaAsetukset, valitut = new Set(a.valitut);
  const valinta = (nimi, arvo) => `<select id="oma-${nimi}" data-oma="${nimi}">${SISAANKAYNNIT.map(([id, t]) =>
    `<option value="${id}"${id === arvo ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  const rivi = k => {
    const kat = KATEGORIAT[k.kategoria] || KATEGORIAT.julkinen, t = TILAT[k.tila];
    const huom = k.tila === 'suljettu' || k.tila === 'ulkoa' ? ` · ${esc(t.nimi)}` : '';
    return `<label class="rivi valintarivi"><input type="checkbox" data-oma-kohde="${k.id}"${valitut.has(k.id) ? ' checked' : ''}>
      <span class="pallo" style="--v:${kat.vari}"></span>
      <span class="runko"><span class="nimi">${esc(k.nimi)}</span><span class="lisa">kohteessa noin ${k.kesto || 5} min${huom}</span></span></label>`;
  };
  const valittavat = KOHTEET.filter(k => VERKKO.kohteet[k.id] && !SISAANKAYNNIT.some(([id]) => id === k.id));
  let lista = '';
  for (const alue of [...ALUEJARJESTYS, null]) {
    const osa = valittavat.filter(k => alue === null ? !ALUEJARJESTYS.includes(k.alue) : k.alue === alue);
    if (osa.length) lista += `<div class="ryhma">${esc(alue || 'Muut')}</div>` + osa.map(rivi).join('');
  }
  el.innerHTML = `<article class="omavalinta">
    <p>Valitkaa kohteet, jotka haluatte nähdä. Opas järjestää ne lyhimmäksi kävelyreitiksi ja laskee, kauanko kierros kestää: kävely rauhallisella vauhdilla ja tavallinen pysähtyminen kohteissa.</p>
    <div class="kortti">
      <div class="asetus"><label for="oma-alku">Kierros alkaa</label>${valinta('alku', a.alku)}</div>
      <div class="asetus"><label for="oma-loppu">Kierros päättyy</label>${valinta('loppu', a.loppu)}</div>
      <label class="kytkin"><input type="checkbox" data-oma="portaat"${a.portaat ? ' checked' : ''}> Vältä portaita</label>
    </div>
    ${lista}
    <p style="margin-top:16px"><button class="nappi" data-oma-tyhjenna>Tyhjennä valinnat</button></p>
  </article>
  <div id="omapalkki" class="omapalkki"></div>`;
  paivitaOmaPalkki();
  return 'Oma reitti';
}
function paivitaOmaPalkki() {
  const el = $('#omapalkki');
  if (!el) return;
  const r = reittiById.oma;
  if (!r) {
    el.classList.remove('yli');
    el.innerHTML = `<span class="runko"><b>Ei vielä kohteita</b><small>Valitkaa kohteet listasta</small></span><a class="nappi" href="#reitit">Takaisin</a>`;
    return;
  }
  const yht = omaYhteensa(r), aika = aikaaPompeijissa();
  el.classList.toggle('yli', aika !== null && yht > aika);
  el.innerHTML = `<span class="runko"><b>${kestoTarkka(yht)} · ${r.pysakit.length - 2} kohdetta</b>
    <small>kävely ${kestoTarkka(r.kavely_min)} + kohteet ${kestoTarkka(r.kohde_min)}${aika !== null ? ` · aikaa ${kestoTarkka(Math.max(0, aika))}` : ''}</small></span>
    <a class="nappi ensisijainen" href="#reitit">Valmis</a>`;
}

// ------------------------------------------------------------- tietoa ja artikkelit
let asennusKehote = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); asennusKehote = e; if (nykyinen === 'tietoa') piirraTietoa(); });
const asennettu = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function piirraTietoa() {
  const el = $('#nakyma-tietoa');
  const kappaleet = arr => (arr || []).map(p => Array.isArray(p)
    ? `<ul>${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(p)}</p>`).join('');
  el.innerHTML = `<div class="tietoa">
    <div id="offline-tila" class="kortti offline odota">⏳ Tarkistetaan, onko opas tallennettu puhelimeen…</div>
    ${matkaLinkki()}
    ${asennettu() ? '' : `<div class="kortti"><b>Asenna opas puhelimeen</b>
      <p class="pieni-teksti" style="margin:4px 0 8px">Asennettuna opas aukeaa omasta kuvakkeestaan kuin tavallinen sovellus ja toimii ilman nettiä.</p>
      ${asennusKehote ? '<button class="nappi ensisijainen" data-asenna>Asenna aloitusnäytölle</button>'
        : '<p class="pieni-teksti" style="margin:0">Chromessa: valikko ⋮ → <b>Lisää aloitusnäytölle</b> tai <b>Asenna sovellus</b>.</p>'}</div>`}

    <h2 id="aaniopastus">Ääniopastus</h2>
    <div id="aanet-kortti" class="kortti"></div>
    <div class="kortti">
      <div class="asetus" style="margin:0"><label for="nopeus">Puhenopeus</label>
        <input id="nopeus" type="range" min="0.7" max="1.3" step="0.05" value="${S.get('nopeus', 1)}"></div>
    </div>

    <h2>Ennen matkaa</h2>
    <div class="kortti"><ol>${(TIETOA.ennen || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>

    <h2>Käytännön tiedot</h2>
    ${TIETOA.kaytanto.map(o => `<details><summary>${esc(o.otsikko)}</summary><div>${kappaleet(o.teksti)}</div></details>`).join('')}
    ${TIETOA.tarkistettu ? `<p class="pieni-teksti">${esc(TIETOA.tarkistettu)}</p>` : ''}
    <p><a class="nappi" href="https://pompeiisites.org/en/houses/" target="_blank" rel="noopener">Päivän aukiolevat talot (vaatii netin)</a></p>

    <h2>Taustaa</h2>
    ${TIETOA.taustaa.map(a => `<a class="rivi" href="#artikkeli/${a.id}"><span class="runko">
      <span class="nimi">${esc(a.otsikko)}</span><span class="lisa">${esc(a.lyhyt)}</span></span><span class="oikea">›</span></a>`).join('')}

    <h2 id="asetukset">Puhelimen oma puheääni (varalla)</h2>
    <div class="kortti">
      <p class="pieni-teksti" style="margin-top:0">Opas käyttää puhelimen omaa puheääntä vain, jos ääniopastusta ei ole ladattu eikä nettiä ole – tai jos otat valmiit äänitiedostot pois käytöstä alla.</p>
      <div id="aani-asetus"></div>
      <button class="nappi" data-kokeile-aani>Kokeile puhelimen ääntä</button>
      <details style="margin-top:12px;border:0;background:none"><summary style="padding:6px 0">Näin lataat suomen puheäänen</summary><div style="padding:0">
        <ol>
          <li>Avaa puhelimen <b>Asetukset</b> ja kirjoita hakuun <b>tekstistä puheeksi</b> (tai <i>text-to-speech</i>).</li>
          <li>Valitse ensisijaiseksi moottoriksi <b>Googlen puhepalvelut</b> (Speech Services by Google).</li>
          <li>Paina moottorin vieressä olevaa ratasta → <b>Asenna äänidata</b> → <b>suomi</b> ja lataa se.</li>
          <li>Palaa tänne ja paina <b>Kokeile puhelimen ääntä</b>.</li>
        </ol>
        <p class="pieni-teksti">Valikkojen nimet vaihtelevat hieman puhelinmallin mukaan (esim. Samsungissa Yleinen hallinta → Kieli → Tekstistä puheeksi).</p>
      </div></details>
    </div>

    <h2>Asetukset</h2>
    <div class="kortti">
      <label class="kytkin"><input type="checkbox" id="aaniopas" ${S.get('aaniopas', true) ? 'checked' : ''}> Käytä valmiita äänitiedostoja</label>
      <p class="pieni-teksti">Pois päältä opas lukee tekstit puhelimen omalla puheäänellä.</p>
      <label class="kytkin"><input type="checkbox" id="valveilla" ${S.get('valveilla', false) ? 'checked' : ''}> Pidä näyttö päällä, kun opas on auki</label>
      <p class="pieni-teksti">Helpottaa kartan seuraamista, mutta kuluttaa akkua.</p>
      <button class="nappi" data-nollaa-nahty>Nollaa nähdyt kohteet</button>
    </div>

    <h2>Tietoa oppaasta</h2>
    <div class="kortti pieni-teksti">${kappaleet(TIETOA.tekijat)}
      <p>${esc(KARTTA.lahde)}. Karttakirjasto Leaflet (BSD-lisenssi).</p>
      <p>Versio ${VERSIO}</p></div>
  </div>`;
  paivitaAaniasetus();
  paivitaAanetKortti();
  tarkistaOffline();
}
function paivitaAaniasetus() {
  const el = $('#aani-asetus'); if (!el) return;
  if (!Puhe.tuettu) { el.innerHTML = '<p class="varoitus">Tämä selain ei tue ääneen lukua.</p>'; return; }
  const fi = Puhe.suomi(), valittu = Puhe.aani();
  el.innerHTML = fi.length
    ? `<div class="asetus"><label for="aani">Puheääni</label><select id="aani">${fi.map(v =>
        `<option value="${esc(v.name)}"${valittu && v.name === valittu.name ? ' selected' : ''}>${esc(v.name)}${v.localService ? '' : ' (vaatii netin)'}</option>`).join('')}</select></div>`
    : `<p class="varoitus">Puhelimesta ei löytynyt suomenkielistä puheääntä. Lataa se alla olevan ohjeen mukaan – muuten teksti luetaan vieraalla kielellä tai ei ollenkaan.</p>`;
}
async function tarkistaOffline() {
  const el = $('#offline-tila'); if (!el) return;
  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    el.className = 'kortti offline odota'; el.textContent = 'Tämä selain ei pysty tallentamaan opasta ilman nettiä käytettäväksi.'; return;
  }
  try {
    // caches.has ensin: caches.open loisi tyhjän välimuistin, jota service worker ei enää siivoaisi
    const nimi = 'pompeiji-' + VERSIO;
    const c = await caches.has(nimi) ? await caches.open(nimi) : null;
    const ok = c && await c.match('data/kartta.js') && await c.match('app.js') && await c.match('data/kohteet-3.js');
    el.className = 'kortti offline ' + (ok ? 'ok' : 'odota');
    el.textContent = ok ? '✓ Opas on tallennettu puhelimeen ja toimii myös ilman nettiä.'
      : '⏳ Opasta tallennetaan puhelimeen… Pidä netti päällä, kunnes tähän tulee vihreä merkki.';
    if (!ok) setTimeout(tarkistaOffline, 2500);
  } catch { el.textContent = 'Tallennuksen tilaa ei voitu tarkistaa.'; }
}
// ------------------------------------------------------------- matkaohje satamasta Pompeijiin
const MATKA = window.MATKA || null;
const matkaLinkki = () => (MATKA ? `<a class="kortti matkalinkki" href="#matka"><span class="matka-ikoni">🚆</span>
  <span class="runko"><b>${esc(MATKA.otsikko)}</b><span class="pieni-teksti">Tarkka ohje vaihe vaiheelta: metro, juna, paluu laivalle ja valmiit lauseet italiaksi</span></span>
  <span class="oikea">›</span></a>` : '');
// Kellonaika vapaasti kirjoitettuna: 8.30, 8:30, 8,30, 830, 0830, 17 tai 17.3 (= 17.30)
const minuutit = s => {
  const t = String(s || '').trim().replace(/\s/g, '');
  let m = /^(\d{1,2})[.:,](\d{1,2})$/.exec(t) || /^(\d{1,2})(\d{2})$/.exec(t);
  if (!m && /^\d{1,2}$/.test(t)) m = [t, t, '0'];
  if (!m) return null;
  const h = +m[1], min = m[2].length === 1 ? +m[2] * 10 : +m[2];
  return h < 24 && min < 60 ? h * 60 + min : null;
};
// Aikalaskurin oletukset: satamasta portille 90 min ja paluulle 3 h väljyyttä ennen all aboardia.
const MATKA_PERILLE = 90, MATKA_VARA = 180;
const kello = min => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${Math.floor(m / 60)}.${String(m % 60).padStart(2, '0')}`; };
function laskeMatka() {
  const el = $('#matka-tulos'); if (!el) return;
  const syote = [$('#matka-maihin').value.trim(), $('#matka-aboard').value.trim()];
  const maihin = minuutit(syote[0]), aboard = minuutit(syote[1]);
  if (maihin === null || aboard === null) {
    const virhe = syote.some((s, i) => s && minuutit(s) === null);
    el.innerHTML = `<p class="pieni-teksti" style="margin:8px 0 0">${virhe
      ? 'Kirjoita aika muodossa 8.30 tai 17.30.'
      : 'Kirjoita laivan päiväohjelmasta maihinnousun ja all aboard -ajan kellonajat, niin laskuri kertoo aikataulun.'}</p>`;
    return;
  }
  const perilla = maihin + MATKA_PERILLE;   // terminaali → metro → vaihto → juna (+ odotukset)
  const viimeistaan = aboard - MATKA_VARA;  // 3 h väljyys: matka n. 1,5 h + varaa myöhästymisille
  const aika = viimeistaan - perilla;
  const huom = [];
  if (aika < 120) huom.push('Aikaa jää alle kaksi tuntia. Juna ei silloin oikein kannata – harkitkaa laivan omaa retkeä tai taksia.');
  if (perilla > 15 * 60 + 30) huom.push('Talviaikaan (15.10.–15.3.) Pompeijin viimeinen sisäänpääsy on klo 15.30.');
  if (viimeistaan > 17 * 60) huom.push('Talvella alue sulkeutuu jo klo 17.00 (kesällä 19.00), joten silloin on lähdettävä viimeistään.');
  el.innerHTML = `<table class="aikataulu">
      <tr><td>Lähtekää satamasta</td><td>klo ${kello(maihin + 15)}</td></tr>
      <tr><td>Perillä Pompeijissa noin</td><td>klo ${kello(perilla)}</td></tr>
      <tr class="tarkea"><td>Lähtekää Pompeijista asemalle viimeistään</td><td>klo ${kello(viimeistaan)}</td></tr>
      <tr><td>Aikaa Pompeijissa</td><td>${aika > 0 ? kesto(aika) : '–'}</td></tr>
    </table>
    <p class="pieni-teksti" style="margin:6px 0 0">Asettakaa puhelimeen herätys lähtöajalle klo ${kello(viimeistaan)}.${
      aika > 0 && VERKKO ? ' Reitit-sivulla voitte koota <a href="#omareitti">oman reitin</a>, joka mahtuu tähän aikaan.' : ''}</p>
    ${huom.map(h => `<p class="varoitus" style="margin:8px 0 0">${esc(h)}</p>`).join('')}`;
}
function piirraMatka() {
  const el = $('#nakyma-matka');
  if (!MATKA) { el.innerHTML = '<p class="tyhja">Matkaohjetta ei löytynyt.</p>'; return 'Matkaohje'; }
  const tehty = new Set(S.get('matkaTehty', []));
  const vaiheet = (lista, osa) => lista.map((v, i) => {
    const avain = `${osa}${i}`, ok = tehty.has(avain);
    return `<div class="vaihe${ok ? ' tehty' : ''}" data-vaihe="${avain}" role="button" tabindex="0" aria-pressed="${ok}">
      <span class="vaihe-nro" data-nro="${i + 1}">${ok ? '✓' : i + 1}</span>
      <div class="vaihe-runko"><h3>${esc(v.otsikko)}</h3>
        ${v.teksti.map(p => `<p>${esc(p)}</p>`).join('')}
        ${v.tunnista ? `<p class="tunnista"><b>Etsi:</b> ${esc(v.tunnista)}</p>` : ''}
        ${v.varo ? `<p class="varo"><b>Huom!</b> ${esc(v.varo)}</p>` : ''}
      </div></div>`;
  }).join('');
  const aaniIkoni = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/></svg>';
  el.innerHTML = `<article class="matka">
    <h1>${esc(MATKA.otsikko)}</h1>
    ${MATKA.johdanto.map(p => `<p>${esc(p)}</p>`).join('')}
    <div class="kortti laskuri"><b>Aikalaskuri</b>
      <div class="laskuri-rivi">
        <label>Maihinnousu alkaa klo
          <input type="text" inputmode="decimal" autocomplete="off" id="matka-maihin" placeholder="esim. 8.00" value="${esc(S.get('matkaMaihin', ''))}"></label>
        <label>All aboard klo (laivalla viimeistään)
          <input type="text" inputmode="decimal" autocomplete="off" id="matka-aboard" placeholder="esim. 17.30" value="${esc(S.get('matkaAboard', ''))}"></label>
      </div>
      <div id="matka-tulos"></div>
    </div>
    <h2>Menomatka</h2>
    <p class="pieni-teksti">Napauta vaihetta, kun se on tehty.</p>
    ${vaiheet(MATKA.menomatka, 'm')}
    <h2>Paluu laivalle</h2>
    ${vaiheet(MATKA.paluu, 'p')}
    <button class="nappi" data-matka-nollaa>Tyhjennä tehdyt-merkinnät</button>
    <h2>Jos jokin menee pieleen</h2>
    ${MATKA.pieleen.map(x => `<div class="kortti"><b>${esc(x.otsikko)}</b><p style="margin:4px 0 0">${esc(x.teksti)}</p></div>`).join('')}
    ${MATKA.sovellukset?.length ? `<h2 id="sovellukset">Aikataulut ja sovellukset</h2>
    <p class="pieni-teksti">Linkit vaativat netin.</p>
    ${MATKA.sovellukset.map(x => `<div class="kortti"><b>${esc(x.otsikko)}</b><p style="margin:4px 0 0">${esc(x.teksti)}</p>${
      (x.linkit || []).map(l => `<p style="margin:8px 0 0"><a class="nappi" href="${esc(l.osoite)}" target="_blank" rel="noopener">${esc(l.teksti)}</a></p>`).join('')}</div>`).join('')}` : ''}
    <h2 id="lauseet">Näytä italiaksi</h2>
    <p class="pieni-teksti">Napauta lausetta, niin se näkyy koko näytöllä isolla tekstillä – näyttäkää puhelin asemahenkilökunnalle tai taksikuskille.${
      AANET && MATKA.lauseet.some((l, i) => AANET.tiedostot['lause-' + i]) ? ' Kaiutinpainikkeesta lause luetaan ääneen italiaksi.' : ''}</p>
    <div class="lauseet">${MATKA.lauseet.map((l, i) => `<div class="lause">
      <button class="lause-teksti" data-lause="${i}"><span class="it">${esc(l.it)}</span><span class="fi">${esc(l.fi)}</span></button>
      ${AANET?.tiedostot['lause-' + i] ? `<button class="ikoninappi lause-aani" data-kuuntele="lause-${i}" aria-label="Kuuntele italiaksi">${aaniIkoni}<span hidden>Kuuntele</span></button>` : ''}
    </div>`).join('')}</div>
    <p class="pieni-teksti" style="margin-top:16px">${esc(MATKA.tarkistettu)}</p>
  </article>`;
  laskeMatka();
  paivitaPuhepalkki();
  return 'Satamasta Pompeijiin';
}
function naytaLause(i) {
  const l = MATKA.lauseet[i];
  const el = $('#lause-iso');
  el.querySelector('.it').textContent = l.it;
  el.querySelector('.fi').textContent = l.fi;
  el.hidden = false;
}
$('#lause-iso').addEventListener('click', () => { $('#lause-iso').hidden = true; });

function piirraArtikkeli(id) {
  const a = TIETOA.taustaa.find(x => x.id === id);
  const el = $('#nakyma-artikkeli');
  if (!a) { el.innerHTML = '<p class="tyhja">Artikkelia ei löytynyt.</p>'; return 'Taustaa'; }
  el.innerHTML = `<article class="artikkeli"><h1>${esc(a.otsikko)}</h1>
    <div class="nappirivi">${kuunteleNappi('a-' + a.id)}</div>
    ${a.teksti.map(p => `<p>${esc(p)}</p>`).join('')}</article>`;
  paivitaPuhepalkki();
  return a.otsikko;
}

// ------------------------------------------------------------- näyttö päällä
let wakeLock = null;
async function pyydaValveilla() {
  if (!S.get('valveilla', false) || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { /* ei sallittu */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pyydaValveilla(); });

// ------------------------------------------------------------- yhteiset klikkaukset
document.addEventListener('click', e => {
  const t = e.target.closest('[data-kuuntele],[data-kartalle],[data-nahty],[data-reitti-aloita],[data-reitti-lopeta],[data-paikka],[data-asenna],[data-kokeile-aani],[data-nollaa-nahty],[data-lataa-aanet],[data-vaihe],[data-lause],[data-matka-nollaa],[data-oma-vaihda],[data-oma-tyhjenna]');
  if (!t) return;
  const d = t.dataset;
  if (d.kuuntele) kuuntele(d.kuuntele);
  else if (d.kartalle) { tarkennaKohteeseen = { id: d.kartalle }; location.hash = '#kartta'; }
  else if (d.nahty) {
    nahty.has(d.nahty) ? nahty.delete(d.nahty) : nahty.add(d.nahty);
    S.set('nahty', [...nahty]); listaLikainen = true; paivitaMerkit();
    t.classList.toggle('paalla', nahty.has(d.nahty));
    t.textContent = nahty.has(d.nahty) ? '✓ Nähty' : 'Merkitse nähdyksi';
  }
  else if (d.reittiAloita) aloitaReitti(d.reittiAloita);
  else if ('reittiLopeta' in d) lopetaReitti();
  else if (d.paikka) { tarkennaKohteeseen = { paikka: paikat[+d.paikka] }; location.hash = '#kartta'; }
  else if ('asenna' in d && asennusKehote) { asennusKehote.prompt(); asennusKehote.userChoice.finally(() => { asennusKehote = null; piirraTietoa(); }); }
  else if ('kokeileAani' in d) { Aani.lopeta(true); Puhe.puhu('kokeilu', 'Puhelimen puheääni', ['Tervetuloa Pompeijiin! Näin puhelimen oma puheääni lukee tekstit.']); }
  else if ('nollaaNahty' in d) { nahty = new Set(); S.set('nahty', []); listaLikainen = true; paivitaMerkit(); ilmoita('Nähdyt kohteet nollattu'); }
  else if ('lataaAanet' in d) { aanetEdistys = 'Aloitetaan latausta…'; lataaAanet(); paivitaAanetKortti(); }
  else if (d.vaihe) {
    const tehty = new Set(S.get('matkaTehty', []));
    tehty.has(d.vaihe) ? tehty.delete(d.vaihe) : tehty.add(d.vaihe);
    S.set('matkaTehty', [...tehty]);
    const ok = tehty.has(d.vaihe), nro = t.querySelector('.vaihe-nro');
    t.classList.toggle('tehty', ok);
    t.setAttribute('aria-pressed', String(ok));
    nro.textContent = ok ? '✓' : nro.dataset.nro;
  }
  else if (d.lause) naytaLause(+d.lause);
  else if ('matkaNollaa' in d) { S.set('matkaTehty', []); piirraMatka(); }
  else if (d.omaVaihda) {
    const mukana = !omaAsetukset.valitut.includes(d.omaVaihda);
    asetaOmaan(d.omaVaihda, mukana);
    t.outerHTML = omaNappi(d.omaVaihda);
    const r = reittiById.oma;
    ilmoita(mukana ? `Lisätty omaan reittiin: ${r.pysakit.length - 2} kohdetta, ${kestoTarkka(omaYhteensa(r))}`
      : 'Poistettu omasta reitistä');
  }
  else if ('omaTyhjenna' in d) { muutaOmaa({ valitut: [] }); piirraOmaValinta(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'matka-maihin' || e.target.id === 'matka-aboard') {
    S.set(e.target.id === 'matka-maihin' ? 'matkaMaihin' : 'matkaAboard', e.target.value);
    laskeMatka();
  }
});
document.addEventListener('change', e => {
  const o = e.target.dataset;
  if (o.omaKohde) { asetaOmaan(o.omaKohde, e.target.checked); paivitaOmaPalkki(); }
  if (o.oma) { muutaOmaa({ [o.oma]: o.oma === 'portaat' ? e.target.checked : e.target.value }); paivitaOmaPalkki(); }
  if (e.target.id === 'aani') S.set('aani', e.target.value);
  if (e.target.id === 'nopeus') { S.set('nopeus', +e.target.value); Aani.el.playbackRate = +e.target.value; }
  if (e.target.id === 'aaniopas') S.set('aaniopas', e.target.checked);
  if (e.target.id === 'valveilla') {
    S.set('valveilla', e.target.checked);
    if (e.target.checked) pyydaValveilla(); else if (wakeLock) { wakeLock.release(); wakeLock = null; }
  }
});
$('#puhe-tauko').addEventListener('click', () => {
  const t = aktiivinenToisto();
  if (t) { t.tauolla ? t.jatka() : t.tauko(); paivitaPuhepalkki(); }
});
$('#puhe-taakse').addEventListener('click', () => Aani.siirra(-10));
$('#puhe-lopeta').addEventListener('click', () => { Aani.lopeta(true); Puhe.lopeta(); });

// ------------------------------------------------------------- käynnistys
// Offline-tallennus. Omalla koneella (localhost) vain osoitteella ?sw, jotta muokkaukset näkyvät heti.
const kehitys = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]sw\b/.test(location.search);
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  if (kehitys) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  else {
    // Kun uusi versio on haettu, sivu ladataan heti uudelleen (ei toisella avauskerralla).
    // Ei kesken toiston eikä ensiasennuksessa (silloin ohjaajaa ei vielä ollut).
    const oliOhjaaja = !!navigator.serviceWorker.controller;
    let paivitetty = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!oliOhjaaja || paivitetty) return;
      paivitetty = true;
      if (aktiivinenToisto()) ilmoita('Oppaasta on uusi versio – se otetaan käyttöön, kun avaat oppaan seuraavan kerran.', 5000);
      else location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => { /* esim. yksityinen tila */ });
  }
}
Puhe.init();
piirraSuodattimet();
window.addEventListener('hashchange', reititys);
reititys();
if (S.get('gps', false)) kaynnistaGps(false);
pyydaValveilla();
})();
