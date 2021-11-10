export type Establishment = {
  siren: string;
  nic: string;
  siret: string;
  etablissementSiege: boolean;
  uniteLegale: Partial<{
    denominationUniteLegale: string | null;
    nomUniteLegale: string | null;
    prenomUsuelUniteLegale: string | null;
    activitePrincipaleUniteLegale: string | null;
    nomenclatureActivitePrincipaleUniteLegale: string | null;
    trancheEffectifsUniteLegale: string | null;
  }>;
  adresseEtablissement: Partial<{
    numeroVoieEtablissement: string | null;
    typeVoieEtablissement: string | null;
    libelleVoieEtablissement: string | null;
    codePostalEtablissement: string | null;
    libelleCommuneEtablissement: string | null;
  }>;
};

export type EstablishmentInfoFromSiretApi = {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: Establishment[];
};
