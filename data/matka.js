// Pompeiji-opas: tarkka matkaohje Napolin risteilysatamasta Pompeijiin junalla ja takaisin.
// Tiedot tarkistettu 11.11.2026 (metro Linja 1, Circumvesuviana Napoli–Sorrento, Tap&Go-lähimaksu
// eavsrl.it:stä, laiturit EAV:n lähtötaulusta, Campania Expressin tauko).
// Vaihe: otsikko, teksti[], tunnista (mitä kylttiä etsiä), varo (yleisin virhe).
// Sovellus: otsikko, teksti, linkit[] (teksti + osoite) – linkit vaativat netin.
// Älä käytä aaltosulkeita kommenteissa: tools/tee_aanet.py etsii tiedostosta ensimmäisen aaltosulkeen.
window.MATKA = {
  "otsikko": "Satamasta Pompeijiin junalla",
  "tarkistettu": "Tiedot tarkistettu 11.11.2026, laiturit junayhtiön lähtötaulusta. Junien ja metron aikataulut, laiturit ja hinnat voivat muuttua – kysykää laivan vastaanotosta vielä matkapäivän aamuna, onko junissa lakkoa (sciopero).",
  "johdanto": [
    "Matka risteilyterminaalista Pompeijin portille kestää noin tunnin: ensin metrolla kolme pysäkkiä Napolin päärautatieasemalle, sitten paikallisjunalla noin 35 minuuttia. Kahdelta hengeltä menopaluu maksaa yhteensä noin 20 euroa.",
    "Lippuja ei tarvitse ostaa etukäteen eikä sovellusta tarvita: sekä metrossa että junassa kumpikin maksaa omalla pankkikortillaan näyttämällä sen porttien kortinlukijaan.",
    "Ohje on kirjoitettu vaihe kerrallaan. Merkitkää vaihe tehdyksi napauttamalla sitä, niin näette, missä kohtaa olette. Sivun lopussa ovat valmiit italiankieliset lauseet, jotka voi näyttää isolla tekstillä asemahenkilökunnalle tai taksikuskille."
  ],
  "menomatka": [
    {
      "otsikko": "Laivalla ennen maihinnousua",
      "teksti": [
        "Ottakaa mukaan: passit (Pompeijin liput ovat nimellisiä), laivakortit, Pompeijin liput puhelimessa, pankkikortti molemmille (lähimaksu), vähän käteistä, ladattu puhelin ja varavirtalähde sekä vesipullo.",
        "Kokeilkaa jo kotona, että kummankin kortin lähimaksu toimii, ja tarkistakaa pankin sovelluksesta, että kortin käyttö ulkomailla on sallittu.",
        "Kirjoittakaa paperille ylös laivan all aboard -aika ja satama-agentin puhelinnumero. Molemmat löytyvät laivan päiväohjelmasta. Täyttäkää myös tämän sivun aikalaskuri."
      ],
      "tunnista": "",
      "varo": "Kysykää vastaanotosta, onko junissa tänään lakkoa (sciopero). Lakkopäivänä junaan ei kannata lähteä – valitkaa laivan oma retki tai taksi."
    },
    {
      "otsikko": "Terminaalista metroasemalle",
      "teksti": [
        "Risteilyterminaalin nimi on Stazione Marittima. Kävelkää terminaalista ulos kaupungin puolelle, isolle aukiolle nimeltä Piazza Municipio. Aukion laidalla on suuri linna, Castel Nuovo. Metroaseman sisäänkäynti on aukiolla, noin 5–10 minuutin kävelyn päässä.",
        "Aseman nimi on Municipio. Se on Napolin metron Linja 1."
      ],
      "tunnista": "Kyltti, jossa on M-kirjain ja teksti Metropolitana, Linea 1, Municipio.",
      "varo": "Satamassa ja aukiolla tarjotaan kyytejä ja retkiä. Niistä voi kieltäytyä kohteliaasti: ”No, grazie”."
    },
    {
      "otsikko": "Metron portit: maksu kortilla",
      "teksti": [
        "Helpoin tapa on lähimaksu. Kumpikin näyttää OMAN pankkikorttinsa portin kortinlukijaan, ja portti aukeaa. Yksi matka maksaa noin 1,50 €. Samalla tavalla maksetaan myöhemmin myös juna.",
        "Toinen tapa on ostaa paperilippu automaatista (valitse kieleksi englanti ja lipuksi Corsa singola eli kertalippu). Paperilippu leimataan porttiin."
      ],
      "tunnista": "Porttien kortinlukija, jossa on lähimaksun aaltomerkki.",
      "varo": "Samalla kortilla ei voi maksaa kahdelle hengelle. Käyttäkää koko päivän samaa muovikorttia sekä sisään että ulos. Puhelimella maksaminen ja muovikortti ovat järjestelmälle eri kortteja, ja silloin matka voidaan veloittaa kahteen kertaan."
    },
    {
      "otsikko": "Oikea laituri: suunta Centro Direzionale",
      "teksti": [
        "Seuratkaa kylttejä laitureille. Linja 1 kulkee kahteen suuntaan. Oikea suunta on se, jonka kyltissä lukee Centro Direzionale (ja usein myös Garibaldi).",
        "Metroja tulee noin 12 minuutin välein."
      ],
      "tunnista": "Laiturin kyltti: direzione Centro Direzionale.",
      "varo": "Väärä suunta on Piscinola. Jos huomaatte olevanne väärässä junassa, jääkää pois seuraavalla asemalla ja vaihtakaa vastakkaiselle laiturille."
    },
    {
      "otsikko": "Metrolla kolme pysäkkiä: Garibaldi",
      "teksti": [
        "Pysäkit ovat Università, Duomo ja Garibaldi. Jääkää pois kolmannella pysäkillä, Garibaldilla. Matka kestää noin 6–8 minuuttia.",
        "Garibaldi on Napolin päärautatieasema (Napoli Centrale). Ulos tullessa näyttäkää sama kortti uudelleen portin lukijaan."
      ],
      "tunnista": "Aseman nimikyltti GARIBALDI.",
      "varo": "Muistakaa näyttää kortti myös ulos tullessa, muuten matkasta voidaan veloittaa enimmäishinta."
    },
    {
      "otsikko": "Kävely Circumvesuviana-asemalle",
      "teksti": [
        "Garibaldin metroasema on syvällä, ja ylös tullaan pitkillä liukuportailla. Seuratkaa koko ajan kylttejä Circumvesuviana tai EAV. Kävely kestää noin 5–10 minuuttia.",
        "Circumvesuvianan asema on maan alla Piazza Garibaldin alla. Sen nimi on Napoli Garibaldi."
      ],
      "tunnista": "Kyltit Circumvesuviana ja EAV.",
      "varo": "Älkää menkää valtionrautateiden (Trenitalia) laitureille tai lipunmyyntiin – Pompeijin juna on nimenomaan Circumvesuviana."
    },
    {
      "otsikko": "Junan portit: sama kortti kuin metrossa",
      "teksti": [
        "Circumvesuvianan porteilla maksetaan samalla tavalla kuin metrossa: kumpikin näyttää saman korttinsa portin kortinlukijaan, ja portti aukeaa. Lippua ei tarvitse ostaa eikä leimata. Matka Pompeijiin maksaa noin 3,30 €. Hinta lasketaan päivän matkoista jälkikäteen, joten veloitus näkyy tilillä vasta myöhemmin.",
        "Jos portin lukija ei toimi, ostakaa liput lipunmyynnistä (Biglietteria) tai lippuautomaatista. Ostakaa silloin samalla myös paluuliput, yhteensä neljä kertalippua Pompei Scaviin. Lipunmyynnissä voi näyttää lauseen: ”Quattro biglietti per Pompei Scavi, per favore.” (Neljä lippua Pompei Scaviin, kiitos.)",
        "Paperilippu leimataan ennen laiturille menoa keltaisessa leimauslaitteessa tai porttien lukijassa. Paluuliput leimataan vasta paluumatkalla."
      ],
      "tunnista": "Porttien kortinlukija, jossa on lähimaksun aaltomerkki.",
      "varo": "Pompei Scavissa sama kortti näytetään uudelleen ulos tullessa – muuten kortilta veloitetaan kallein hinta. Paperilipun kanssa: leimaamattomasta lipusta voi saada junassa 50 euron sakon."
    },
    {
      "otsikko": "Oikea juna: SORRENTO",
      "teksti": [
        "Pompeijin juna on Napoli–Sorrento-linjan juna. Junan tai laiturin näytössä pitää lukea määränpäänä SORRENTO (usein SORRENTO VIA POMPEI). Junia lähtee noin puolen tunnin välein.",
        "Laiturin numero vaihtelee, joten katsokaa se näytöstä sarakkeesta BIN. Tarkistushetkellä 11.11.2026 Sorrenton junat lähtivät laiturilta 1. Saman lähtötaulun näkee puhelimesta, linkki on tämän sivun kohdassa Aikataulut ja sovellukset.",
        "Jos olette epävarmoja, kysykää asemahenkilökunnalta tai muilta matkustajilta: ”Questo treno ferma a Pompei Scavi?” (Pysähtyykö tämä juna Pompei Scavissa?)"
      ],
      "tunnista": "Näyttö: SORRENTO ja laiturin numero sarakkeessa BIN.",
      "varo": "ÄLKÄÄ nousko junaan, jonka määränpää on Sarno, Poggiomarino tai Torre Annunziata (näytössä TORRE A.TA-OPLONTI) – ne eivät pysähdy Pompei Scavissa. Ne lähtevät yleensä eri laiturilta kuin Sorrenton juna."
    },
    {
      "otsikko": "Junassa noin 35 minuuttia",
      "teksti": [
        "Istukaa yhdessä ja pitäkää laukut sylissä vetoketjut kiinni. Taskuvarkaita on etenkin ensimmäisillä asemilla.",
        "Juna pysähtyy useilla asemilla. Matkalla ohitetaan Ercolano Scavi, joka on Herculaneumin rauniokaupunki – siellä ei jäädä pois. Torre Annunziatan jälkeen tulee teidän asemanne.",
        "Junissa ei aina ole kuulutuksia, joten seuratkaa asemakylttejä ikkunasta ja kelloa."
      ],
      "tunnista": "Asemakyltti POMPEI SCAVI – VILLA DEI MISTERI.",
      "varo": "Älkää jääkö pois asemalla Pompei Santuario – se on eri asema, lähes kahden kilometrin päässä raunioista."
    },
    {
      "otsikko": "Perillä: Porta Marina",
      "teksti": [
        "Asemalta ulos tullessa näyttäkää sama kortti portin lukijaan. Pompei Scavin asemalta on vain noin 50 metriä Pompeijin Porta Marina -sisäänkäynnille. Kävelkää asemalta ulos kadulle, niin näette sisäänkäynnin ja lipunmyynnin aivan vieressä.",
        "Portilla näytetään liput puhelimesta ja tarvittaessa passi. Sisäänkäynnin luona on myös vessa. Nyt voi avata oppaan Kartta- tai Reitit-sivun."
      ],
      "tunnista": "Kyltti Scavi di Pompei – Porta Marina.",
      "varo": "Tarkistakaa aikalaskurista, mihin aikaan teidän pitää viimeistään lähteä takaisin asemalle. Asettakaa puhelimeen herätys siihen aikaan."
    }
  ],
  "paluu": [
    {
      "otsikko": "Lähtekää ajoissa",
      "teksti": [
        "Lähtekää Pompeijin asemalle viimeistään aikalaskurin näyttämään aikaan. Se on 3 tuntia ennen laivan all aboard -aikaa. Väljyys on tarkoituksellinen, koska junat myöhästyvät joskus tai jäävät kokonaan ajamatta."
      ],
      "tunnista": "",
      "varo": "Jos aikaa on vähän, älkää lähtekö enää yhteen kohteeseen. Paluu on tärkeämpi kuin yksi talo lisää."
    },
    {
      "otsikko": "Pompei Scavin asemalla",
      "teksti": [
        "Näyttäkää kumpikin sama kortti kuin aamulla aseman portin lukijaan. Jos käytätte paperilippuja, leimatkaa paluuliput keltaisessa laitteessa. Jos lukija ei toimi eikä paluulippuja ole, ostakaa liput aseman lipunmyynnistä.",
        "Napoliin menevän junan määränpää on NAPOLI P.N. (Porta Nolana). Tarkistushetkellä 11.11.2026 Napolin junat lähtivät laiturilta 2. Tarkistakaa laituri näytöstä tai kysykää: ”Il treno per Napoli?”"
      ],
      "tunnista": "Näyttö: NAPOLI P.N.",
      "varo": "Älkää nousko junaan, joka menee Sorrentoon – se vie väärään suuntaan."
    },
    {
      "otsikko": "Junalla Napoliin: jääkää pois Garibaldilla",
      "teksti": [
        "Matka kestää noin 35 minuuttia. Jääkää pois asemalla NAPOLI GARIBALDI. Se on toiseksi viimeinen pysäkki. Asemalta ulos tullessa näyttäkää sama kortti portin lukijaan.",
        "Jos ohititte Garibaldin, jääkää pois päätepysäkillä Napoli Porta Nolana ja ottakaa sieltä taksi satamaan. Näyttäkää kuskille lause: ”Al porto, Stazione Marittima, per favore.”"
      ],
      "tunnista": "Asemakyltti NAPOLI GARIBALDI.",
      "varo": "Pitäkää laukut taas sylissä Napolia lähestyttäessä."
    },
    {
      "otsikko": "Metro: suunta Piscinola",
      "teksti": [
        "Seuratkaa Garibaldilla kylttejä Metropolitana, Linea 1. Näyttäkää kumpikin oma kortti portin lukijaan kuten aamulla.",
        "Oikea laituri on suunta PISCINOLA. Pysäkit ovat Duomo, Università ja Municipio. Jääkää pois kolmannella pysäkillä, Municipiolla."
      ],
      "tunnista": "Laiturin kyltti: direzione Piscinola.",
      "varo": "Väärä suunta on Centro Direzionale – se on vain yhden pysäkin päässä, joten jos juna pysähtyy siellä, olette menneet väärään suuntaan."
    },
    {
      "otsikko": "Municipiolta laivalle",
      "teksti": [
        "Näyttäkää kortti ulos tullessa. Seuratkaa kylttejä Porto tai Stazione Marittima ja kävelkää terminaaliin. Laivalle noustaan laivakortilla ja passilla."
      ],
      "tunnista": "Kyltti Porto / Stazione Marittima.",
      "varo": ""
    }
  ],
  "pieleen": [
    {
      "otsikko": "Juna ei kulje (lakko tai häiriö)",
      "teksti": "Lähtötaulusta näkee, onko juna myöhässä (sarake RIT. kertoo minuutit) vai peruttu (SOPPRESSO). Älkää jääkö odottamaan pitkäksi aikaa. Ottakaa taksi suoraan satamaan. Sopikaa hinta ennen lähtöä: Pompeijista satamaan noin 60–80 €. Kysykää taksia lipunmyynnistä, infopisteestä tai aseman edestä: ”Un taxi, per favore.”"
    },
    {
      "otsikko": "Portti ei lue korttia",
      "teksti": "Pitäkää kortti hetki paikallaan lukijan päällä ja kokeilkaa viereistä porttia. Lukijat ovat joskus epäkunnossa. Jos mikään ei toimi, ostakaa lippu lipunmyynnistä (Biglietteria) tai automaatista ja leimatkaa se. Henkilökunnalle voi näyttää lauseen: ”Il tornello non legge la mia carta.”"
    },
    {
      "otsikko": "Uhkaatte myöhästyä laivalta",
      "teksti": "Soittakaa heti laivan satama-agentille. Numero on laivan päiväohjelmassa, joten kirjoittakaa se aamulla ylös. Agentti voi ilmoittaa laivalle ja neuvoa."
    },
    {
      "otsikko": "Metro tuntuu aamulla hankalalta",
      "teksti": "Helpompi aloitus: ottakaa satamasta taksi suoraan Circumvesuvianan Garibaldin asemalle. Näyttäkää lause: ”Alla Circumvesuviana, stazione Garibaldi, per favore.” Lyhyt taksimatka kannattaa hinnoitella ennen lähtöä."
    },
    {
      "otsikko": "Eksyitte tai ette ole varmoja junasta",
      "teksti": "Kysykää asemahenkilökunnalta (univormu tai EAV-merkki) ja näyttäkää lause tämän sivun lopusta. Älkää lähtekö kenenkään vieraan mukaan, joka tarjoaa apua tai kyytiä."
    },
    {
      "otsikko": "Puhelimen akku loppuu",
      "teksti": "Muovikortilla maksaminen toimii, vaikka puhelimesta loppuisi akku. Pitäkää paperilla mukana tärkeimmät: Municipio → (metro, suunta Centro Direzionale) → Garibaldi → (Circumvesuviana, juna Sorrentoon) → Pompei Scavi. Paluu toisin päin. Lisäksi laivan all aboard -aika ja satama-agentin numero."
    },
    {
      "otsikko": "Turistijuna Campania Express",
      "teksti": "Pompeijiin on ennen kulkenut myös kalliimpi turistijuna Campania Express. Se on tauolla 1.10.2026 alkaen toistaiseksi, joten siihen ei kannata luottaa. Tavallinen juna riittää hyvin."
    }
  ],
  "sovellukset": [
    {
      "otsikko": "Junien lähtötaulu",
      "teksti": "Junayhtiön oma lähtötaulu näyttää samat tiedot kuin aseman näytöt: määränpään, laiturin (BIN), lähtöajan ja myöhästymisen minuutteina (RIT.). Peruttu juna näkyy sanalla SOPPRESSO. Taulu päivittyy itsestään.",
      "linkit": [
        { "teksti": "Lähtevät junat: Napoli Garibaldi", "osoite": "https://orariotreni.eavsrl.it/teleindicatori/?stazione=3&tipo=P" },
        { "teksti": "Lähtevät junat: Pompei Scavi", "osoite": "https://orariotreni.eavsrl.it/teleindicatori/?stazione=49&tipo=P" }
      ]
    },
    {
      "otsikko": "Google Maps",
      "teksti": "Näyttää reitin ja aikataulut julkisilla kulkuneuvoilla. Kirjoittakaa hakuun Pompei Scavi – Villa dei Misteri, ei pelkkää Pompei: muuten Maps voi ehdottaa väärää asemaa Pompei Santuario.",
      "linkit": []
    },
    {
      "otsikko": "GoEav-sovellus (ei pakollinen)",
      "teksti": "Junayhtiö EAV:n oma sovellus italiaksi ja englanniksi: liput, aikataulut sekä tiedotteet häiriöistä ja lakoista. Kortilla maksaessa sitä ei tarvita. Jos haluatte sen, asentakaa sovellus ja rekisteröitykää siihen jo kotona, sillä käyttäjien mukaan rekisteröinnin tekstiviesti ei aina tule perille. Sovelluksella ostettu lippu on voimassa 2 tuntia ostosta, joten ostakaa se vasta asemalla.",
      "linkit": [
        { "teksti": "GoEav junayhtiön sivuilla", "osoite": "https://www.eavsrl.it/app-goeav/" }
      ]
    }
  ],
  "lauseet": [
    { "it": "Dov'è la metropolitana?", "fi": "Missä on metro?" },
    { "it": "Dov'è la Circumvesuviana?", "fi": "Missä on Circumvesuviana-juna?" },
    { "it": "Quattro biglietti per Pompei Scavi, per favore.", "fi": "Neljä lippua Pompei Scaviin, kiitos." },
    { "it": "Due biglietti per Napoli, per favore.", "fi": "Kaksi lippua Napoliin, kiitos." },
    { "it": "Il tornello non legge la mia carta.", "fi": "Portti ei lue korttiani." },
    { "it": "Questo treno ferma a Pompei Scavi?", "fi": "Pysähtyykö tämä juna Pompei Scavissa?" },
    { "it": "Il treno per Napoli?", "fi": "Mistä lähtee juna Napoliin?" },
    { "it": "Dove devo scendere?", "fi": "Missä minun pitää jäädä pois?" },
    { "it": "Un taxi, per favore.", "fi": "Taksi, kiitos." },
    { "it": "Al porto, Stazione Marittima, per favore.", "fi": "Satamaan, risteilyterminaaliin, kiitos." },
    { "it": "Quanto costa fino al porto?", "fi": "Paljonko maksaa satamaan?" },
    { "it": "Alla Circumvesuviana, stazione Garibaldi, per favore.", "fi": "Circumvesuvianan Garibaldin asemalle, kiitos." },
    { "it": "La nostra nave parte alle ___ .", "fi": "Laivamme lähtee kello ___ ." },
    { "it": "Mi scusi, può aiutarci?", "fi": "Anteeksi, voisitteko auttaa meitä?" },
    { "it": "No, grazie.", "fi": "Ei kiitos." }
  ]
};
