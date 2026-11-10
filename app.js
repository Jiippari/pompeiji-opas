/* Pompeiji-opas — sovelluslogiikka.
 * Ei riippuvuuksia Leafletin lisäksi. Data tulee tiedostoista data/*.js
 * (window.KARTTA, window.KOHTEET, window.REITIT, window.TIETOA).
 * Muista nostaa VERSIO sekä täällä että sw.js:ssä, kun julkaiset muutoksia. */
'use strict';
(() => {
const VERSIO = '2026-11-10.1';

const KARTTA = window.KARTTA;
const KOHTEET = window.KOHTEET || [];
const REITIT = window.REITIT || [];
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
function puheeksi(teksti) {
  let s = String(teksti || '');
  for (const [re, kor] of LYHENTEET) s = s.replace(re, kor);
  return s;
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
  puhu(id, otsikko, kappaleet) {
    if (!this.tuettu) { ilmoita('Tämä selain ei osaa lukea tekstiä ääneen.'); return; }
    this.lopeta(true);
    this.id = id; this.otsikko = otsikko;
    this.jono = pilkoLauseiksi(kappaleet); this.indeksi = 0;
    this.kaynnissa = true; this.tauolla = false;
    if (!this.suomi().length && !S.get('aaniVaroitettu', false)) {
      ilmoita('Puhelimesta ei löytynyt suomenkielistä puheääntä. Ohje: Tietoa → Ääneen luku.', 6000);
      S.set('aaniVaroitettu', true);
    }
    this.seuraava(); paivitaPuhepalkki();
  },
  seuraava() {
    if (!this.kaynnissa || this.tauolla) return;
    if (this.indeksi >= this.jono.length) { this.lopeta(); return; }
    const u = new SpeechSynthesisUtterance(this.jono[this.indeksi]);
    u.lang = 'fi-FI';
    const a = this.aani(); if (a) u.voice = a;
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
const IKONI_TAUKO = '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
const IKONI_TOISTO = '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>';
function paivitaPuhepalkki() {
  const p = $('#puhepalkki');
  p.hidden = !Puhe.kaynnissa;
  document.body.classList.toggle('puhuu', Puhe.kaynnissa);
  $('#puhe-otsikko').textContent = Puhe.otsikko;
  $('#puhe-tauko').innerHTML = Puhe.tauolla ? IKONI_TOISTO : IKONI_TAUKO;
  $('#puhe-tauko').setAttribute('aria-label', Puhe.tauolla ? 'Jatka' : 'Tauko');
  document.querySelectorAll('[data-kuuntele]').forEach(b => {
    const paalla = Puhe.kaynnissa && Puhe.id === b.dataset.kuuntele;
    b.classList.toggle('ensisijainen', paalla);
    b.querySelector('span').textContent = paalla ? 'Lukee…' : 'Kuuntele';
  });
}
function kuuntele(id) {
  if (Puhe.kaynnissa && Puhe.id === id) { Puhe.tauolla ? Puhe.jatka() : Puhe.tauko(); return; }
  const k = kohdeById[id];
  if (k) {
    Puhe.puhu(id, k.nimi, [k.nimi + '.', k.lyhyt, ...(k.teksti || []),
      k.katso?.length ? 'Katso erityisesti: ' + k.katso.join('. ') + '.' : '',
      k.tiesitko ? 'Tiesitkö? ' + k.tiesitko : '']);
    return;
  }
  const a = TIETOA.taustaa.find(x => 'a-' + x.id === id);
  if (a) Puhe.puhu(id, a.otsikko, [a.otsikko + '.', ...(a.teksti || [])]);
}
const kuunteleNappi = id =>
  `<button class="nappi" data-kuuntele="${esc(id)}"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/></svg><span>Kuuntele</span></button>`;

// ------------------------------------------------------------- näkymät ja reititys
const OTSIKOT = { kartta: 'Pompeiji', kohteet: 'Kohteet', reitit: 'Reitit', tietoa: 'Tietoa' };
const VALILEHTI = { kohde: 'kohteet', artikkeli: 'tietoa' };
let nykyinen = null;

function reititys() {
  const [nimi, arg] = (location.hash.slice(1) || 'kartta').split('/');
  nayta(nimi in OTSIKOT || nimi === 'kohde' || nimi === 'artikkeli' ? nimi : 'kartta', arg ? decodeURIComponent(arg) : null);
}
function nayta(nimi, arg) {
  suljeArkki();
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
  $('#otsikko').textContent = otsikko || 'Pompeiji';
  if (nimi === 'kohde' || nimi === 'artikkeli') $('#nakyma-' + nimi).scrollTop = 0;
  nykyinen = nimi;
}
$('#takaisin').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.hash = nykyinen === 'artikkeli' ? '#tietoa' : '#kohteet';
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
  piirraReittiKartalle();
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
  el.innerHTML = `<p class="pieni-teksti">Reitit kulkevat katuja pitkin. Ajat ovat suuntaa antavia: kävely rauhallisella vauhdilla
    epätasaisella kivetyksellä sekä tavallinen pysähtyminen kohteissa. Talvella viimeinen sisäänpääsy on jo klo 15.30.</p>` +
  REITIT.map(r => {
    const aktiivinen = aktiivinenReitti?.id === r.id;
    const pysakit = r.pysakit.map((id, i) => {
      const k = kohdeById[id], kat = KATEGORIAT[k.kategoria] || KATEGORIAT.julkinen;
      const m = i > 0 ? r.osuudet[i - 1].m : null;
      return `<a class="pysakki" href="#kohde/${id}"><span class="numero" style="--v:${kat.vari}">${i + 1}</span>
        <span>${esc(k.nimi)}${nahty.has(id) ? ' <span style="color:var(--ok)">✓</span>' : ''}</span>${m ? `<small>${matka(m)}</small>` : ''}</a>`;
    }).join('');
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
function aloitaReitti(id) {
  aktiivinenReitti = { id, i: 0 };
  S.set('reitti', aktiivinenReitti);
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
    ${asennettu() ? '' : `<div class="kortti"><b>Asenna opas puhelimeen</b>
      <p class="pieni-teksti" style="margin:4px 0 8px">Asennettuna opas aukeaa omasta kuvakkeestaan kuin tavallinen sovellus ja toimii ilman nettiä.</p>
      ${asennusKehote ? '<button class="nappi ensisijainen" data-asenna>Asenna aloitusnäytölle</button>'
        : '<p class="pieni-teksti" style="margin:0">Chromessa: valikko ⋮ → <b>Lisää aloitusnäytölle</b> tai <b>Asenna sovellus</b>.</p>'}</div>`}

    <h2>Ennen matkaa</h2>
    <div class="kortti"><ol>${(TIETOA.ennen || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>

    <h2>Käytännön tiedot</h2>
    ${TIETOA.kaytanto.map(o => `<details><summary>${esc(o.otsikko)}</summary><div>${kappaleet(o.teksti)}</div></details>`).join('')}
    ${TIETOA.tarkistettu ? `<p class="pieni-teksti">${esc(TIETOA.tarkistettu)}</p>` : ''}
    <p><a class="nappi" href="https://pompeiisites.org/en/houses/" target="_blank" rel="noopener">Päivän aukiolevat talot (vaatii netin)</a></p>

    <h2>Taustaa</h2>
    ${TIETOA.taustaa.map(a => `<a class="rivi" href="#artikkeli/${a.id}"><span class="runko">
      <span class="nimi">${esc(a.otsikko)}</span><span class="lisa">${esc(a.lyhyt)}</span></span><span class="oikea">›</span></a>`).join('')}

    <h2 id="asetukset">Ääneen luku</h2>
    <div class="kortti">
      <div id="aani-asetus"></div>
      <div class="asetus"><label for="nopeus">Puhenopeus</label>
        <input id="nopeus" type="range" min="0.7" max="1.3" step="0.05" value="${S.get('nopeus', 1)}"></div>
      <button class="nappi" data-kokeile-aani>Kokeile ääntä</button>
      <details style="margin-top:12px;border:0;background:none"><summary style="padding:6px 0">Näin lataat suomen puheäänen</summary><div style="padding:0">
        <ol>
          <li>Avaa puhelimen <b>Asetukset</b> ja kirjoita hakuun <b>tekstistä puheeksi</b> (tai <i>text-to-speech</i>).</li>
          <li>Valitse ensisijaiseksi moottoriksi <b>Googlen puhepalvelut</b> (Speech Services by Google).</li>
          <li>Paina moottorin vieressä olevaa ratasta → <b>Asenna äänidata</b> → <b>suomi</b> ja lataa se.</li>
          <li>Palaa tänne ja paina <b>Kokeile ääntä</b>. Kokeile myös lentotilassa, niin tiedät, että ääni toimii ilman nettiä.</li>
        </ol>
        <p class="pieni-teksti">Valikkojen nimet vaihtelevat hieman puhelinmallin mukaan (esim. Samsungissa Yleinen hallinta → Kieli → Tekstistä puheeksi).</p>
      </div></details>
    </div>

    <h2>Asetukset</h2>
    <div class="kortti">
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
    const c = await caches.open('pompeiji-' + VERSIO);
    const ok = await c.match('data/kartta.js') && await c.match('app.js') && await c.match('data/kohteet-3.js');
    el.className = 'kortti offline ' + (ok ? 'ok' : 'odota');
    el.textContent = ok ? '✓ Opas on tallennettu puhelimeen ja toimii myös ilman nettiä.'
      : '⏳ Opasta tallennetaan puhelimeen… Pidä netti päällä, kunnes tähän tulee vihreä merkki.';
    if (!ok) setTimeout(tarkistaOffline, 2500);
  } catch { el.textContent = 'Tallennuksen tilaa ei voitu tarkistaa.'; }
}
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
  const t = e.target.closest('[data-kuuntele],[data-kartalle],[data-nahty],[data-reitti-aloita],[data-reitti-lopeta],[data-paikka],[data-asenna],[data-kokeile-aani],[data-nollaa-nahty]');
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
  else if ('kokeileAani' in d) Puhe.puhu('kokeilu', 'Äänen kokeilu', ['Tervetuloa Pompeijiin! Näin opas lukee kohteiden tekstit ääneen.']);
  else if ('nollaaNahty' in d) { nahty = new Set(); S.set('nahty', []); listaLikainen = true; paivitaMerkit(); ilmoita('Nähdyt kohteet nollattu'); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'aani') S.set('aani', e.target.value);
  if (e.target.id === 'nopeus') S.set('nopeus', +e.target.value);
  if (e.target.id === 'valveilla') {
    S.set('valveilla', e.target.checked);
    if (e.target.checked) pyydaValveilla(); else if (wakeLock) { wakeLock.release(); wakeLock = null; }
  }
});
$('#puhe-tauko').addEventListener('click', () => (Puhe.tauolla ? Puhe.jatka() : Puhe.tauko()));
$('#puhe-lopeta').addEventListener('click', () => Puhe.lopeta());

// ------------------------------------------------------------- käynnistys
// Offline-tallennus. Omalla koneella (localhost) vain osoitteella ?sw, jotta muokkaukset näkyvät heti.
const kehitys = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]sw\b/.test(location.search);
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  if (kehitys) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  else navigator.serviceWorker.register('sw.js').catch(() => { /* esim. yksityinen tila */ });
}
Puhe.init();
piirraSuodattimet();
window.addEventListener('hashchange', reititys);
reititys();
if (S.get('gps', false)) kaynnistaGps(false);
pyydaValveilla();
})();
