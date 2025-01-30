import { Flavor } from "../typeFlavors";

export const nafSectorCodes = [
  "0",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
] as const;
export type NafSectorCode = (typeof nafSectorCodes)[number];

export const nafSectorLabels: Record<NafSectorCode, NafSectionLabel> = {
  "0": "Unknown",
  A: "Agriculture, sylviculture et pêche",
  B: "Industries extractives",
  C: "Industrie manufacturière",
  D: "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
  E: "Production et distribution d'eau ; assainissement, gestion des déchets et dépollution",
  F: "Construction",
  G: "Commerce ; réparation d'automobiles et de motocycles",
  H: "Transports et entreposage",
  I: "Hébergement et restauration",
  J: "Information et communication",
  K: "Activités financières et d'assurance",
  L: "Activités immobilières",
  M: "Activités spécialisées, scientifiques et techniques",
  N: "Activités de services administratifs et de soutien",
  O: "Administration publique",
  P: "Enseignement",
  Q: "Santé humaine et action sociale",
  R: "Arts, spectacles et activités récréatives",
  S: "Autres activités de services",
  T: "Activités des ménages en tant qu'employeurs ; activités indifférenciées des ménages en tant que producteurs de biens et services pour usage propre",
  U: "Activités extra-territoriales",
};

export type NafCode = Flavor<string, "NafCode">;
export type NafNomenclature = Flavor<string, "NafNomenclature">;
export type NafSectionLabel = Flavor<string, "SectionLabel">;

export type NafDto = {
  code: NafCode;
  nomenclature: NafNomenclature;
};
export type WithNafCodes = {
  nafCodes?: NafCode[];
};

export const fromNafSubClassToNafClass = (nafSubClass: string): string => {
  const nafWithoutSectionId = nafSubClass.replace(/[A-Z]/gi, "");
  return [nafWithoutSectionId.slice(0, 2), nafWithoutSectionId.slice(2)].join(
    ".",
  );
};

export type NafSectionSuggestion = {
  label: NafSectionLabel;
  nafCodes: NafCode[];
};

export type NafSectionSuggestionsParams = {
  searchText: string;
};
