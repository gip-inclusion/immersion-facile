import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("public_appellations_data", {
    legacy_code_rome_v3: {
      type: "char(5)",
      references: "public_romes_data(code_rome)",
      notNull: false,
    },
  });

  // insert data from ROME 3 that is missing in migrations table (updated later probably)
  // inserting them if they are missing, do nothing otherwise
  await pgm.db.query(`
    INSERT INTO public_romes_data (code_rome, libelle_rome, libelle_rome_tsvector)
    VALUES
      ('G1216', 'Moniteur / Monitrice de sport nature', '''moniteur'':1 ''monitric'':2 ''natur'':5 ''sport'':4'),
      ('K1309', 'Accueillant familial / Accueillante familiale auprès d''enfants', '''accueil'':1,3 ''aupres'':5 ''enfant'':7 ''familial'':2,4'),
      ('C1112', 'Agent général / Agente générale d''assurance', '''agent'':1,3 ''assur'':6 ''général'':2,4'),
      ('K1308', 'Agent territorial spécialisé / Agente territoriale spécialisée des écoles maternelles (ATSEM)', '''agent'':1,4 ''atsem'':10 ''maternel'':9 ''spécialis'':3,6 ''territorial'':2,5 ''écol'':8'),
      ('G1607', 'Employé / Employée de restauration collective', '''collect'':5 ''emploi'':1,2 ''restaur'':4'),
      ('K2113', 'Accompagnant / Accompagnante des élèves en situation de handicap (AESH)', '''accompagn'':1,2 ''aesh'':9 ''handicap'':8 ''situat'':6 ''élev'':4'),
      ('F1109', 'Assistant / Assistante géomètre', '''assist'':1,2 ''géometr'':3'),
      ('G1208', 'Entraîneur / Entraîneure de sport professionnel et de haut niveau', '''entraîneur'':1,2 ''haut'':8 ''niveau'':9 ''professionnel'':5 ''sport'':4'),
      ('G1209', 'Animateur / Animatrice de loisirs sportifs', '''anim'':1,2 ''loisir'':4 ''sportif'':5'),
      ('F1615', 'Poseur / Poseuse de cloisons démontables et mobiles', '''cloison'':4 ''démont'':5 ''mobil'':7 ''poseur'':1 ''poseux'':2'),
      ('F1616', 'Poseur / Poseuse de menuiseries extérieures', '''extérieur'':5 ''menuiser'':4 ''poseur'':1 ''poseux'':2'),
      ('F1617', 'Poseur / Poseuse de véranda', '''poseur'':1 ''poseux'':2 ''vérand'':4'),
      ('F1618', 'Poseur / Poseuse de façade vitrée', '''façad'':4 ''poseur'':1 ''poseux'':2 ''vitr'':5'),
      ('F1614', 'Poseur / Poseuse en fermetures de bâtiment', '''bât'':6 ''fermetur'':4 ''poseur'':1 ''poseux'':2'),
      ('D1409', 'Assistant / Assistante administration des ventes', '''administr'':3 ''assist'':1,2 ''vent'':5'),
      ('G1211', 'Analyste de la performance sportive', '''analyst'':1 ''perform'':4 ''sportiv'':5'),
      ('A1102', 'Conducteur / Conductrice d''engins d''exploitation forestière', '''conducteur'':1 ''conductric'':2 ''engin'':4 ''exploit'':6 ''foresti'':7'),
      ('A1304', 'Conseiller / Conseillère technique agricole', '''agricol'':4 ''conseil'':1 ''conseiller'':2 ''techniqu'':3'),
      ('F1707', 'Maçon / Maçonne du paysage', '''maçon'':1,2 ''paysag'':4'),
      ('A1418', 'Viticulteur / Viticultrice', '''viticulteur'':1 ''viticultric'':2'),
      ('F1708', 'Installateur-poseur / Installatrice-poseuse de piscines préfabriquées', '''install'':2,5 ''installateur-poseur'':1 ''installatrice-pos'':4 ''piscin'':8 ''poseur'':3 ''poseux'':6 ''préfabriqu'':9'),
      ('A1419', 'Ouvrier agricole polyvalent / Ouvrière agricole polyvalente', '''agricol'':2,5 ''ouvri'':1,4 ''polyvalent'':3,6'),
      ('A1420', 'Chef / Cheffe de culture responsable d''unité de production agricole', '''agricol'':10 ''chef'':1 ''cheff'':2 ''cultur'':4 ''product'':9 ''respons'':5 ''unit'':7'),
      ('A1421', 'Palefrenier soigneur / Palefrenière soigneuse', '''palefreni'':1,3 ''soigneur'':2 ''soigneux'':4'),
      ('G1210', 'Enseignant / Enseignante d''équitation', '''enseign'':1,2 ''équit'':4'),
      ('D1410', 'Attaché commercial / Attachée commerciale', '''attach'':1,3 ''commercial'':2,4'),
      ('D1510', 'Chef / Cheffe de secteur commercial', '''chef'':1 ''cheff'':2 ''commercial'':5 ''secteur'':4'),
      ('F1111', 'Ingénieur / Ingénieure génie civil', '''civil'':4 ''gen'':3 ''ingénieur'':1,2'),
      ('K1307', 'Animateur / Animatrice petite enfance', '''anim'':1,2 ''enfanc'':4 ''petit'':3'),
      ('M1405', 'Data scientist', '''dat'':1 ''scientist'':2'),
      ('M1811', 'Data engineer', '''dat'':1 ''engine'':2'),
      ('M1812', 'Responsable de la Sécurité des Systèmes d''Information (RSSI)', '''inform'':8 ''respons'':1 ''rssi'':9 ''system'':6 ''sécur'':4'),
      ('G1212', 'Animateur socio-sportif / Animatrice socio-sportive', '''anim'':1,5 ''socio'':3,7 ''socio-sport'':2,6 ''sportif'':4 ''sportiv'':8'),
      ('M1813', 'Intégrateur / Intégratrice logiciels métiers', '''integr'':1,2 ''logiciel'':3 ''méti'':4'),
      ('G1213', 'Chargé / Chargée de développement d''activités sportives', '''activ'':6 ''charg'':1,2 ''développ'':4 ''sportiv'':7'),
      ('B1612', 'Concepteur / Conceptrice numérique en bijouterie joaillerie', '''bijouter'':5 ''concepteur'':1 ''conceptric'':2 ''joailler'':6 ''numer'':3'),
      ('G1405', 'Directeur / Directrice de structure sportive', '''directeur'':1 ''directric'':2 ''sportiv'':5 ''structur'':4'),
      ('F1113', 'Chargé / Chargée d''affaires en rénovation énergétique', '''affair'':4 ''charg'':1,2 ''rénov'':6 ''énerget'':7'),
      ('F1114', 'Conseiller / Conseillère en rénovation énergétique', '''conseil'':1 ''conseiller'':2 ''rénov'':4 ''énerget'':5'),
      ('F1620', 'Installateur / Installatrice chauffage et climatisation', '''chauffag'':3 ''climatis'':5 ''install'':1,2'),
      ('G1608', 'Ecailler / Ecaillère', '''ecaill'':1 ''ecailler'':2'),
      ('H1211', 'Attaché / Attachée de recherche clinique (ARC)', '''arc'':6 ''attach'':1,2 ''cliniqu'':5 ''recherch'':4'),
      ('H1507', 'Chargé / Chargée des affaires réglementaires', '''affair'':4 ''charg'':1,2 ''réglementair'':5'),
      ('H2103', 'Opérateur / Opératrice de transformation des viandes', '''oper'':1,2 ''transform'':4 ''viand'':6'),
      ('G1214', 'Directeur sportif / Directrice sportive', '''directeur'':1 ''directric'':3 ''sportif'':2 ''sportiv'':4'),
      ('G1207', 'Surveillant / Surveillante de baignade', '''baignad'':4 ''surveil'':1,2'),
      ('C1111', 'Mandataire en assurance', '''assur'':3 ''mandatair'':1'),
      ('E1206', 'UX - UI Designer', '''design'':3 ''ui'':2 ''ux'':1'),
      ('F1619', 'Couvreur / Couvreuse', '''couvreur'':1 ''couvreux'':2'),
      ('F1709', 'Démolisseur / Démolisseuse', '''démoliss'':2 ''démolisseur'':1'),
      ('G1606', 'Cuisinier / Cuisinière de collectivité', '''collect'':4 ''cuisini'':1,2'),
      ('J1105', 'Médecin coordonnateur', '''coordon'':2 ''médecin'':1'),
      ('J1308', 'Brancardier / Brancardière', '''brancardi'':1,2'),
      ('J1309', 'Agent / Agente de stérilisation de service hospitalier', '''agent'':1,2 ''hospitali'':7 ''servic'':6 ''stérilis'':4'),
      ('K1306', 'Auxiliaire de Vie Sociale (AVS)', '''auxiliair'':1 ''av'':5 ''social'':4 ''vi'':3'),
      ('F1205', 'Responsable de travaux BTP', '''btp'':4 ''respons'':1 ''traval'':3'),
      ('K1310', 'Assistant maternel agréé / Assistante maternelle agréée', '''agré'':3,6 ''assist'':1,4 ''maternel'':2,5'),
      ('K1406', 'Secrétaire de mairie', '''mair'':3 ''secrétair'':1'),
      ('K2403', 'Biostatisticien / Biostatisticienne', '''biostatisticien'':1,2'),
      ('K2504', 'Agent / Agente de sécurité événementielle', '''agent'':1,2 ''sécur'':4 ''événementiel'':5'),
      ('B1605', 'Bijoutier / Bijoutière', '''bijouti'':1,2'),
      ('B1607', 'Lapidaire / Diamantaire', '''diamantair'':2 ''lapidair'':1'),
      ('G1217', 'Moniteur / Monitrice en salle de sport', '''moniteur'':1 ''monitric'':2 ''sall'':4 ''sport'':6'),
      ('B1608', 'Opérateur / Opératrice en bijouterie', '''bijouter'':4 ''oper'':1,2'),
      ('H3405', 'Polisseur / Polisseuse en bijouterie ou joaillerie ou orfèvrerie', '''bijouter'':4 ''joailler'':6 ''orfèvrer'':8 ''poliss'':2 ''polisseur'':1'),
      ('H3406', 'Opérateur / Opératrice en polissage de bijouterie ou d''orfèvrerie', '''bijouter'':6 ''oper'':1,2 ''orfèvrer'':9 ''polissag'':4'),
      ('G1218', 'Préparateur / Préparatrice physique', '''physiqu'':3 ''prépar'':1,2'),
      ('B1609', 'Responsable d''atelier en bijouterie ou joaillerie', '''ateli'':3 ''bijouter'':5 ''joailler'':7 ''respons'':1'),
      ('B1610', 'Sertisseur / Sertisseuse en bijouterie ou joaillerie', '''bijouter'':4 ''joailler'':6 ''sertiss'':2 ''sertisseur'':1'),
      ('B1611', 'Trieur / Trieuse de pierres et perles', '''perl'':6 ''pierr'':4 ''trieur'':1 ''trieus'':2'),
      ('G1215', 'Educateur sportif / Educatrice sportive Santé', '''educ'':1,3 ''sant'':5 ''sportif'':2 ''sportiv'':4'),
      ('B1606', 'Joaillier / Joaillière', '''joailli'':1,2')
    ON CONFLICT (code_rome) DO NOTHING;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("public_appellations_data", "legacy_code_rome_v3");
}
