import {
  Establishment,
  SireneRepositoryAnswer,
  SireneRepository,
} from "../../domain/sirene/ports/SireneRepository";
import { SiretDto } from "../../shared/siret";

export const TEST_ESTABLISHMENT1_SIRET = "12345678901234";
export const TEST_ESTABLISHMENT2_SIRET = "20006765000016";
export const TEST_ESTABLISHMENT3_SIRET = "77561959600155";
export const TEST_ESTABLISHMENT4_SIRET = "24570135400111";
export const TEST_ESTABLISHMENT5_SIRET = "01234567890123";

export const TEST_ESTABLISHMENT1: Establishment = {
  siret: TEST_ESTABLISHMENT1_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE",
    activitePrincipaleUniteLegale: "71.12B",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

export const TEST_ESTABLISHMENT2: Establishment = {
  siret: TEST_ESTABLISHMENT2_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE 2",
    activitePrincipaleUniteLegale: "85.59A",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

export const TEST_ESTABLISHMENT3: Establishment = {
  siret: TEST_ESTABLISHMENT3_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE 2",
    activitePrincipaleUniteLegale: "85.59A",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};
export const TEST_ESTABLISHMENT4: Establishment = {
  siret: TEST_ESTABLISHMENT4_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE 2",
    activitePrincipaleUniteLegale: "85.59A",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

type EstablishmentBySiret = { [siret: string]: Establishment };

export class InMemorySireneRepository implements SireneRepository {
  private readonly _repo: EstablishmentBySiret = {
    [TEST_ESTABLISHMENT1.siret]: TEST_ESTABLISHMENT1,
  };

  public constructor() {
    this._repo[TEST_ESTABLISHMENT1_SIRET] = TEST_ESTABLISHMENT1;
    this._repo[TEST_ESTABLISHMENT2_SIRET] = TEST_ESTABLISHMENT2;
    this._repo[TEST_ESTABLISHMENT3_SIRET] = TEST_ESTABLISHMENT3;
    this._repo[TEST_ESTABLISHMENT4_SIRET] = TEST_ESTABLISHMENT4;
  }

  public insert(siret: string, establishment: Establishment) {
    this._repo[siret] = establishment;
  }

  public async get(
    siret: SiretDto,
  ): Promise<SireneRepositoryAnswer | undefined> {
    const establishment = this._repo[siret];
    if (!establishment) return undefined;
    return {
      header: {
        statut: 400,
        message: "itsgood",
        total: 1,
        debut: 1,
        nombre: 1,
      },
      etablissements: [establishment],
    };
  }

  // Visible for testing
  public add(establishment: Establishment) {
    this._repo[establishment.siret] = establishment;
  }
}
