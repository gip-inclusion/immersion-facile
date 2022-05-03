import { createLogger } from "../../utils/logger";
import {
  SireneRepositoryAnswer,
  SireneRepository,
  SireneEstablishmentVO,
} from "../../domain/sirene/ports/SireneRepository";
import { SiretDto } from "../../shared/siret";

const logger = createLogger(__filename);

export const TEST_ESTABLISHMENT1_SIRET = "12345678901234";
export const TEST_ESTABLISHMENT2_SIRET = "20006765000016";
export const TEST_ESTABLISHMENT3_SIRET = "77561959600155";
export const TEST_ESTABLISHMENT4_SIRET = "24570135400111";
export const TEST_ESTABLISHMENT5_SIRET = "01234567890123";

export const TEST_ESTABLISHMENT1 = new SireneEstablishmentVO({
  siret: TEST_ESTABLISHMENT1_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE",
    activitePrincipaleUniteLegale: "71.12B",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
    etatAdministratifUniteLegale: "A",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
  periodesEtablissement: [
    {
      dateFin: null,
      dateDebut: "2022-01-01",
      etatAdministratifEtablissement: "A",
    },
  ],
});

export const TEST_ESTABLISHMENT2 = new SireneEstablishmentVO({
  siret: TEST_ESTABLISHMENT2_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE 2",
    activitePrincipaleUniteLegale: "85.59A",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
    trancheEffectifsUniteLegale: "01",
    etatAdministratifUniteLegale: "A",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
  periodesEtablissement: [
    {
      dateFin: null,
      dateDebut: "2022-01-01",
      etatAdministratifEtablissement: "F",
    },
  ],
});

export const TEST_ESTABLISHMENT3 = new SireneEstablishmentVO({
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
  periodesEtablissement: [
    {
      dateFin: null,
      dateDebut: "2022-01-01",
      etatAdministratifEtablissement: "A",
    },
  ],
});

export const TEST_ESTABLISHMENT4 = new SireneEstablishmentVO({
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
  periodesEtablissement: [
    {
      dateFin: null,
      dateDebut: "2022-01-01",
      etatAdministratifEtablissement: "A",
    },
  ],
});

type EstablishmentBySiret = { [siret: string]: SireneEstablishmentVO };

export class InMemorySireneRepository extends SireneRepository {
  private _error: any = null;

  private readonly _repo: EstablishmentBySiret = {
    [TEST_ESTABLISHMENT1.siret]: TEST_ESTABLISHMENT1,
  };

  public constructor() {
    super();
    this._repo[TEST_ESTABLISHMENT1_SIRET] = TEST_ESTABLISHMENT1;
    this._repo[TEST_ESTABLISHMENT2_SIRET] = TEST_ESTABLISHMENT2;
    this._repo[TEST_ESTABLISHMENT3_SIRET] = TEST_ESTABLISHMENT3;
    this._repo[TEST_ESTABLISHMENT4_SIRET] = TEST_ESTABLISHMENT4;
  }

  public async _get(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SireneRepositoryAnswer | undefined> {
    if (this._error) {
      throw this._error;
    }
    logger.info({ siret, includeClosedEstablishments }, "get");
    const establishment = this._repo[siret];
    if (!establishment) return undefined;
    if (
      establishment.uniteLegale.etatAdministratifUniteLegale === "F" &&
      !includeClosedEstablishments
    ) {
      return undefined;
    }
    return {
      header: {
        statut: 400,
        message: "itsgood",
        total: 1,
        debut: 1,
        nombre: 1,
      },
      etablissements: [establishment.props],
    };
  }

  // Visible for testing
  public setEstablishment(establishment: SireneEstablishmentVO) {
    this._repo[establishment.siret] = establishment;
  }

  public setError(error: any) {
    this._error = error;
  }
}
