import { SiretDto } from "../../../shared/siret";

export type Establishment = {
  siret: string;
  uniteLegale: Partial<{
    denominationUniteLegale?: string;
    nomUniteLegale?: string;
    prenomUsuelUniteLegale?: string;
    activitePrincipaleUniteLegale?: string;
    nomenclatureActivitePrincipaleUniteLegale?: string;
    trancheEffectifsUniteLegale?: string;
  }>;
  adresseEtablissement: Partial<{
    numeroVoieEtablissement?: string;
    typeVoieEtablissement?: string;
    libelleVoieEtablissement?: string;
    codePostalEtablissement?: string;
    libelleCommuneEtablissement?: string;
  }>;
};

export type SireneRepositoryAnswer = {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: Establishment[];
};

export interface SireneRepository {
  get: (siret: SiretDto) => Promise<SireneRepositoryAnswer | undefined>;
}
