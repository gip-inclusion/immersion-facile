import { AgencyKind } from "shared";

export type AllowedAgencyKindToAdd = Exclude<AgencyKind, "immersion-facile">;

export const agencyKindToLabel: Record<AllowedAgencyKindToAdd, string> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "Pôle Emploi",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  cci: "Chambres de Commerce et d'Industrie",
  "structure-IAE": "Structure IAE",
  "operateur-cep": "Opérateur du CEP",
  autre: "Autre",
};
