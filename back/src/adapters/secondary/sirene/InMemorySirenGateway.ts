import {
  apiSirenNotAvailableSiret,
  SirenEstablishmentDto,
  SiretDto,
  tooManySirenRequestsSiret,
} from "shared";
import { SirenGateway } from "../../../domain/sirene/ports/SirenGateway";
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

export const TEST_ESTABLISHMENT1: SirenEstablishmentDto = {
  siret: TEST_ESTABLISHMENT1_SIRET,
  businessName: "MA P'TITE BOITE",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "7112B",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: true,
};

export const TEST_ESTABLISHMENT2: SirenEstablishmentDto = {
  siret: TEST_ESTABLISHMENT2_SIRET,
  businessName: "MA P'TITE BOITE 2",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: false,
};

export const TEST_ESTABLISHMENT3: SirenEstablishmentDto = {
  siret: TEST_ESTABLISHMENT3_SIRET,
  businessName: "MA P'TITE BOITE 2",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: true,
};

export const TEST_ESTABLISHMENT4: SirenEstablishmentDto = {
  siret: TEST_ESTABLISHMENT4_SIRET,
  businessName: "MA P'TITE BOITE 2",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: true,
};

export const apiSirenUnexpectedError = "apiSirenUnexpectedError";

type EstablishmentBySiret = { [siret: string]: SirenEstablishmentDto };

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
  ): Promise<SirenEstablishmentDto | undefined> {
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
      if (!establishment.isOpen && !includeClosedEstablishments) return;

      return establishment;
    } catch (error: any) {
      const serviceName = "Sirene API";
      logger.error({ siret, error }, "Error fetching siret");
      if (error?.initialError?.status === 429)
        throw new TooManyRequestApiError(serviceName);
      throw new UnavailableApiError(serviceName);
    }
  }

  // Visible for testing
  public setSirenEstablishment(establishment: SirenEstablishmentDto) {
    this._repo[establishment.siret] = establishment;
  }

  public setError(error: any) {
    this._error = error;
  }
}
