import {
  apiSirenNotAvailableSiret,
  apiSirenUnexpectedError,
  SiretDto,
  tooManySirenRequestsSiret,
} from "shared";
import {
  SirenApiRawEstablishment,
  SirenGatewayAnswer,
  SirenGateway,
} from "../../../domain/sirene/ports/SirenGateway";
import { createLogger } from "../../../utils/logger";
import {
  TooManyRequestApiError,
  UnavailableApiError,
} from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export const TEST_ESTABLISHMENT1_SIRET = "12345678901234";
export const TEST_ESTABLISHMENT2_SIRET = "20006765000016";
export const TEST_ESTABLISHMENT3_SIRET = "77561959600155";
export const TEST_ESTABLISHMENT4_SIRET = "24570135400111";
export const TEST_ESTABLISHMENT5_SIRET = "01234567890123";

export const TEST_ESTABLISHMENT1: SirenApiRawEstablishment = {
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
};

export const TEST_ESTABLISHMENT2: SirenApiRawEstablishment = {
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
};

export const TEST_ESTABLISHMENT3: SirenApiRawEstablishment = {
  siret: TEST_ESTABLISHMENT3_SIRET,
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
      etatAdministratifEtablissement: "A",
    },
  ],
};

export const TEST_ESTABLISHMENT4: SirenApiRawEstablishment = {
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
};

type EstablishmentBySiret = { [siret: string]: SirenApiRawEstablishment };

export class InMemorySirenGateway implements SirenGateway {
  private _error: any = null;

  private readonly _repo: EstablishmentBySiret = {
    [TEST_ESTABLISHMENT1.siret]: TEST_ESTABLISHMENT1,
    [TEST_ESTABLISHMENT2.siret]: TEST_ESTABLISHMENT2,
    [TEST_ESTABLISHMENT3.siret]: TEST_ESTABLISHMENT3,
    [TEST_ESTABLISHMENT4.siret]: TEST_ESTABLISHMENT4,
  };

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SirenGatewayAnswer | undefined> {
    try {
      if (this._error) throw this._error;
      if (siret === apiSirenUnexpectedError)
        throw {
          initialError: {
            message: "Unexpected error",
            status: 666,
            data: "some error",
          },
        };
      if (siret === tooManySirenRequestsSiret)
        throw {
          initialError: {
            message: "Request failed with status code 429",
            status: 429,
            data: "some error",
          },
        };
      if (siret === apiSirenNotAvailableSiret)
        throw {
          initialError: {
            message: "Api down",
            status: 503,
            data: "some error",
          },
        };

      logger.info({ siret, includeClosedEstablishments }, "get");
      const establishment = this._repo[siret];
      if (!establishment) return;
      if (
        establishment.uniteLegale.etatAdministratifUniteLegale === "F" &&
        !includeClosedEstablishments
      ) {
        return;
      }

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
    } catch (error: any) {
      const serviceName = "Sirene API";
      logger.error({ siret, error }, "Error fetching siret");
      if (error?.initialError?.status === 429)
        throw new TooManyRequestApiError(serviceName);
      throw new UnavailableApiError(serviceName);
    }
  }

  // Visible for testing
  public setRawEstablishment(establishment: SirenApiRawEstablishment) {
    this._repo[establishment.siret] = establishment;
  }

  public setError(error: any) {
    this._error = error;
  }
}
