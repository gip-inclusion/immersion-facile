import {
  type Builder,
  errors,
  type NafDto,
  type NumberEmployeesRange,
  type SiretDto,
  type SiretEstablishmentDto,
  tooManySirenRequestsSiret,
} from "shared";
import { createLogger } from "../../../../utils/logger";
import type { SiretGateway } from "../ports/SiretGateway";

const logger = createLogger(__filename);

export const TEST_OPEN_ESTABLISHMENT_1: SiretEstablishmentDto = {
  siret: "12345678901234",
  businessName: "MA P'TITE BOITE",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "7112B",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: true,
};

export const TEST_OPEN_ESTABLISHMENT_2: SiretEstablishmentDto = {
  siret: "77561959600155",
  businessName: "MA P'TITE BOITE 2",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: true,
};

const TEST_OPEN_ESTABLISHMENT_3: SiretEstablishmentDto = {
  siret: "24570135400111",
  businessName: "MA P'TITE BOITE 2",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: true,
};

const TEST_CLOSED_ESTABLISHMENT_1: SiretEstablishmentDto = {
  siret: "20006765000016",
  businessName: "MA P'TITE BOITE 2",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  numberEmployeesRange: "3-5",
  isOpen: false,
};

const apiSirenUnexpectedError = "apiSirenUnexpectedError";

type EstablishmentBySiret = { [siret: string]: SiretEstablishmentDto };

export class InMemorySiretGateway implements SiretGateway {
  public siretEstablishmentsUpdateSince: SiretEstablishmentDto[] = [];

  #error: any = null;

  readonly #repo: EstablishmentBySiret = {
    [TEST_OPEN_ESTABLISHMENT_1.siret]: TEST_OPEN_ESTABLISHMENT_1,
    [TEST_OPEN_ESTABLISHMENT_2.siret]: TEST_OPEN_ESTABLISHMENT_2,
    [TEST_OPEN_ESTABLISHMENT_3.siret]: TEST_OPEN_ESTABLISHMENT_3,
    [TEST_CLOSED_ESTABLISHMENT_1.siret]: TEST_CLOSED_ESTABLISHMENT_1,
  };

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SiretEstablishmentDto | undefined> {
    try {
      if (this.#error) throw this.#error;
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

      logger.info({
        message: `Fetching siret ${siret} with includeClosedEstablishments = ${includeClosedEstablishments}`,
      });
      const establishment = this.#repo[siret];
      if (!establishment) return;
      if (!establishment.isOpen && !includeClosedEstablishments) return;

      return establishment;
    } catch (error: any) {
      const serviceName = "Sirene API";
      logger.error({ error, message: `Error fetching siret ${siret}` });
      if (error?.initialError?.status === 429)
        throw errors.siretApi.tooManyRequests({ serviceName });
      throw errors.siretApi.unavailable({ serviceName });
    }
  }

  public async getEstablishmentUpdatedBetween(
    _fromDate: Date,
    _toDate: Date,
    sirets: SiretDto[],
  ): Promise<Record<SiretDto, SiretEstablishmentDto>> {
    return this.siretEstablishmentsUpdateSince
      .filter((siretEstablishmentDto) =>
        sirets.includes(siretEstablishmentDto.siret),
      )
      .reduce(
        (acc, siretEstablishmentDto) => ({
          ...acc,
          [siretEstablishmentDto.siret]: siretEstablishmentDto,
        }),
        {} as Record<SiretDto, SiretEstablishmentDto>,
      );
  }

  public setError(error: any) {
    this.#error = error;
  }

  // Visible for testing
  public setSirenEstablishment(establishment: SiretEstablishmentDto) {
    this.#repo[establishment.siret] = establishment;
  }
}

const validSiretEstablishmentDto: SiretEstablishmentDto = {
  siret: "20006765000016",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  businessName: "MA P'TITE BOITE 2",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  isOpen: true,
  numberEmployeesRange: "3-5",
};

export class SiretEstablishmentDtoBuilder
  implements Builder<SiretEstablishmentDto>
{
  constructor(
    private dto: SiretEstablishmentDto = validSiretEstablishmentDto,
  ) {}

  public build(): SiretEstablishmentDto {
    return this.dto;
  }

  public withBusinessAddress(
    businessAddress: string,
  ): SiretEstablishmentDtoBuilder {
    return new SiretEstablishmentDtoBuilder({
      ...this.dto,
      businessAddress,
    });
  }

  public withBusinessName(businessName: string): SiretEstablishmentDtoBuilder {
    return new SiretEstablishmentDtoBuilder({
      ...this.dto,
      businessName,
    });
  }

  public withIsActive(isActive: boolean): SiretEstablishmentDtoBuilder {
    return new SiretEstablishmentDtoBuilder({
      ...this.dto,
      isOpen: isActive,
    });
  }

  public withNafDto(nafDto: NafDto) {
    return new SiretEstablishmentDtoBuilder({
      ...this.dto,
      nafDto,
    });
  }

  public withNumberEmployeesRange(numberEmployeesRange: NumberEmployeesRange) {
    return new SiretEstablishmentDtoBuilder({
      ...this.dto,
      numberEmployeesRange,
    });
  }

  public withSiret(siret: string): SiretEstablishmentDtoBuilder {
    return new SiretEstablishmentDtoBuilder({
      ...this.dto,
      siret,
    });
  }
}
