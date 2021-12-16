import { SearchParams } from "../entities/SearchParams";

export type LaPlateformeDeLInclusionResult = {
  cree_le: Date;
  mis_a_jour_le: Date;
  siret: string;
  type: string;
  raison_sociale: string;
  enseigne: string;
  site_web: string;
  description: string;
  bloque_candidatures: boolean;
  addresse_ligne_1: string;
  addresse_ligne_2: string;
  code_postal: string;
  ville: string;
  departement: string;
  postes: LaPlateFormeDeLInclusionPoste[];
};

export type LaPlateFormeDeLInclusionPoste = {
  id: number;
  rome: string;
  cree_le: Date;
  mis_a_jour_le: Date;
  recrutement_ouvert: string;
  description: string;
  appellation_modifiee: string;
};

export type LaPlateformeDeLInclusionAPI = {
  getResults: (
    searchParams: SearchParams,
  ) => Promise<LaPlateformeDeLInclusionResult[]>;
};
