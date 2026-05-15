# Locations registry — region/city string → lat/lon

This file is the lookup table the build script uses to attach `geo` coordinates to nodes whose `region` or `city-of-origin` matches one of the entries below. The atlas map thumbnail uses these to highlight the deity/document/event's homeland.

**Format:** one entry per line. `key | lat | lon | display-label`. Lines starting with `#` are comments.

**Editing:** add new entries any time. After editing, run `python3 build_data.py` to refresh.

## Major regions (broad)

```
Mesopotamia                  | 33.5  | 44.4  | Mesopotamia
Sumer                        | 31.3  | 45.8  | Sumer (southern Mesopotamia)
Akkad                        | 33.1  | 44.1  | Akkad
Babylonia                    | 32.5  | 44.4  | Babylonia
Assyria                      | 36.4  | 43.2  | Assyria
Egypt                        | 26.0  | 30.0  | Egypt
Upper Egypt                  | 25.7  | 32.6  | Upper Egypt (Thebes region)
Lower Egypt                  | 30.0  | 31.2  | Lower Egypt (Delta)
Levant                       | 33.5  | 35.9  | Levant
Canaan                       | 32.0  | 35.0  | Canaan
Ugarit                       | 35.6  | 35.8  | Ugarit (Ras Shamra)
Phoenicia                    | 34.0  | 35.6  | Phoenicia
Israel                       | 31.8  | 35.2  | Israel
Judah                        | 31.5  | 35.0  | Judah
Galilee                      | 32.8  | 35.5  | Galilee
Persia                       | 32.0  | 53.0  | Persia (Iran)
Iran                         | 32.0  | 53.0  | Iran
Bactria                      | 36.7  | 67.0  | Bactria
Anatolia                     | 39.0  | 35.0  | Anatolia (Asia Minor)
India                        | 22.0  | 78.0  | India
Indus Valley                 | 28.0  | 71.0  | Indus Valley
Northwest India              | 30.0  | 75.0  | Northwest India (Punjab)
South India                  | 13.0  | 78.0  | South India
Tibet                        | 31.0  | 88.0  | Tibet
China                        | 35.0  | 105.0 | China
Greece                       | 38.0  | 23.7  | Greece
Athens                       | 37.97 | 23.72 | Athens
Sparta                       | 37.07 | 22.43 | Sparta
Crete                        | 35.2  | 24.8  | Crete
Italy                        | 42.0  | 12.5  | Italy
Rome                         | 41.9  | 12.5  | Rome
Gaul                         | 46.0  |  2.0  | Gaul
Britain                      | 53.0  | -2.0  | Britain
Iberia                       | 40.0  | -4.0  | Iberia
Scandinavia                  | 62.0  | 15.0  | Scandinavia
Iceland                      | 64.1  | -21.9 | Iceland
Russia                       | 61.0  | 100.0 | Russia
Arabia                       | 24.0  | 45.0  | Arabia
Mecca                        | 21.4  | 39.8  | Mecca
Medina                       | 24.5  | 39.6  | Medina
Damascus                     | 33.5  | 36.3  | Damascus
Baghdad                      | 33.3  | 44.4  | Baghdad
Cordoba                      | 37.9  | -4.8  | Córdoba
Constantinople               | 41.0  | 29.0  | Constantinople (Istanbul)
Byzantium                    | 41.0  | 29.0  | Byzantium
Ethiopia                     |  9.0  | 39.0  | Ethiopia
Aksumite Kingdom             | 14.1  | 38.7  | Aksumite Kingdom
Aksum                        | 14.13 | 38.72 | Aksum
Tigray                       | 14.0  | 38.5  | Tigray
Adwa                         | 14.17 | 38.9  | Adwa
Lalibela                     | 12.03 | 39.05 | Lalibela
Gondar                       | 12.6  | 37.47 | Gondar
Lake Tana                    | 12.0  | 37.3  | Lake Tana
Debre Damo                   | 14.4  | 39.3  | Debre Damo monastery
Debre Libanos                | 9.7   | 38.85 | Debre Libanos monastery
Debre Berhan                 | 9.68  | 39.53 | Debre Berhan
Shewa                        | 9.5   | 39.0  | Shewa
Amhara                       | 11.0  | 38.0  | Amhara
Wollo                        | 11.6  | 39.5  | Wollo
Eritrea                      | 15.2  | 39.0  | Eritrea
Adulis                       | 15.27 | 39.66 | Adulis (Aksumite Red Sea port)
Maqdala                      | 11.4  | 39.35 | Maqdala (Magdala)
Himyar                       | 14.5  | 44.4  | Himyar (southern Yemen)
Sheba                        | 15.5  | 45.3  | Sheba / Saba (South Arabia)
Saba                         | 15.5  | 45.3  | Saba (South Arabia)
Najran                       | 17.5  | 44.13 | Najran (southwestern Arabia)
Marib                        | 15.4  | 45.3  | Marib (Sabaean / Himyarite capital)
West Africa                  | 11.0  |  3.0  | West Africa
Yorubaland                   |  7.4  |  3.9  | Yorubaland
Haiti                        | 19.0  | -72.0 | Haiti
Cuba                         | 21.5  | -78.0 | Cuba
Mesoamerica                  | 17.0  | -93.0 | Mesoamerica
Mexico                       | 23.6  | -102.5| Mexico
Tenochtitlán                 | 19.4  | -99.1 | Tenochtitlán
Yucatán                      | 20.5  | -89.0 | Yucatán
Andes                        | -16.0 | -70.0 | Andes
Peru                         | -10.0 | -76.0 | Peru
Cusco                        | -13.5 | -71.9 | Cusco
North America                | 40.0  | -100.0| North America (continent)
Hawaii                       | 19.6  | -155.5| Hawaii
Aotearoa                     | -41.0 | 174.0 | Aotearoa / New Zealand
Polynesia                    | -17.0 | -150.0| Polynesia
Australia                    | -25.0 | 133.0 | Australia
Japan                        | 36.0  | 138.0 | Japan
Korea                        | 37.0  | 127.5 | Korea
Finland                      | 64.0  | 26.0  | Finland
Karelia                      | 63.0  | 32.0  | Karelia
```

## Specific cities (mostly mentioned in deity / document YAML)

```
Babylon                      | 32.5  | 44.4  | Babylon
Uruk                         | 31.3  | 45.6  | Uruk
Eridu                        | 30.8  | 46.1  | Eridu
Nippur                       | 32.1  | 45.2  | Nippur
Ur                           | 30.96 | 46.1  | Ur
Lagash                       | 31.4  | 46.4  | Lagash
Kish                         | 32.5  | 44.6  | Kish
Mari                         | 34.5  | 40.9  | Mari
Ebla                         | 35.8  | 36.8  | Ebla
Hattusa                      | 40.0  | 34.6  | Hattusa
Memphis (Egypt)              | 29.85 | 31.25 | Memphis (Egypt)
Heliopolis                   | 30.13 | 31.30 | Heliopolis (Egypt)
Thebes (Egypt)               | 25.7  | 32.65 | Thebes (Egypt)
Giza                         | 29.979| 31.134| Giza Plateau (Egypt)
Saqqara                      | 29.871| 31.216| Saqqara (Egypt)
Dahshur                      | 29.793| 31.209| Dahshur (Egypt)
Teotihuacan                  | 19.692| -98.844| Teotihuacan (Mexico)
Palenque                     | 17.483| -92.046| Palenque (Chiapas, Mexico)
Chichen Itza                 | 20.682| -88.568| Chichen Itza (Yucatán, Mexico)
Amarna                       | 27.65 | 30.9  | Amarna
Saïs                         | 30.97 | 30.77 | Saïs
Alexandria                   | 31.2  | 29.9  | Alexandria
Antioch                      | 36.2  | 36.16 | Antioch (Syria)
Edessa                       | 37.16 | 38.79 | Edessa
Carthage                     | 36.85 | 10.32 | Carthage
Smyrna                       | 38.42 | 27.14 | Smyrna
Ephesus                      | 37.94 | 27.34 | Ephesus
Nicaea                       | 40.43 | 29.72 | Nicaea
Chalcedon                    | 40.99 | 29.03 | Chalcedon
Jerusalem                    | 31.78 | 35.22 | Jerusalem
Bethlehem                    | 31.7  | 35.2  | Bethlehem
Qumran                       | 31.74 | 35.46 | Qumran
Nazareth                     | 32.7  | 35.3  | Nazareth
Lyon                         | 45.76 |  4.83 | Lyon
Mt Sinai                     | 28.54 | 33.97 | Mt Sinai
Mt Olympus                   | 40.09 | 22.35 | Mt Olympus
Delphi                       | 38.48 | 22.50 | Delphi
Eleusis                      | 38.04 | 23.54 | Eleusis
Florence                     | 43.77 | 11.25 | Florence
Wittenberg                   | 51.87 | 12.65 | Wittenberg
Geneva                       | 46.20 |  6.15 | Geneva
Safed                        | 32.97 | 35.50 | Safed
Vrindavan                    | 27.58 | 77.70 | Vrindavan
Ayodhya                      | 26.79 | 82.20 | Ayodhya
Varanasi                     | 25.32 | 83.01 | Varanasi
Bodh Gaya                    | 24.70 | 84.99 | Bodh Gaya
Lhasa                        | 29.65 | 91.13 | Lhasa
Kyoto                        | 35.01 | 135.77| Kyoto
Sana'a                       | 15.35 | 44.21 | Sana'a
Nag Hammadi                  | 26.05 | 32.25 | Nag Hammadi
Ras Shamra                   | 35.60 | 35.78 | Ras Shamra (Ugarit)
```

## Additions 2026-05-15 (geocoder coverage push)

Common modern countries + regions + cities flagged as misses in the geocoder
audit. Goal: lift overall geo coverage from 67% to >85%.

```
United States                | 39.83 | -98.58 | United States
United Kingdom               | 54.00 |  -2.00 | United Kingdom
Britain                      | 52.50 |  -1.50 | Britain
England                      | 52.40 |  -1.00 | England
Switzerland                  | 46.82 |   8.23 | Switzerland
Germany                      | 51.16 |  10.45 | Germany
France                       | 46.60 |   2.00 | France
Spain                        | 40.46 |  -3.75 | Spain
Italy                        | 42.50 |  12.50 | Italy
Italian peninsula            | 42.00 |  13.00 | Italian peninsula
Czechia                      | 49.82 |  15.47 | Czechia (Bohemia)
Bohemia                      | 50.10 |  14.50 | Bohemia
Roman Empire                 | 41.90 |  12.50 | Roman Empire (centered on Rome)
Roman Palestine              | 31.50 |  35.00 | Roman Palestine
Aegean / Mediterranean       | 38.00 |  23.00 | Aegean / Mediterranean
Aegean                       | 38.00 |  23.00 | Aegean
Mediterranean                | 36.00 |  18.00 | Mediterranean
South Asia                   | 20.00 |  78.00 | South Asia
Hindu diaspora               | 20.00 |  78.00 | Hindu diaspora (homeland India)
Pan-Christian                | 31.78 |  35.22 | Pan-Christian (origin Jerusalem)
Hawaiian Islands             | 20.80 |-157.00 | Hawaiian Islands
Württemberg                  | 48.78 |   9.18 | Württemberg
Castile                      | 40.10 |  -3.69 | Castile (central Spain)
Champagne                    | 48.90 |   4.40 | Champagne
Languedoc                    | 43.60 |   1.44 | Languedoc
Vienne                       | 45.52 |   4.87 | Vienne
Mediolanum                   | 45.46 |   9.19 | Mediolanum (Milan)
Milan                        | 45.46 |   9.19 | Milan
Caesarea Maritima            | 32.50 |  34.89 | Caesarea Maritima
Caesarea                     | 32.50 |  34.89 | Caesarea
Miletus                      | 37.53 |  27.28 | Miletus
Pergamon                     | 39.13 |  27.18 | Pergamon
Pergamum                     | 39.13 |  27.18 | Pergamum
Ebla                         | 35.80 |  36.80 | Ebla (Tell Mardikh)
Tell Mardikh                 | 35.80 |  36.80 | Tell Mardikh (Ebla)
Kashmir                      | 34.08 |  74.80 | Kashmir
Kashmir Valley               | 34.08 |  74.80 | Kashmir Valley
Hippo Regius                 | 36.91 |   7.76 | Hippo Regius
Roman North Africa           | 36.74 |   3.09 | Roman North Africa (Algiers approx.)
Anglophone                   | 51.50 |  -0.13 | Anglophone (London approx.)
Indian subcontinent          | 20.00 |  78.00 | Indian subcontinent
Yale                         | 41.31 | -72.93 | Yale (New Haven)
New York                     | 40.71 | -74.01 | New York
New Haven                    | 41.31 | -72.93 | New Haven
London                       | 51.51 |  -0.13 | London
Troyes                       | 48.30 |   4.08 | Troyes
Cantabria                    | 43.30 |  -4.00 | Cantabria
Kedu plain                   |  -7.61| 110.20 | Kedu plain (central Java)
Magelang                     |  -7.47| 110.22 | Magelang (central Java)
Sākala                       | 32.49 |  74.53 | Sākala (Sialkot, Pakistan)
Sialkot                      | 32.49 |  74.53 | Sialkot
Sri Lanka                    |  7.87 |  80.77 | Sri Lanka
Vienna                       | 48.21 |  16.37 | Vienna
Austria                      | 47.52 |  14.55 | Austria
Belgium                      | 50.50 |   4.47 | Belgium
Netherlands                  | 52.13 |   5.29 | Netherlands
Russia                       | 55.75 |  37.62 | Russia (Moscow)
Empire-wide                  | 41.90 |  12.50 | Empire-wide (Roman)
North India                  | 28.00 |  78.00 | North India
Northwest India              | 30.00 |  75.00 | Northwest India
Heavenly courts              | 31.78 |  35.22 | Heavenly courts (Jerusalem proxy)
Portugal                     | 39.55 |  -7.86 | Portugal
Lisbon                       | 38.72 |  -9.14 | Lisbon
Tomar                        | 39.60 |  -8.41 | Tomar (Order of Christ headquarters)
Coimbra                      | 40.21 |  -8.43 | Coimbra
Sintra                       | 38.80 |  -9.39 | Sintra
Alentejo                     | 38.00 |  -7.90 | Alentejo (Portugal)
Galicia                      | 42.80 |  -7.80 | Galicia (northwestern Iberia)
Morocco                      | 32.00 |  -5.00 | Morocco
Cape of Good Hope            | -34.36|  18.47 | Cape of Good Hope
Brazil                       | -14.24| -51.93 | Brazil
Outremer                     | 32.50 |  35.50 | Outremer (Crusader states, Holy Land)
Acre                         | 32.93 |  35.07 | Acre (Crusader port)
Hattin                       | 32.80 |  35.50 | Hattin (Galilee — Battle of Hattin 1187)
Goa                          | 15.49 |  73.82 | Goa (Portuguese Estado da India)
Bavaria                      | 48.79 |  11.50 | Bavaria
```

## Additions 2026-05-15 (sonnet-mani-soma-gandha-1 — Gandhāra geo entries)

```
Taxila                       | 33.74 |  72.84 | Taxila (ancient Gandhāran capital, Pakistan)
Peshawar                     | 34.01 |  71.57 | Peshawar (Gandhāra heartland, Pakistan)
Gandhara                     | 34.01 |  71.57 | Gandhāra (northwest Pakistan / eastern Afghanistan)
Balkh                        | 36.76 |  66.90 | Balkh (Bactria, northern Afghanistan)
Seleucia-Ctesiphon           | 33.09 |  44.58 | Seleucia-Ctesiphon (Sasanian capital, Iraq)
Gundeshapur                  | 32.28 |  48.52 | Gundeshapur (Sasanian academy city; Mani executed here)
Paray-le-Monial              | 46.45 |   4.12 | Paray-le-Monial (Sacred Heart visions of Margaret Mary Alacoque)
```
