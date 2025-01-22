import { z } from "zod";
import { Flavor } from "./typeFlavors";
import { keys } from "./utils";

const nafSectorCodes = [
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

export const nafSectorLabels: Record<NafSectorCode, string> = {
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

export const validNafSectorCodes = keys(nafSectorLabels).filter(
  (val) => val !== "0",
);
export const nafSectorCodeSchema: z.Schema<NafSectorCode> =
  z.enum(nafSectorCodes);

export type NafCode = Flavor<string, "NafCode">;
export type NafNomenclature = Flavor<string, "NafNomenclature">;

export type NafDto = {
  code: NafCode;
  nomenclature: NafNomenclature;
};
export type WithNafCodes = {
  nafCodes?: NafCode[];
};

const nafCodeSchema: z.Schema<NafCode> = z.string().length(5);

export const nafCodesSchema: z.Schema<NafCode[]> = z
  .array(nafCodeSchema)
  .nonempty();

export const withNafCodesSchema: z.Schema<WithNafCodes> = z.object({
  nafCodes: nafCodesSchema.optional(),
});

export const nafSchema: z.Schema<NafDto> = z.object({
  code: nafCodeSchema,
  nomenclature: z.string(),
});

const nafDivisionRegex = /\d{2}/;
export const nafDivisionSchema = z
  .string()
  .regex(nafDivisionRegex, "Division NAF incorrect");

export const fromNafSubClassToNafClass = (nafSubClass: string): string => {
  const nafWithoutSectionId = nafSubClass.replace(/[A-Z]/gi, "");
  return [nafWithoutSectionId.slice(0, 2), nafWithoutSectionId.slice(2)].join(
    ".",
  );
};
