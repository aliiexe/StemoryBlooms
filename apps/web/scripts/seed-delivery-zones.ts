import { db, deliveryZone } from '@stemory/database';
import crypto from 'crypto';

const rawData = `
Casablanca 20 DH 24h 0 DH 0 DH
Agadir 35 DH 24h - 48h 0 DH 0 DH
Ain Harrouda 35 DH 24h - 48h 0 DH 0 DH
Aït Melloul 35 DH 24h - 48h 0 DH 0 DH
Beni Mellal 35 DH 24h - 48h 0 DH 0 DH
Benslimane 35 DH 24h - 48h 0 DH 0 DH
Berrechid 35 DH 24h - 48h 0 DH 0 DH
Bni yakhlef 35 DH 24h - 48h 0 DH 0 DH
Bouskoura-Centre 35 DH 24h 0 DH 0 DH
Bouskoura-Ouled Saleh 35 DH 24h 0 DH 0 DH
Bouskoura-Ville Verte 35 DH 24h 0 DH 0 DH
Bouznika 35 DH 24h - 72h 0 DH 0 DH
Chellalat Mohammedia 35 DH 24h - 48h 0 DH 0 DH
Dar Bouaza 35 DH 24h - 48h 0 DH 0 DH
Deroua 35 DH 24h - 48h 0 DH 0 DH
El jadida 35 DH 24h - 48h 0 DH 0 DH
El Mansouria 35 DH 24h - 72h 0 DH 0 DH
Errahma 35 DH 24h - 48h 0 DH 0 DH
Essaouira 35 DH 24h - 72h 0 DH 0 DH
Fes 35 DH 24h - 48h 0 DH 0 DH
Had Soualem 35 DH 24h - 48h 0 DH 0 DH
Inzegane 35 DH 24h - 48h 0 DH 0 DH
Kenitra 35 DH 24h - 48h 0 DH 0 DH
Khouribga 35 DH 24h - 48h 0 DH 0 DH
Marrakech 35 DH 24h - 48h 0 DH 0 DH
Mediouna 35 DH 24h - 48h 0 DH 0 DH
Meknes 35 DH 24h - 48h 0 DH 0 DH
Mohammedia 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Al Massira 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Al Wahda 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Alia 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Hassania 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Hay Wafa 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Kasbah 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Nassim 35 DH 24h - 48h 0 DH 0 DH
Mohammedia - Parc 35 DH 24h - 48h 0 DH 0 DH
Nador 35 DH 24h - 48h 0 DH 0 DH
Nouacer 35 DH 24h - 48h 0 DH 0 DH
Oujda 35 DH 24h - 48h 0 DH 0 DH
Oulad Azzouz Dar 16 35 DH 24h - 48h 0 DH 0 DH
Rabat 35 DH 24h 0 DH 0 DH
Safi 35 DH 24h - 48h 0 DH 0 DH
Sale 35 DH 24h - 48h 0 DH 0 DH
Settat 35 DH 24h - 72h 0 DH 0 DH
Sidi Bouzid ( safi ) 35 DH 24h - 48h 0 DH 0 DH
Sidi rahal 35 DH 24h - 48h 0 DH 0 DH
Tamaris 35 DH 24h - 48h 0 DH 0 DH
Tanger 35 DH 24h - 48h 0 DH 0 DH
Temara 35 DH 24h - 48h 0 DH 0 DH
Tikiwin 35 DH 24h - 48h 0 DH 0 DH
Tit Melil 35 DH 24h - 48h 0 DH 0 DH
zaer 35 DH 24h - 48h 0 DH 0 DH
Afourar 39 DH 24h - 72h 0 DH 0 DH
Afra 39 DH 24h - 72h 0 DH 0 DH
Aguelmous 39 DH 24h - 72h 0 DH 0 DH
Ain Attig 39 DH 24h - 48h 0 DH 0 DH
Ain chkaf 39 DH 24h - 72h 0 DH 0 DH
Ain El Aouda 39 DH 24h - 48h 0 DH 0 DH
Ait Amira 39 DH 24h - 72h 0 DH 0 DH
Aït Ishaq 39 DH 24h - 72h 0 DH 0 DH
Aknoul 39 DH 24h - 72h 0 DH 0 DH
Al Hoceima 39 DH 24h - 72h 0 DH 0 DH
Anza 39 DH 24h - 48h 0 DH 0 DH
Aourir "Région Agadir" 39 DH 24h - 48h 0 DH 0 DH
Assilah 39 DH 24h - 72h 0 DH 0 DH
Azemmour 39 DH 24h - 48h 0 DH 0 DH
Bab Berred 39 DH 24h - 72h 0 DH 0 DH
Bassatine El Menzeh 39 DH 24h - 48h 0 DH 0 DH
Bejaad 39 DH 24h - 72h 0 DH 0 DH
Ben Ahmed 39 DH 24h - 72h 0 DH 0 DH
Benguerir 39 DH 24h - 72h 0 DH 0 DH
Beni Ayat 39 DH 24h - 72h 0 DH 0 DH
Beni Ensar 39 DH 24h - 72h 0 DH 0 DH
Berkane 39 DH 24h - 48h 0 DH 0 DH
Biougra 39 DH 24h - 72h 0 DH 0 DH
Bouarg 39 DH 24h - 72h 0 DH 0 DH
Boujniba 39 DH 24h - 72h 0 DH 0 DH
Bounoir 39 DH 24h - 72h 0 DH 0 DH
Bradia 39 DH 24h - 72h 0 DH 0 DH
Cabo Negro 39 DH 24h - 72h 0 DH 0 DH
Chefchaouen 39 DH 24h - 48h 0 DH 0 DH
Chichaoua 39 DH 24h - 48h 0 DH 0 DH
Chtouka - région Agadir 39 DH 24h - 72h 0 DH 0 DH
Dakhla 39 DH 24h - 72h 0 DH 0 DH
Dar Essalam 39 DH 24h - 72h 0 DH 0 DH
Dar Ould Zidouh 39 DH 24h - 72h 0 DH 0 DH
Dcheira El Jihadia 39 DH 24h - 72h 0 DH 0 DH
Douar Lahna 39 DH 24h - 72h 0 DH 0 DH
Drarga 39 DH 24h - 48h 0 DH 0 DH
Echemmaia 39 DH 24h - 72h 0 DH 0 DH
El Gara 39 DH 24h - 48h 0 DH 0 DH
El Kelaa Des Sraghna 39 DH 24h - 72h 0 DH 0 DH
El-afak 39 DH 24h - 48h 0 DH 0 DH
Fnideq 39 DH 24h - 72h 0 DH 0 DH
Foum Oudi 39 DH 24h - 72h 0 DH 0 DH
Ghazoua 39 DH 24h - 72h 0 DH 0 DH
Guelmim 39 DH 24h - 72h 0 DH 0 DH
Guercif 39 DH 24h - 72h 0 DH 0 DH
Had Boumoussa 39 DH 24h - 72h 0 DH 0 DH
Harbile 39 DH 24h - 72h 0 DH 0 DH
Harhoura 39 DH 24h - 48h 0 DH 0 DH
Hettan 39 DH 24h - 72h 0 DH 0 DH
Ighrem Laâlam 39 DH 24h - 72h 0 DH 0 DH
Jaadar 39 DH 24h - 72h 0 DH 0 DH
Kasba Tadla 39 DH 24h - 72h 0 DH 0 DH
Khemis Des Zemamra 39 DH 24h - 48h 0 DH 0 DH
Khemisset 39 DH 24h - 72h 0 DH 0 DH
Khenifra 39 DH 24h - 72h 0 DH 0 DH
Ksar El Kebir 39 DH 24h - 72h 0 DH 0 DH
Laarache 39 DH 24h - 48h 0 DH 0 DH
Laattaouia 39 DH 24h - 72h 0 DH 0 DH
Laayayta 39 DH 24h - 72h 0 DH 0 DH
Laâyoune 39 DH 24h - 72h 0 DH 0 DH
Leqliaa 39 DH 24h - 72h 0 DH 0 DH
Loudaya 39 DH 24h - 72h 0 DH 0 DH
Madagh 39 DH 24h - 72h 0 DH 0 DH
Martil 39 DH 24h - 48h 0 DH 0 DH
Mdiq 39 DH 24h - 72h 0 DH 0 DH
Mehdia 39 DH 24h - 48h 0 DH 0 DH
Mers El Kheir 39 DH 24h - 48h 0 DH 0 DH
Moulay Abdellah 39 DH 24h - 48h 0 DH 0 DH
Moulay Yâcoub 39 DH 24h - 72h 0 DH 0 DH
Mrirt 39 DH 24h - 72h 0 DH 0 DH
Oualidia 39 DH 24h - 48h 0 DH 0 DH
Ouaouizeght 39 DH 24h - 72h 0 DH 0 DH
Ouarzazate 39 DH 24h - 72h 0 DH 0 DH
Oued Amlil 39 DH 24h - 72h 0 DH 0 DH
Oued Zem 39 DH 24h - 48h 0 DH 0 DH
Oulad Ali 39 DH 24h - 72h 0 DH 0 DH
Oulad Ayad 39 DH 24h - 72h 0 DH 0 DH
Oulad M'barek 39 DH 24h - 72h 0 DH 0 DH
Oulad Tayeb 39 DH 24h - 72h 0 DH 0 DH
Oulad Teima 39 DH 24h - 72h 0 DH 0 DH
Oulad Yaich 39 DH 24h - 72h 0 DH 0 DH
Oulad Youssef 39 DH 24h - 72h 0 DH 0 DH
Oulad Zmam 39 DH 24h - 72h 0 DH 0 DH
Ras El Ma - Cap de l'eau 39 DH 24h - 72h 0 DH 0 DH
Rencon 39 DH 24h - 72h 0 DH 0 DH
Rommani 39 DH 24h - 72h 0 DH 0 DH
Saidia 39 DH 24h - 72h 0 DH 0 DH
Saiss 39 DH 24h - 72h 0 DH 0 DH
Sala El Jadida 39 DH 24h - 48h 0 DH 0 DH
Sebt Gzoula 39 DH 24h - 48h 0 DH 0 DH
Selouane 39 DH 24h - 72h 0 DH 0 DH
Sidi Aïssa 39 DH 24h - 72h 0 DH 0 DH
Sidi Bennour 39 DH 24h - 48h 0 DH 0 DH
Sidi Bouknadel 39 DH 24h - 48h 0 DH 0 DH
Sidi Bouzid ( el jadida ) 39 DH 24h - 48h 0 DH 0 DH
Sidi Hrazem 39 DH 24h - 72h 0 DH 0 DH
Sidi Jaber 39 DH 24h - 72h 0 DH 0 DH
Skhirat 39 DH 24h - 48h 0 DH 0 DH
Skhour Rehamna 39 DH 24h - 72h 0 DH 0 DH
Souira Guedima 39 DH 24h - 48h 0 DH 0 DH
Souk Sebt 39 DH 24h - 72h 0 DH 0 DH
Tagzirt 39 DH 24h - 72h 0 DH 0 DH
Tahanaout 39 DH 24h - 72h 0 DH 0 DH
Tamansourt 39 DH 24h - 48h 0 DH 0 DH
Tamellalt 39 DH 24h - 72h 0 DH 0 DH
Tamesna 39 DH 24h - 48h 0 DH 0 DH
Taounate 39 DH 24h - 72h 0 DH 0 DH
Tarast 39 DH 24h - 72h 0 DH 0 DH
Taroudant 39 DH 24h - 72h 0 DH 0 DH
Taza 39 DH 24h - 72h 0 DH 0 DH
Temsia 39 DH 24h - 72h 0 DH 0 DH
Tetouan 39 DH 24h - 48h 0 DH 0 DH
Tiflet 39 DH 24h - 72h 0 DH 0 DH
Tighassaline 39 DH 24h - 72h 0 DH 0 DH
Timoulilt 39 DH 24h - 72h 0 DH 0 DH
Tiznit 39 DH 24h - 72h 0 DH 0 DH
Tlat Bouguedra 39 DH 24h - 48h 0 DH 0 DH
Tssoultante 39 DH 24h - 72h 0 DH 0 DH
Youssoufia 39 DH 24h - 72h 0 DH 0 DH
Zaouiat Cheikh 39 DH 24h - 72h 0 DH 0 DH
Zeghanghane 39 DH 24h - 72h 0 DH 0 DH
Achakkar 45 DH 24h - 48h 0 DH 0 DH
Afsou ( nador ) 45 DH 24h - 72h 0 DH 0 DH
Agdz (zagoura) 45 DH 24h - 72h 0 DH 0 DH
Agouidir 45 DH 24h - 72h 0 DH 0 DH
Agouim 45 DH 24h - 72h 0 DH 0 DH
Agourai 45 DH 24h - 72h 0 DH 0 DH
Ahejarr Ennehal 45 DH 24h - 72h 0 DH 0 DH
Ahfir 45 DH 24h - 72h 0 DH 0 DH
Ain Aicha 45 DH 24h - 72h 0 DH 0 DH
Aïn Erreggada 45 DH 24h - 72h 0 DH 0 DH
Ain Lahcen 45 DH 24h - 72h 0 DH 0 DH
Ain Leuh 45 DH 24h - 72h 0 DH 0 DH
Ain Mediouna 45 DH 24h - 72h 0 DH 0 DH
Ain Taoujdate 45 DH 24h - 72h 0 DH 0 DH
Aïn-Béni-Mathar 45 DH 24h - 72h 0 DH 0 DH
Ain-Cheggag 45 DH 24h - 72h 0 DH 0 DH
Ait Aiaaza 45 DH 24h - 72h 0 DH 0 DH
Ait Aissa Ou Brahim 45 DH 24h - 72h 0 DH 0 DH
Aït Ben Haddou 45 DH 24h - 72h 0 DH 0 DH
Ait Boudaoud 45 DH 24h - 72h 0 DH 0 DH
Ait Daoud 45 DH 24h - 72h 0 DH 0 DH
Ait hadi 45 DH 24h - 72h 0 DH 0 DH
Ait ourir 45 DH 24h - 72h 0 DH 0 DH
Ait Sedrate Sahl Gharbia 45 DH 24h - 72h 0 DH 0 DH
Aït Tarzout 45 DH 24h - 72h 0 DH 0 DH
Ait-Kamara 45 DH 24h - 72h 0 DH 0 DH
Ajdir ( al hoceima ) 45 DH 24h - 72h 0 DH 0 DH
Aklim 45 DH 24h - 72h 0 DH 0 DH
Al Aaroui 45 DH 24h - 72h 0 DH 0 DH
Alnif 45 DH 24h - 72h 0 DH 0 DH
Alouidane 45 DH 24h - 72h 0 DH 0 DH
Amerzgane 45 DH 24h - 72h 0 DH 0 DH
Anzal 45 DH 24h - 72h 0 DH 0 DH
Aoufous 45 DH 24h - 72h 0 DH 0 DH
Aoulouz 45 DH 24h - 72h 0 DH 0 DH
Aquermoud 45 DH 24h - 48h 0 DH 0 DH
Arfoud 45 DH 24h - 72h 0 DH 0 DH
Asni 45 DH 24h - 72h 0 DH 0 DH
Assa 45 DH 24h - 72h 0 DH 0 DH
Assahrij 45 DH 24h - 72h 0 DH 0 DH
Ayt Ihya 45 DH 24h - 72h 0 DH 0 DH
Azilal 45 DH 24h - 72h 0 DH 0 DH
Azla 45 DH 24h - 72h 0 DH 0 DH
Azrou "Région d'Agadir" 45 DH 24h - 48h 0 DH 0 DH
Azrou "Région de Fès-Meknès" 45 DH 24h - 72h 0 DH 0 DH
Bab Marzouka 45 DH 24h - 72h 0 DH 0 DH
Bab Taza 45 DH 24h - 72h 0 DH 0 DH
Bani Walid 45 DH 24h - 72h 0 DH 0 DH
Belaaguid 45 DH 24h - 48h 0 DH 0 DH
Belfaa 45 DH 24h - 72h 0 DH 0 DH
Belyounech 45 DH 24h - 72h 0 DH 0 DH
Ben Karrich 45 DH 24h - 72h 0 DH 0 DH
Ben Rahmoun 45 DH 24h - 72h 0 DH 0 DH
Ben Taieb 45 DH 24h - 72h 0 DH 0 DH
Beni Chiker 45 DH 24h - 72h 0 DH 0 DH
Beni Drar 45 DH 24h - 72h 0 DH 0 DH
Beni Hassane 45 DH 24h - 72h 0 DH 0 DH
Beni Sidal Jbel 45 DH 24h - 72h 0 DH 0 DH
Beni zoli 45 DH 24h - 72h 0 DH 0 DH
Bir Jdid 45 DH 24h - 72h 0 DH 0 DH
Birkouate 45 DH 24h - 72h 0 DH 0 DH
Bleida 45 DH 24h - 72h 0 DH 0 DH
Bni Ahmed Cherqia 45 DH 24h - 72h 0 DH 0 DH
Bni Bouayach 45 DH 24h - 72h 0 DH 0 DH
Bni Boufrah 45 DH 24h - 48h 0 DH 0 DH
Bni Hadifa 45 DH 24h - 72h 0 DH 0 DH
Bouaboud 45 DH 24h - 72h 0 DH 0 DH
Bouârfa 45 DH 24h - 72h 0 DH 0 DH
Bouderbala 45 DH 24h - 72h 0 DH 0 DH
Boudinar 45 DH 24h - 72h 0 DH 0 DH
Boufakrane 45 DH 24h - 48h 0 DH 0 DH
Boughriba 45 DH 24h - 72h 0 DH 0 DH
Bouhouda 45 DH 24h - 72h 0 DH 0 DH
Boujdour 45 DH 24h - 72h 0 DH 0 DH
Boukidaren 45 DH 24h - 72h 0 DH 0 DH
Boulman 45 DH 24h - 72h 0 DH 0 DH
Boumalen dades 45 DH 24h - 72h 0 DH 0 DH
Boumia 45 DH 24h - 72h 0 DH 0 DH
Boured 45 DH 24h - 72h 0 DH 0 DH
Chrifia 45 DH 24h - 72h 0 DH 0 DH
Chwiter 45 DH 24h - 72h 0 DH 0 DH
Dar-El Kebdani 45 DH 24h - 72h 0 DH 0 DH
Demnate 45 DH 24h - 72h 0 DH 0 DH
Dlalha 45 DH 24h - 72h 0 DH 0 DH
Douar laarab ( essaouira ) 45 DH 24h - 72h 0 DH 0 DH
Driouch 45 DH 24h - 72h 0 DH 0 DH
El Aarjate 45 DH 24h - 72h 0 DH 0 DH
El Aïoun Charqiya 45 DH 24h - 72h 0 DH 0 DH
El Borouj "Région de Settat" 45 DH 24h - 48h 0 DH 0 DH
El Hajeb 45 DH 24h - 48h 0 DH 0 DH
El Haouzia ( el jadida ) 45 DH 24h - 48h 0 DH 0 DH
El Jebeha 45 DH 24h - 72h 0 DH 0 DH
El Kebab 45 DH 24h - 72h 0 DH 0 DH
El Ksiba 45 DH 24h - 72h 0 DH 0 DH
Errachidia 45 DH 24h - 72h 0 DH 0 DH
Er-Rich 45 DH 24h - 72h 0 DH 0 DH
Errouha 45 DH 24h - 72h 0 DH 0 DH
Essemara 45 DH 24h - 72h 0 DH 0 DH
farkhana 45 DH 24h - 48h 0 DH 0 DH
Fezouata 45 DH 24h - 72h 0 DH 0 DH
Figuig 45 DH 24h - 72h 0 DH 0 DH
Fquih Ben Salah 45 DH 24h - 72h 0 DH 0 DH
Fricha 45 DH 24h - 72h 0 DH 0 DH
Galaz 45 DH 24h - 48h 0 DH 0 DH
Ghafsai 45 DH 24h - 72h 0 DH 0 DH
Goulmima 45 DH 24h - 72h 0 DH 0 DH
Gueznaia 45 DH 24h - 72h 0 DH 0 DH
Guisser 45 DH 24h - 48h 0 DH 0 DH
Had Draa 45 DH 24h - 72h 0 DH 0 DH
Haj Kaddour 45 DH 24h - 72h 0 DH 0 DH
Hajria Ouled Daoud 45 DH 24h - 72h 0 DH 0 DH
Ifran 45 DH 24h - 72h 0 DH 0 DH
Ighoud 45 DH 24h - 72h 0 DH 0 DH
Ighrem N'ougdal 45 DH 24h - 72h 0 DH 0 DH
Imi Ouaddar 45 DH 24h - 72h 0 DH 0 DH
Imintanout 45 DH 24h - 72h 0 DH 0 DH
Imouzzer du Kandar 45 DH 24h - 72h 0 DH 0 DH
Imzouren 45 DH 24h - 72h 0 DH 0 DH
Issaguen 45 DH 24h - 72h 0 DH 0 DH
Jamaat Shaim 45 DH 24h - 48h 0 DH 0 DH
Jebila 45 DH 24h - 72h 0 DH 0 DH
Jerada 45 DH 24h - 72h 0 DH 0 DH
Jorf El Melha 45 DH 24h - 72h 0 DH 0 DH
KAA ASRASS 45 DH 24h - 72h 0 DH 0 DH
Kariat Arekmane 45 DH 24h - 72h 0 DH 0 DH
Kariat Ba Mohamed 45 DH 24h - 72h 0 DH 0 DH
Kassita 45 DH 24h - 72h 0 DH 0 DH
Kelaat M'Gouna 45 DH 24h - 72h 0 DH 0 DH
Khandagour 45 DH 24h - 72h 0 DH 0 DH
Khemis du Sahel 45 DH 24h - 72h 0 DH 0 DH
Khenichet 45 DH 24h - 72h 0 DH 0 DH
Khlalfa 45 DH 24h - 72h 0 DH 0 DH
Ksar Sghir 45 DH 24h - 72h 0 DH 0 DH
Laaouamera 45 DH 24h - 72h 0 DH 0 DH
Lagfifat 45 DH 24h - 72h 0 DH 0 DH
Lahbichat 45 DH 24h - 72h 0 DH 0 DH
Lalla Mimouna 45 DH 24h - 72h 0 DH 0 DH
Loulad 45 DH 24h - 72h 0 DH 0 DH
Mariouari 45 DH 24h - 72h 0 DH 0 DH
Marnissa 45 DH 24h - 72h 0 DH 0 DH
Massa 45 DH 24h - 72h 0 DH 0 DH
Mechra Bel Ksiri 45 DH 24h - 72h 0 DH 0 DH
Mejat "Région de Fès-Meknès" 45 DH 24h - 48h 0 DH 0 DH
Mejjat - Région de Marrakech 45 DH 24h - 72h 0 DH 0 DH
Melloussa 45 DH 24h - 72h 0 DH 0 DH
Merzouga 45 DH 24h - 72h 0 DH 0 DH
Meskala 45 DH 24h - 72h 0 DH 0 DH
Messawerr Rasso 45 DH 24h - 48h 0 DH 0 DH
M'Hamid El Ghizlane 45 DH 24h - 72h 0 DH 0 DH
M'haya 45 DH 24h - 72h 0 DH 0 DH
Midar 45 DH 24h - 72h 0 DH 0 DH
Midelt 45 DH 24h - 72h 0 DH 0 DH
Mirleft 45 DH 24h - 72h 0 DH 0 DH
Missour 45 DH 24h - 72h 0 DH 0 DH
Mnar 45 DH 24h - 72h 0 DH 0 DH
Moulay Bousselham 45 DH 24h - 72h 0 DH 0 DH
Moulay Idriss zerhouni 45 DH 24h - 72h 0 DH 0 DH
Msemrir 45 DH 24h - 72h 0 DH 0 DH
Mzoudia 45 DH 24h - 72h 0 DH 0 DH
Nkoub 45 DH 24h - 72h 0 DH 0 DH
Ouahat Sidi Brahim 45 DH 24h - 72h 0 DH 0 DH
Ouazzane 45 DH 24h - 72h 0 DH 0 DH
Oued laou 45 DH 24h - 72h 0 DH 0 DH
Ouislane 45 DH 24h - 48h 0 DH 0 DH
Oulad Abbou 45 DH 24h - 48h 0 DH 0 DH
Oulad Amrane "Région El Jadida" 45 DH 24h - 48h 0 DH 0 DH
Oulad Berhil 45 DH 24h - 72h 0 DH 0 DH
Oulad Frej 45 DH 24h - 48h 0 DH 0 DH
Oulad Said "Région de Settat" 45 DH 24h - 48h 0 DH 0 DH
Ouled Dahhou 45 DH 24h - 72h 0 DH 0 DH
Ouled Hassoune 45 DH 24h - 72h 0 DH 0 DH
Ouled Moumna 45 DH 24h - 72h 0 DH 0 DH
Ouled Settout 45 DH 24h - 72h 0 DH 0 DH
Oulmès 45 DH 24h - 72h 0 DH 0 DH
Ounagha 45 DH 24h - 72h 0 DH 0 DH
Ourika 45 DH 24h - 72h 0 DH 0 DH
Ourtzagh 45 DH 24h - 72h 0 DH 0 DH
Outat El Haj 45 DH 24h - 72h 0 DH 0 DH
Ras El Ain "Région de Settat" 45 DH 24h - 48h 0 DH 0 DH
Rissani 45 DH 24h - 72h 0 DH 0 DH
Sakia El hamra 45 DH 24h - 72h 0 DH 0 DH
Sebt Ben Sassi 45 DH 24h - 72h 0 DH 0 DH
Sebt El Guerdane 45 DH 24h - 72h 0 DH 0 DH
Sebt Jahjouhe 45 DH 24h - 72h 0 DH 0 DH
Sebt Oulad Nemma 45 DH 24h - 72h 0 DH 0 DH
Sefrou 45 DH 24h - 72h 0 DH 0 DH
Sid L'Mokhtar 45 DH 24h - 72h 0 DH 0 DH
Sidi Abdellah Ghiyat 45 DH 24h - 72h 0 DH 0 DH
Sidi Addi 45 DH 24h - 72h 0 DH 0 DH
Sidi Allal El Bahraoui 45 DH 24h - 72h 0 DH 0 DH
Sidi Allal Tazi 45 DH 24h - 72h 0 DH 0 DH
Sidi Bibi 45 DH 24h - 72h 0 DH 0 DH
Sidi Bou Othmane 45 DH 24h - 72h 0 DH 0 DH
Sidi bou zid Chichaoua 45 DH 24h - 72h 0 DH 0 DH
Sidi chiker 45 DH 24h - 72h 0 DH 0 DH
Sidi El Ayedi 45 DH 24h - 48h 0 DH 0 DH
Sidi Hajjaj "Région de Settat" 45 DH 24h - 48h 0 DH 0 DH
Sidi Hssain 45 DH 24h - 72h 0 DH 0 DH
Sidi Ifni 45 DH 24h - 72h 0 DH 0 DH
Sidi Kacem 45 DH 24h - 72h 0 DH 0 DH
Sidi Kaouki 45 DH 24h - 72h 0 DH 0 DH
Sidi Moussa "Région de Marrakech" 45 DH 24h - 72h 0 DH 0 DH
Sidi Slimane 45 DH 24h - 72h 0 DH 0 DH
Sidi Smaïl 45 DH 24h - 48h 0 DH 0 DH
Sidi Taibi 45 DH 24h - 72h 0 DH 0 DH
Sidi Yahya El Gharb 45 DH 24h - 72h 0 DH 0 DH
Sidi Zouine 45 DH 24h - 72h 0 DH 0 DH
Skhinate 45 DH 24h - 72h 0 DH 0 DH
Skoura 45 DH 24h - 72h 0 DH 0 DH
Smimou 45 DH 24h - 72h 0 DH 0 DH
Souihla 45 DH 24h - 72h 0 DH 0 DH
Souk El Arbaa Du Gharb 45 DH 24h - 72h 0 DH 0 DH
Stehat 45 DH 24h - 72h 0 DH 0 DH
Tabounte Ouarzazate 45 DH 24h - 72h 0 DH 0 DH
Tabourahte 45 DH 24h - 72h 0 DH 0 DH
Tafersit 45 DH 24h - 72h 0 DH 0 DH
Tafetachte 45 DH 24h - 72h 0 DH 0 DH
Taghazout 45 DH 24h - 72h 0 DH 0 DH
Taghbalt 45 DH 24h - 72h 0 DH 0 DH
Tagounite 45 DH 24h - 72h 0 DH 0 DH
Tahla 45 DH 24h - 72h 0 DH 0 DH
Taliouine 45 DH 24h - 72h 0 DH 0 DH
Talmest 45 DH 24h - 72h 0 DH 0 DH
Tamanar 45 DH 24h - 72h 0 DH 0 DH
Tamegroute 45 DH 24h - 72h 0 DH 0 DH
Tameslouht 45 DH 24h - 72h 0 DH 0 DH
Tamezmoute 45 DH 24h - 72h 0 DH 0 DH
Tamraght 45 DH 24h - 72h 0 DH 0 DH
Tamsamane 45 DH 24h - 72h 0 DH 0 DH
Tansifte 45 DH 24h - 72h 0 DH 0 DH
Tan-Tan 45 DH 24h - 72h 0 DH 0 DH
Taourirt 45 DH 24h - 72h 0 DH 0 DH
Targuist 45 DH 24h - 72h 0 DH 0 DH
Tata 45 DH 24h - 72h 0 DH 0 DH
Tazarine 45 DH 24h - 72h 0 DH 0 DH
Taznakht 45 DH 24h - 72h 0 DH 0 DH
Telat Azlaf 45 DH 24h - 72h 0 DH 0 DH
Tendrara 45 DH 24h - 72h 0 DH 0 DH
Ternata 45 DH 24h - 72h 0 DH 0 DH
Tiddas 45 DH 24h - 72h 0 DH 0 DH
Tidzi 45 DH 24h - 72h 0 DH 0 DH
Timahdite 45 DH 24h - 72h 0 DH 0 DH
Timedline 45 DH 24h - 72h 0 DH 0 DH
Timezgadiouine 45 DH 24h - 48h 0 DH 0 DH
Tinejdad 45 DH 24h - 72h 0 DH 0 DH
Tinghir 45 DH 24h - 72h 0 DH 0 DH
Tinzouline 45 DH 24h - 72h 0 DH 0 DH
Tissa 45 DH 24h - 72h 0 DH 0 DH
Tizi Ouasli 45 DH 24h - 72h 0 DH 0 DH
Tiztoutine 45 DH 24h - 72h 0 DH 0 DH
Tleta-El Henchane 45 DH 24h - 72h 0 DH 0 DH
Touima 45 DH 24h - 48h 0 DH 0 DH
Zagoura 45 DH 24h - 72h 0 DH 0 DH
Zaida 45 DH 24h - 72h 0 DH 0 DH
Zaio 45 DH 24h - 72h 0 DH 0 DH
Zouada 45 DH 24h - 72h 0 DH 0 DH
`.trim();

async function main() {
  console.log('Starting delivery zones seeding...');
  
  // Parse data
  const lines = rawData.split('\n');
  const zones: { id: string, name: string, fee: number, deliveryTime: string, updatedAt: Date }[] = [];
  
  for (const line of lines) {
    if (!line) continue;
    // Format: CityName 35 DH 24h - 48h 0 DH 0 DH
    // Regex to capture city name, fee, and delivery time
    const match = line.match(/(.*?)\s+(\d+)\s+DH\s+(.*?)\s+0\s+DH\s+0\s+DH/);
    if (match) {
      const name = match[1].trim();
      const fee = parseInt(match[2], 10);
      const deliveryTime = match[3].trim();
      
      zones.push({
        id: crypto.randomUUID(),
        name,
        fee,
        deliveryTime,
        updatedAt: new Date()
      });
    }
  }

  console.log(`Found ${zones.length} delivery zones.`);

  // Clear existing zones
  console.log('Clearing existing delivery zones...');
  await db.delete(deliveryZone);

  // Insert new zones in chunks
  console.log('Inserting new zones...');
  for (let i = 0; i < zones.length; i += 50) {
    const chunk = zones.slice(i, i + 50);
    await db.insert(deliveryZone).values(chunk);
    console.log(`Inserted ${i + chunk.length} / ${zones.length}`);
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
