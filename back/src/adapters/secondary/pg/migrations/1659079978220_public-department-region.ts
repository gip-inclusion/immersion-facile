import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  type TableLine = {
    department_code: string;
    department_name: string;
    region_name: string;
  };
  pgm.addColumns("public_department_region", {
    department_code: { type: "text", notNull: true, default: "" },
    department_name: { type: "text", notNull: true, default: "" },
    region_name: { type: "text", notNull: true, default: "" },
  });

  const lines: TableLine[] = [
    {
      department_code: "01",
      department_name: "Ain",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "02",
      department_name: "Aisne",
      region_name: "Hauts-de-France",
    },
    {
      department_code: "03",
      department_name: "Allier",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "04",
      department_name: "Alpes-de-Haute-Provence",
      region_name: "Provence-Alpes-Côte d'Azur",
    },
    {
      department_code: "05",
      department_name: "Hautes-Alpes",
      region_name: "Provence-Alpes-Côte d'Azur",
    },
    {
      department_code: "06",
      department_name: "Alpes-Maritimes",
      region_name: "Provence-Alpes-Côte d'Azur",
    },
    {
      department_code: "07",
      department_name: "Ardèche",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "08",
      department_name: "Ardennes",
      region_name: "Grand Est",
    },
    {
      department_code: "09",
      department_name: "Ariège",
      region_name: "Occitanie",
    },
    {
      department_code: "10",
      department_name: "Aube",
      region_name: "Grand Est",
    },
    {
      department_code: "11",
      department_name: "Aude",
      region_name: "Occitanie",
    },
    {
      department_code: "12",
      department_name: "Aveyron",
      region_name: "Occitanie",
    },
    {
      department_code: "13",
      department_name: "Bouches-du-Rhône",
      region_name: "Provence-Alpes-Côte d'Azur",
    },
    {
      department_code: "14",
      department_name: "Calvados",
      region_name: "Normandie",
    },
    {
      department_code: "15",
      department_name: "Cantal",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "16",
      department_name: "Charente",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "17",
      department_name: "Charente-Maritime",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "18",
      department_name: "Cher",
      region_name: "Centre-Val de Loire",
    },
    {
      department_code: "19",
      department_name: "Corrèze",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "21",
      department_name: "Côte-d'Or",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "22",
      department_name: "Côtes-d'Armor",
      region_name: "Bretagne",
    },
    {
      department_code: "23",
      department_name: "Creuse",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "24",
      department_name: "Dordogne",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "25",
      department_name: "Doubs",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "26",
      department_name: "Drôme",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "27",
      department_name: "Eure",
      region_name: "Normandie",
    },
    {
      department_code: "28",
      department_name: "Eure-et-Loir",
      region_name: "Centre-Val de Loire",
    },
    {
      department_code: "29",
      department_name: "Finistère",
      region_name: "Bretagne",
    },
    {
      department_code: "2A",
      department_name: "Corse-du-Sud",
      region_name: "Corse",
    },
    {
      department_code: "2B",
      department_name: "Haute-Corse",
      region_name: "Corse",
    },
    {
      department_code: "30",
      department_name: "Gard",
      region_name: "Occitanie",
    },
    {
      department_code: "31",
      department_name: "Haute-Garonne",
      region_name: "Occitanie",
    },
    {
      department_code: "32",
      department_name: "Gers",
      region_name: "Occitanie",
    },
    {
      department_code: "33",
      department_name: "Gironde",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "34",
      department_name: "Hérault",
      region_name: "Occitanie",
    },
    {
      department_code: "35",
      department_name: "Ille-et-Vilaine",
      region_name: "Bretagne",
    },
    {
      department_code: "36",
      department_name: "Indre",
      region_name: "Centre-Val de Loire",
    },
    {
      department_code: "37",
      department_name: "Indre-et-Loire",
      region_name: "Centre-Val de Loire",
    },
    {
      department_code: "38",
      department_name: "Isère",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "39",
      department_name: "Jura",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "40",
      department_name: "Landes",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "41",
      department_name: "Loir-et-Cher",
      region_name: "Centre-Val de Loire",
    },
    {
      department_code: "42",
      department_name: "Loire",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "43",
      department_name: "Haute-Loire",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "44",
      department_name: "Loire-Atlantique",
      region_name: "Pays de la Loire",
    },
    {
      department_code: "45",
      department_name: "Loiret",
      region_name: "Centre-Val de Loire",
    },
    { department_code: "46", department_name: "Lot", region_name: "Occitanie" },
    {
      department_code: "47",
      department_name: "Lot-et-Garonne",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "48",
      department_name: "Lozère",
      region_name: "Occitanie",
    },
    {
      department_code: "49",
      department_name: "Maine-et-Loire",
      region_name: "Pays de la Loire",
    },
    {
      department_code: "50",
      department_name: "Manche",
      region_name: "Normandie",
    },
    {
      department_code: "51",
      department_name: "Marne",
      region_name: "Grand Est",
    },
    {
      department_code: "52",
      department_name: "Haute-Marne",
      region_name: "Grand Est",
    },
    {
      department_code: "53",
      department_name: "Mayenne",
      region_name: "Pays de la Loire",
    },
    {
      department_code: "54",
      department_name: "Meurthe-et-Moselle",
      region_name: "Grand Est",
    },
    {
      department_code: "55",
      department_name: "Meuse",
      region_name: "Grand Est",
    },
    {
      department_code: "56",
      department_name: "Morbihan",
      region_name: "Bretagne",
    },
    {
      department_code: "57",
      department_name: "Moselle",
      region_name: "Grand Est",
    },
    {
      department_code: "58",
      department_name: "Nièvre",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "59",
      department_name: "Nord",
      region_name: "Hauts-de-France",
    },
    {
      department_code: "60",
      department_name: "Oise",
      region_name: "Hauts-de-France",
    },
    {
      department_code: "61",
      department_name: "Orne",
      region_name: "Normandie",
    },
    {
      department_code: "62",
      department_name: "Pas-de-Calais",
      region_name: "Hauts-de-France",
    },
    {
      department_code: "63",
      department_name: "Puy-de-Dôme",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "64",
      department_name: "Pyrénées-Atlantiques",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "65",
      department_name: "Hautes-Pyrénées",
      region_name: "Occitanie",
    },
    {
      department_code: "66",
      department_name: "Pyrénées-Orientales",
      region_name: "Occitanie",
    },
    {
      department_code: "67",
      department_name: "Bas-Rhin",
      region_name: "Grand Est",
    },
    {
      department_code: "68",
      department_name: "Haut-Rhin",
      region_name: "Grand Est",
    },
    {
      department_code: "69",
      department_name: "Rhône",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "70",
      department_name: "Haute-Saône",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "71",
      department_name: "Saône-et-Loire",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "72",
      department_name: "Sarthe",
      region_name: "Pays de la Loire",
    },
    {
      department_code: "73",
      department_name: "Savoie",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "74",
      department_name: "Haute-Savoie",
      region_name: "Auvergne-Rhône-Alpes",
    },
    {
      department_code: "75",
      department_name: "Paris",
      region_name: "Île-de-France",
    },
    {
      department_code: "76",
      department_name: "Seine-Maritime",
      region_name: "Normandie",
    },
    {
      department_code: "77",
      department_name: "Seine-et-Marne",
      region_name: "Île-de-France",
    },
    {
      department_code: "78",
      department_name: "Yvelines",
      region_name: "Île-de-France",
    },
    {
      department_code: "79",
      department_name: "Deux-Sèvres",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "80",
      department_name: "Somme",
      region_name: "Hauts-de-France",
    },
    {
      department_code: "81",
      department_name: "Tarn",
      region_name: "Occitanie",
    },
    {
      department_code: "82",
      department_name: "Tarn-et-Garonne",
      region_name: "Occitanie",
    },
    {
      department_code: "83",
      department_name: "Var",
      region_name: "Provence-Alpes-Côte d'Azur",
    },
    {
      department_code: "84",
      department_name: "Vaucluse",
      region_name: "Provence-Alpes-Côte d'Azur",
    },
    {
      department_code: "85",
      department_name: "Vendée",
      region_name: "Pays de la Loire",
    },
    {
      department_code: "86",
      department_name: "Vienne",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "87",
      department_name: "Haute-Vienne",
      region_name: "Nouvelle-Aquitaine",
    },
    {
      department_code: "88",
      department_name: "Vosges",
      region_name: "Grand Est",
    },
    {
      department_code: "89",
      department_name: "Yonne",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "90",
      department_name: "Territoire de Belfort",
      region_name: "Bourgogne-Franche-Comté",
    },
    {
      department_code: "91",
      department_name: "Essonne",
      region_name: "Île-de-France",
    },
    {
      department_code: "92",
      department_name: "Hauts-de-Seine",
      region_name: "Île-de-France",
    },
    {
      department_code: "93",
      department_name: "Seine-Saint-Denis",
      region_name: "Île-de-France",
    },
    {
      department_code: "94",
      department_name: "Val-de-Marne",
      region_name: "Île-de-France",
    },
    {
      department_code: "95",
      department_name: "Val-d'Oise",
      region_name: "Île-de-France",
    },
    {
      department_code: "971",
      department_name: "Guadeloupe",
      region_name: "Guadeloupe",
    },
    {
      department_code: "972",
      department_name: "Martinique",
      region_name: "Martinique",
    },
    {
      department_code: "973",
      department_name: "Guyane",
      region_name: "Guyane",
    },
    {
      department_code: "974",
      department_name: "La Réunion",
      region_name: "La Réunion",
    },
    {
      department_code: "976",
      department_name: "Mayotte",
      region_name: "Mayotte",
    },
  ];

  const query = (
    lines: TableLine[],
  ) => `INSERT INTO public_department_region (department_code, department_name, region_name)
  VALUES\n${lines.map(lineToInsertValue).join(",\n")};`;

  const lineToInsertValue = (line: TableLine) =>
    `('${line.department_code}', '${line.department_name}', '${line.region_name}')`;

  pgm.sql(query(lines));
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("public_department_region");
}
