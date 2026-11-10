// Pompeiji-oppaan kohteet, osa 1: sisäänkäynti, Forum ja teatterialue.
// Sisältö on JSON-muotoista, jotta tools/build_map.py voi lukea sijainnit reittien laskentaan.
// Kentät: id, nimi, it (italiaksi), osoite (Regio.Insula.Ovi), kategoria, alue, sijainti [lat, lon],
// tila (alue | auki | ulkoa | tarkista | suljettu), tilaTeksti, kesto (min), lyhyt, teksti[], katso[], tiesitko.
window.KOHTEET = (window.KOHTEET || []).concat([
{
  "id": "porta-marina",
  "nimi": "Porta Marina – Meriportti",
  "it": "Porta Marina",
  "osoite": "",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.748509, 14.483085],
  "tila": "alue",
  "tilaTeksti": "Sisäänkäynti ja lipunmyynti. Talvella (15.10.–15.3.) alue on auki 9.00–17.00, viimeinen sisäänpääsy 15.30.",
  "kesto": 2,
  "lyhyt": "Kaupungin läntinen portti ja nykyään vilkkain sisäänkäynti. Täältä nousee jyrkkä katu kohti Forumia.",
  "teksti": [
    "Porta Marina sai nimensä siitä, että täältä lähti tie kohti merta. Vuonna 79 rantaviiva oli paljon nykyistä lähempänä, ja Sarno-joen suulla oli satama, jonka kautta Pompeiji kävi kauppaa koko Välimeren alueelle.",
    "Portissa on kaksi holvattua aukkoa: leveämpi juhtaeläimille ja kapeampi jalankulkijoille. Rinne on niin jyrkkä, että kärryt tuskin kulkivat tästä lainkaan. Kivetyksessä näkyy kahden vuosituhannen kulutus.",
    "Kaupunki rakennettiin muinaisen laavavirran muodostaman kumpareen päälle. Siksi lähes jokainen portti on mäen laella ja kadut viettävät kohti kaupungin reunoja. Ylämäki Forumille on reitin raskain kohta – sen jälkeen kävely helpottuu."
  ],
  "katso": [
    "Portin kaksi erikokoista kulkuaukkoa",
    "Jyrkkä, kulunut kivetys ylös kohti Venuksen pyhäkköä"
  ],
  "tiesitko": "Pompeijin porttien nimet ovat nykyaikaisia: ne on annettu sen mukaan, mihin kaupunkiin portista lähtenyt tie johti. Muinaisista nimistä tunnetaan vain muutama piirtokirjoituksista."
},
{
  "id": "antiquarium",
  "nimi": "Antiquarium – Pompeijin museo",
  "it": "Antiquarium",
  "osoite": "",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.748295, 14.483331],
  "tila": "tarkista",
  "tilaTeksti": "Yleensä avoinna alueen aukioloaikoina. Lähin sisäänkäynti on Piazza Esedra.",
  "kesto": 20,
  "lyhyt": "Pieni museo Porta Marinan vieressä. Hyvä paikka aloittaa: löydöt ja kaupungin historia antavat taustan kaikelle muulle.",
  "teksti": [
    "Antiquarium on Pompeijin oma museo, joka avattiin uudelleen vuonna 2021 pitkän tauon jälkeen. Näyttely kulkee kaupungin vaiheissa varhaisista ajoista vuoden 79 purkaukseen ja kertoo, millaista arki kaupungissa oli.",
    "Esillä on freskoja, astioita, koruja ja muita esineitä, jotka on löydetty kaivauksissa. Kaivausten kuuluisimmat aarteet, kuten Aleksanteri-mosaiikki ja suuret pronssiveistokset, ovat kuitenkin Napolin kansallisessa arkeologisessa museossa.",
    "Jos aikaa on vähän, tänne kannattaa varata vartti heti alussa. Kun on nähnyt, millaisia esineitä taloista löytyi, tyhjät huoneet heräävät eloon aivan eri tavalla."
  ],
  "katso": [
    "Kaupungin historian aikajana",
    "Arkiesineet: astiat, valaisimet ja korut"
  ],
  "tiesitko": "Napolin kansallinen arkeologinen museo on Pompeijin löytöjen varsinainen aarreaitta. Jos käytte Napolissa, sinne kannattaa varata pari tuntia."
},
{
  "id": "venus",
  "nimi": "Venuksen pyhäkkö",
  "it": "Santuario di Venere",
  "osoite": "VIII.1.3",
  "kategoria": "temppeli",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.748424, 14.483719],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 3,
  "lyhyt": "Kaupungin suojelijajumalattaren temppeli kukkulan reunalla. Sieltä oli aikanaan näkymä merelle.",
  "teksti": [
    "Venus oli Pompeijin suojelija. Kun roomalaiset tekivät kaupungista siirtokunnan vuonna 80 eaa., sen viralliseksi nimeksi tuli Colonia Cornelia Veneria Pompeianorum. Nimi viittaa sekä siirtokunnan perustaneeseen Sullaan, jonka sukunimi oli Cornelius, että Venukseen, jota Sulla piti henkilökohtaisena suojelijanaan.",
    "Temppeli seisoi korkealla terassilla kaupungin lounaislaidalla, ja se näkyi kauas merelle. Se oli koristeltu marmorilla, mutta vuoden 62 maanjäristys vaurioitti sitä pahoin, ja korjaukset olivat vielä kesken purkauksen tullessa. Suuri osa marmorista on kadonnut, joten jäljellä ovat lähinnä perustukset ja terassit."
  ],
  "katso": [
    "Temppelin korkea perustus",
    "Näkymä alas tasangolle, jossa aikanaan oli rantaviiva"
  ],
  "tiesitko": "Venus näkyy kaikkialla kaupungissa: kauppiaat maalasivat häntä liikkeidensä seiniin, ja yksi Pompeijin kuuluisimmista freskoista esittää Venusta simpukankuoressa. Sen näet kaupungin itäosassa."
},
{
  "id": "basilika",
  "nimi": "Basilika – oikeustalo ja kauppahalli",
  "it": "Basilica",
  "osoite": "VIII.1.1",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.748768, 14.48456],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 5,
  "lyhyt": "Pompeijin suurin julkinen rakennus, jossa käytiin oikeutta ja tehtiin kauppoja. Yksi vanhimmista tunnetuista basilikoista.",
  "teksti": [
    "Basilika rakennettiin toisen vuosisadan lopulla eaa., ja se on yksi vanhimmista säilyneistä roomalaistyyppisistä basilikoista. Nimi ei tarkoita kirkkoa: roomalainen basilika oli katettu monitoimihalli, jossa tuomarit istuivat, liikemiehet tekivät sopimuksia ja kaupunkilaiset suojautuivat sateelta ja helteeltä.",
    "Salia kiertävät paksut pylväät on muurattu tiilistä ja rapattu marmorin näköisiksi. Salin perällä on korotettu tuomarin koroke. Katon rakenteesta kiistellään yhä: oliko koko halli katettu, vai oliko keskellä avoin piha.",
    "Basilikan seinillä oli satoja raapustuksia. Ihmiset kirjoittivat seiniin terveisiä, rakkaudentunnustuksia, haukkumisia ja runonsäkeitä – aivan kuten nykyäänkin."
  ],
  "katso": [
    "Tiilistä muuratut paksut pylväät",
    "Salin perällä oleva tuomarin koroke",
    "Seinien rappaus, joka jäljitteli värikästä marmoria"
  ],
  "tiesitko": "Eräs Basilikan seinään raapustettu säe on Pompeijin tunnetuimpia: ”Ihmettelen, seinä, ettet ole sortunut, kun kannat niin monen kirjoittajan typeryyksiä.” Sama säe löytyy kaupungista useasta paikasta."
},
{
  "id": "apollo",
  "nimi": "Apollon temppeli",
  "it": "Tempio di Apollo",
  "osoite": "VII.7.32",
  "kategoria": "temppeli",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.749262, 14.484494],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 5,
  "lyhyt": "Pompeijin vanhimpia pyhäkköjä. Pihalla ovat Apollon patsaan ja hänen sisarensa Dianan rintakuvan kopiot.",
  "teksti": [
    "Apolloa on palvottu tällä paikalla ainakin kuudennelta vuosisadalta eaa., jolloin Pompeiji oli vielä pieni oskien kaupunki kreikkalaisten ja etruskien vaikutuspiirissä. Nykyisin näkyvä temppeli on toiselta vuosisadalta eaa.",
    "Temppeli seisoo korkealla jalustalla pylväiden ympäröimän pihan keskellä. Portaiden edessä on alttari, jolla uhrattiin. Pihalla seisovat jousella ampuvan Apollon pronssipatsas ja Dianan rintakuva. Alkuperäiset ovat Napolin arkeologisessa museossa, mutta kopiot antavat hyvän kuvan siitä, miltä piha näytti.",
    "Pihalla on myös aurinkokello korkean pylvään päällä. Kaupungin ajanlasku perustui aurinkoon: päivä jaettiin kahteentoista tuntiin, joiden pituus vaihteli vuodenajan mukaan."
  ],
  "katso": [
    "Apollon patsas ja Dianan rintakuva pihan laidoilla (kopioita)",
    "Korkea temppelijalusta ja sen edessä oleva alttari",
    "Aurinkokello pylvään päällä"
  ],
  "tiesitko": "Apollo oli valon, musiikin ja ennustamisen jumala. Pompeijissa häntä palvottiin jo silloin, kun kaupunki ei vielä ollut roomalainen ja täällä puhuttiin latinan sijaan oskia."
},
{
  "id": "forum",
  "nimi": "Forum – kaupungin sydän",
  "it": "Foro",
  "osoite": "VII.8",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.749414, 14.48476],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 10,
  "lyhyt": "Pitkä, pylväikköjen reunustama aukio oli hallinnon, uskonnon ja kaupankäynnin keskus. Pohjoispäässä kohoaa Vesuvius.",
  "teksti": [
    "Forum oli kaupungin olohuone. Täällä pidettiin markkinoita, kuulutettiin päätöksiä, juhlittiin ja vaalittiin virkamiehiä. Aukion ympärillä olivat kaupungin tärkeimmät rakennukset: temppelit, oikeustalona toiminut Basilika, ruokatori, hallintorakennukset ja mittojen valvontapaikka.",
    "Aukio oli kivetty vaalealla kivellä, eikä sinne päässyt ajoneuvoilla: sisäänkäynneille oli pystytetty kivipylväitä estämään kärryjen pääsy. Kaksikerroksisen pylväikön varjossa kauppiaat ja asianajajat pitivät pöytiään. Aukiolla seisoi lukuisia patsaita kaupungin merkkihenkilöistä – niiden jalustat näkyvät yhä aukion laidoilla.",
    "Forumin länsilaidalla, Apollon temppelin seinustalla, on mittapöytä eli Mensa Ponderaria. Sen kivisiin koloihin mitattiin viljaa, öljyä ja viiniä, jotta kauppiaat eivät voineet huijata asiakkaitaan.",
    "Kun purkaus alkoi, Forumilla oli käynnissä korjaustöitä vuoden 62 maanjäristyksen jäljiltä. Osa pylväiköstä oli yhä rakenteilla."
  ],
  "katso": [
    "Vesuvius Jupiterin temppelin takana – Pompeijin tunnetuin näkymä",
    "Patsaiden jalustat aukion reunoilla",
    "Mittapöytä Mensa Ponderaria länsilaidalla"
  ],
  "tiesitko": "Pompeijissa asui vuonna 79 arviolta runsaat 10 000 ihmistä. Kaupungista on löydetty noin 1 150 uhria, joten valtaosa asukkaista ehti luultavasti paeta purkauksen ensimmäisten tuntien aikana."
},
{
  "id": "jupiter",
  "nimi": "Jupiterin temppeli",
  "it": "Tempio di Giove",
  "osoite": "VII.8.1",
  "kategoria": "temppeli",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.74995, 14.484496],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 3,
  "lyhyt": "Forumin pohjoispäätä hallitseva temppeli, jonka takana näkyy Vesuvius. Roomalaisen kaupungin päätemppeli.",
  "teksti": [
    "Temppeli rakennettiin toisella vuosisadalla eaa. alun perin Jupiterille. Kun Pompeijista tuli roomalainen siirtokunta, siitä tehtiin Rooman mallin mukainen Kapitolium, jossa palvottiin kolmea jumalaa: Jupiteria, Junoa ja Minervaa.",
    "Temppeli seisoo noin kolmen metrin korkuisella jalustalla. Jalustan sisällä oli holvattuja kammioita, joissa luultavasti säilytettiin temppelin aarteita ja kaupungin varoja. Rakennus kärsi pahoin vuoden 62 maanjäristyksessä, eikä sitä ollut korjattu purkaukseen mennessä.",
    "Temppelin portaiden sivuilla oli ratsastajapatsaiden jalustat, ja sen molemmin puolin seisoi kunniakaari. Seiso aukion keskellä ja katso pohjoiseen: temppeli, sen takana kohoava Vesuvius ja aukion pylväät muodostavat Pompeijin tunnetuimman näkymän."
  ],
  "katso": [
    "Vesuvius suoraan temppelin takana – vuonna 79 vuoren muoto oli toinen",
    "Korkea jalusta ja sen sisäiset kammiot",
    "Kunniakaarten jäänteet temppelin sivuilla"
  ],
  "tiesitko": "Temppelistä löydettiin Jupiterin valtava marmoripää, joka on nyt Napolin museossa. Se kuului temppelin kulttipatsaaseen."
},
{
  "id": "granai",
  "nimi": "Forumin vilja-aitta",
  "it": "Granai del Foro",
  "osoite": "VII.7.29",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.7496, 14.48417],
  "tila": "suljettu",
  "tilaTeksti": "Puiston mukaan tilapäisesti ei näkyvissä (tilanne 11/2026). Kipsivaloksia on esillä Ison palestran näyttelyssä.",
  "kesto": 2,
  "lyhyt": "Pitkä halli Forumin länsilaidalla. Sitä on käytetty kaivauslöytöjen varastona, ja sen kaltereiden takana näkyivät pitkään amforat ja kipsivalokset.",
  "teksti": [
    "Rakennus oli purkaushetkellä kesken. Se oli luultavasti tarkoitettu tori- tai varastohalliksi, mutta sitä ei ollut ehditty viimeistellä. Myöhemmin siitä tuli kaivauslöytöjen varasto, ja kaltereiden takaa näkyivät hyllyt täynnä amforoita, kivijalkoja ja kipsivaloksia.",
    "Puiston tiedon mukaan varasto ei ole tällä hetkellä näkyvissä. Purkauksen uhrien kipsivaloksia voi nähdä pysyvässä näyttelyssä Isossa palestrassa amfiteatterin vieressä."
  ],
  "katso": [
    "Rakennuksen pitkä pylväsjulkisivu Forumille päin"
  ],
  "tiesitko": ""
},
{
  "id": "macellum",
  "nimi": "Macellum – ruokatori",
  "it": "Macellum",
  "osoite": "VII.9.7",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.750102, 14.4851],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 3,
  "lyhyt": "Kaupungin ruokatori Forumin koilliskulmassa. Keskellä oli pyöreä katos, jonka alla luultavasti puhdistettiin ja myytiin kalaa.",
  "teksti": [
    "Macellum oli ruokatori, jossa myytiin lihaa, kalaa ja muita herkkuja. Pihaa kiersivät pienet myymälät, ja keskellä oli kahdentoista pylvään varassa seissyt pyöreä katos vesialtaineen. Altaan ympäriltä löydettiin runsaasti kalansuomuja.",
    "Torin perällä oli pieni pyhäkkö, joka oli omistettu keisarin kultille. Seinillä on säilynyt freskoja, joissa on ruokatarvikkeita, kuten kaloja, lintuja ja leipiä, sekä mytologisia kohtauksia."
  ],
  "katso": [
    "Pihan keskellä pyöreän katoksen kivijalat",
    "Seinäfreskot, joissa on ruokaa ja mytologisia kohtauksia"
  ],
  "tiesitko": "Pompeijin kuuluisin mauste oli garum, kalasta valmistettu suolainen kastike. Kaupungin tunnetuin garum-tuottaja oli Umbricius Scaurus, jonka kastikeruukkuja on löydetty laajalti Välimeren alueelta."
},
{
  "id": "eumachia",
  "nimi": "Eumachian rakennus",
  "it": "Edificio di Eumachia",
  "osoite": "VII.9.1",
  "kategoria": "julkinen",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.749367, 14.485339],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 3,
  "lyhyt": "Forumin itälaidan suurin rakennus. Sen lahjoitti kaupungille Eumachia, vaikutusvaltainen papitar ja liikenainen.",
  "teksti": [
    "Eumachia oli yksi Pompeijin vaikutusvaltaisimmista naisista. Hän oli julkinen papitar ja varakkaan suvun perijä. Hän rahoitti tämän suuren pylväshallin, ja julkisivun kirjoitus kertoo, että hän omisti sen sovun jumalattarelle ja keisarillisen perheen hurskaudelle.",
    "Rakennuksen tarkka käyttötarkoitus ei ole varma. Usein sen ajatellaan toimineen villakauppiaiden ja pesuloiden kokoontumispaikkana, koska pesuloiden väki pystytti rakennukseen Eumachian patsaan. Patsas on nyt Napolin museossa.",
    "Sisäänkäynnin kehyksenä on marmorinen ovenpieli, jossa kiertää köynnöksiä, lintuja ja pieniä eläimiä. Se on yksi kaupungin hienoimmista kiviveistoksista."
  ],
  "katso": [
    "Marmorinen ovenkehys, jossa kiertää köynnöksiä ja lintuja",
    "Lahjoituskirjoitus Forumin puoleisella julkisivulla"
  ],
  "tiesitko": "Eumachian hauta on Nocera-portin ulkopuolella kaupungin toisella laidalla, ja se on yksi koko hautausmaan suurimmista. Vaikutusvalta näkyi vielä kuoleman jälkeenkin."
},
{
  "id": "vespasianus",
  "nimi": "Vespasianuksen temppeli",
  "it": "Tempio di Vespasiano",
  "osoite": "VII.9.2",
  "kategoria": "temppeli",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.749611, 14.485185],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 2,
  "lyhyt": "Pieni keisarikultin pyhäkkö, jonka marmorialttariin on veistetty uhritoimitus.",
  "teksti": [
    "Roomalaisessa maailmassa keisaria kunnioitettiin jumalan kaltaisena, ja kaupungit osoittivat uskollisuuttaan rakentamalla keisarikultin pyhäkköjä. Tämä pieni temppeli Forumin itälaidalla oli luultavasti omistettu keisari Vespasianukselle, joka hallitsi purkausta edeltäneen vuosikymmenen.",
    "Pihan keskellä seisoo marmorialttari, jonka kylkeen on veistetty uhritoimitus: pappi pää peitettynä, avustajat ja uhriksi tuotava härkä. Kuva on pieni mutta tarkka näyte siitä, miten uhrit käytännössä suoritettiin."
  ],
  "katso": [
    "Alttarin kylkeen veistetty härän uhraaminen"
  ],
  "tiesitko": "Keisari Vespasianus kuoli kesäkuussa 79, vain muutamaa kuukautta ennen purkausta. Purkauksen aikaan keisarina oli hänen poikansa Titus, joka järjesti apua tuhoalueen eloonjääneille."
},
{
  "id": "foruminkylpylat",
  "nimi": "Forumin kylpylät",
  "it": "Terme del Foro",
  "osoite": "VII.5.2",
  "kategoria": "kylpyla",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.750347, 14.484111],
  "tila": "tarkista",
  "tilaTeksti": "Yleensä avoinna. Osa tiloista voi olla suljettuna.",
  "kesto": 8,
  "lyhyt": "Pieni mutta erinomaisesti säilynyt kylpylä Forumin vieressä. Haalean huoneen seinillä seisovat terrakottaiset kantajahahmot.",
  "teksti": [
    "Kylpylät olivat roomalaisille paljon muutakin kuin peseytymistä: ne olivat kohtaamispaikkoja, joissa vietettiin tuntikausia juttelemassa, liikkumassa ja rentoutumassa. Forumin kylpylät rakennettiin pian sen jälkeen, kun Pompeijista oli tullut roomalainen siirtokunta.",
    "Kylpijä kulki pukuhuoneesta kylmän altaan kautta haaleaan huoneeseen ja lopulta kuumaan huoneeseen. Kuuman huoneen lattian alla ja seinien sisällä kiersi kuuma ilma tulipesästä. Haaleaa huonetta lämmitti suuri pronssinen hiilipannu.",
    "Haalean huoneen seinillä seisoo rivi pieniä miesfiguureja, telamoneja, jotka kannattelevat reunalistaa. Kuumassa huoneessa on suuri marmorinen pesuallas, jonka reunaan on kirjoitettu sen hankkineiden virkamiesten nimet ja altaan hinta."
  ],
  "katso": [
    "Haalean huoneen telamonit eli kantajahahmot",
    "Kuuman huoneen marmorinen pesuallas",
    "Holvikattojen stukkokoristeet"
  ],
  "tiesitko": "Kylpylöissä oli usein erilliset osastot miehille ja naisille. Naisten osasto oli pienempi, ja sinne kuljettiin omasta ovesta sivukadulta."
},
{
  "id": "mosaici-geometrici",
  "nimi": "Geometristen mosaiikkien talo",
  "it": "Casa dei Mosaici Geometrici",
  "osoite": "VIII.2.16",
  "kategoria": "talo",
  "alue": "Sisäänkäynti ja Forum",
  "sijainti": [40.74838, 14.485217],
  "tila": "auki",
  "tilaTeksti": "Auki 9.00–17.00 (tilanne 11/2026).",
  "kesto": 5,
  "lyhyt": "Suuri talo kaupungin etelärinteellä. Lattioissa on kymmeniä mustavalkoisia kuviomosaiikkeja.",
  "teksti": [
    "Talo on yksi kaupungin suurimmista, ja se rakennettiin etelärinteeseen kaupunginmuurin päälle useaan kerrokseen. Huoneiden lattioissa on mustavalkoisia geometrisia mosaiikkeja: ruutuja, kolmioita, tähtiä ja labyrintteja, joista talo on saanut nimensä.",
    "Rinteen talot olivat kaupungin halutuimpia, sillä niiden terasseilta avautui näkymä merelle ja tasangolle. Talo on lähellä Basilikaa ja Porta Marinaa, joten siinä on kätevä käydä heti kierroksen alussa tai lopussa."
  ],
  "katso": [
    "Mustavalkoiset kuviolattiat"
  ],
  "tiesitko": ""
},
{
  "id": "teatteri-iso",
  "nimi": "Iso teatteri",
  "it": "Teatro Grande",
  "osoite": "VIII.7.20",
  "kategoria": "viihde",
  "alue": "Teatterialue",
  "sijainti": [40.748858, 14.488397],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 8,
  "lyhyt": "Rinteeseen rakennettu teatteri noin 5 000 katsojalle. Akustiikka toimii yhä.",
  "teksti": [
    "Teatteri rakennettiin toisella vuosisadalla eaa. kreikkalaiseen tapaan luonnolliseen rinteeseen. Augustuksen aikana kaupungin rikas Holconiusten suku laajensi ja kaunisti sitä marmorilla. Katsomoon mahtui noin 5 000 ihmistä.",
    "Esitykset olivat ilmaisia, ja niitä rahoittivat kaupungin virkamiehet ja rikkaat suosijat. Ohjelmistossa oli komedioita, farsseja ja muodikkaita pantomiimeja, joissa yksi tanssija esitti koko tarinan liikkein ja naamioin. Helteellä katsomon ylle levitettiin purjekangas varjoksi.",
    "Kokeile akustiikkaa: kun joku puhuu näyttämöllä tavallisella äänellä, sen kuulee hyvin ylemmille riveille. Ylimmiltä riveiltä näkyy myös teatterin takana oleva Gladiaattorien kasarmi."
  ],
  "katso": [
    "Katsomon kivipenkit ja kunniapaikat alimmilla riveillä",
    "Ylimmän muurin kiinnikkeet, joihin varjokankaan pylväät asetettiin",
    "Näkymä Gladiaattorien kasarmiin"
  ],
  "tiesitko": "Teatteria käytetään yhä: kesäisin siellä järjestetään konsertteja ja näytelmiä."
},
{
  "id": "odeion",
  "nimi": "Pieni teatteri – Odeion",
  "it": "Teatro Piccolo",
  "osoite": "VIII.7.17",
  "kategoria": "viihde",
  "alue": "Teatterialue",
  "sijainti": [40.748888, 14.488944],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 4,
  "lyhyt": "Katettu pieni teatteri musiikille ja lausunnalle. Kaiteiden päitä kannattelevat polvistuvat kantajahahmot.",
  "teksti": [
    "Odeion rakennettiin pian sen jälkeen, kun roomalaiset siirtolaiset olivat asettuneet kaupunkiin noin vuonna 80 eaa. Sen rahoittivat samat kaksi virkamiestä, jotka rakennuttivat myös amfiteatterin: Quinctius Valgus ja Marcus Porcius.",
    "Teatterissa oli puukatto, joten sen akustiikka sopi hyvin musiikkiin, runonlausuntaan ja pienimuotoisiin esityksiin. Katsomoon mahtui noin tuhat ihmistä. Kaiteiden päitä kannattelevat tuffikivestä veistetyt polvistuvat miehet."
  ],
  "katso": [
    "Kaiteiden päitä kannattelevat polvistuvat hahmot",
    "Tiivis, puoliympyrän muotoinen katsomo"
  ],
  "tiesitko": ""
},
{
  "id": "quadriporticus",
  "nimi": "Gladiaattorien kasarmi",
  "it": "Quadriportico dei Teatri",
  "osoite": "VIII.7.16",
  "kategoria": "viihde",
  "alue": "Teatterialue",
  "sijainti": [40.748349, 14.488877],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 4,
  "lyhyt": "Teatterin taakse rakennettu pylväspiha, joka muutettiin vuoden 62 maanjäristyksen jälkeen gladiaattorien asuin- ja harjoituspaikaksi.",
  "teksti": [
    "Pylväspiha rakennettiin alun perin teatterin yleisölle: väliajalla katsojat saattoivat kävellä varjossa. Vuoden 62 maanjäristyksen jälkeen piha muutettiin gladiaattorien kasarmiksi. Pylväikön ympärille rakennettiin kaksikerroksisia huoneita, joissa taistelijat asuivat, ja keskellä he harjoittelivat.",
    "1700-luvun kaivauksissa täältä löytyi gladiaattorien varusteita: koristeellisia pronssikypäriä, säärisuojia ja kilpiä, joista monet ovat nyt Napolin museossa. Kasarmista löytyi myös useiden ihmisten jäännökset, joukossa runsain koruin koristautunut nainen. Hänen henkilöllisyydestään on esitetty monia arvailuja."
  ],
  "katso": [
    "Pylväspiha, jota kiertää huonerivi",
    "Näkymä Ison teatterin takaseinään"
  ],
  "tiesitko": "Gladiaattorit olivat useimmiten orjia, sotavankeja tai tuomittuja, mutta joukossa oli myös vapaaehtoisia, jotka tavoittelivat mainetta ja palkkioita. Menestyneistä gladiaattoreista tuli julkkiksia, ja heidän nimiään raapustettiin seiniin."
},
{
  "id": "foro-triangolare",
  "nimi": "Kolmikulmainen forum ja doorilainen temppeli",
  "it": "Foro Triangolare",
  "osoite": "VIII.7.30",
  "kategoria": "temppeli",
  "alue": "Teatterialue",
  "sijainti": [40.748574, 14.487955],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 4,
  "lyhyt": "Kaupungin vanhimman temppelin raunio näköalapaikalla teatterien yllä. Temppeli on peräisin 500-luvulta eaa.",
  "teksti": [
    "Kolmikulmaisen, pylväiden ympäröimän aukion keskellä on Pompeijin vanhimman temppelin raunio. Doorilainen temppeli rakennettiin jo kuudennella vuosisadalla eaa., ja se oli omistettu Athenalle ja Herakleelle. Erään tarinan mukaan Herakles perusti Pompeijin.",
    "Aukio on laavakumpareen reunalla, ja sieltä oli aikanaan näkymä alas Sarnon laaksoon ja merelle. Purkaukseen mennessä temppeli oli jo rapistunut, mutta paikkaa pidettiin yhä pyhänä. Aukion vieressä on samniittiajan palestra, jossa nuoret miehet harjoittelivat."
  ],
  "katso": [
    "Doorilaisen temppelin perustukset ja pylväiden kapiteelit",
    "Aukion sisäänkäynnin pylväikkö"
  ],
  "tiesitko": ""
},
{
  "id": "iside",
  "nimi": "Isiksen temppeli",
  "it": "Tempio di Iside",
  "osoite": "VIII.7.28",
  "kategoria": "temppeli",
  "alue": "Teatterialue",
  "sijainti": [40.749142, 14.488298],
  "tila": "alue",
  "tilaTeksti": "",
  "kesto": 4,
  "lyhyt": "Egyptiläisen jumalattaren pyhäkkö, jonka kuusivuotias poika rakennutti maanjäristyksen jälkeen uudelleen – isänsä rahoilla.",
  "teksti": [
    "Isis oli egyptiläinen jumalatar, jonka kultti levisi koko Välimeren alueelle. Hänen palvontansa lupasi henkilökohtaista pelastusta ja elämää kuoleman jälkeen, ja se houkutteli erityisesti naisia, vapautettuja orjia ja kauppiaita.",
    "Temppeli tuhoutui vuoden 62 maanjäristyksessä ja rakennettiin kokonaan uudelleen. Sisäänkäynnin kirjoitus kertoo, että rakennuttaja oli kuusivuotias Numerius Popidius Celsinus, ja kiitokseksi hänet otettiin kaupunginneuvostoon. Todellisuudessa rahat tulivat hänen isältään, vapautetulta orjalta, joka ei itse voinut saada virkaa. Näin isä avasi pojalleen tien kaupungin eliittiin.",
    "Pihalla on pieni rakennus, jonka maanalaisessa altaassa säilytettiin pyhää Niilin vettä. Kun temppeli kaivettiin esiin 1760-luvulla, se teki valtavan vaikutuksen eurooppalaisiin matkailijoihin. Täällä vieraili myös nuori Mozart, ja temppelin on arveltu innoittaneen Taikahuilun egyptiläisiä kohtauksia."
  ],
  "katso": [
    "Temppelin korkea jalusta ja patsaiden syvennykset",
    "Pyhän veden pieni rakennus pihalla"
  ],
  "tiesitko": "Temppelin seinämaalaukset ja esineet siirrettiin aikanaan Napolin museoon, jossa ne on koottu omaksi Isis-saliksi."
}
]);
