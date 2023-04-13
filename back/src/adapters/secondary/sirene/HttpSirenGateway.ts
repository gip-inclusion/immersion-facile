import { formatISO, secondsToMilliseconds } from "date-fns";

import {
  NafDto,
  NumberEmployeesRange,
  propEq,
  SirenEstablishmentDto,
  SiretDto,
} from "shared";

import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { SirenGateway } from "../../../domain/sirene/ports/SirenGateway";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { AxiosConfig } from "../../primary/config/appConfig";
import {
  TooManyRequestApiError,
  UnavailableApiError,
} from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export class HttpSirenGateway implements SirenGateway {
  public constructor(
    private readonly axiosConfig: AxiosConfig,
    private readonly timeGateway: TimeGateway,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  private createAxiosInstance() {
    return createAxiosInstance(logger, {
      baseURL: this.axiosConfig.endpoint,
      headers: {
        Authorization: `Bearer ${this.axiosConfig.bearerToken}`,
        Accept: "application/json",
      },
      timeout: secondsToMilliseconds(10),
    });
  }

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SirenEstablishmentDto | undefined> {
    logger.debug({ siret, includeClosedEstablishments }, "get");

    return this.retryStrategy
      .apply(async () => {
        try {
          const axios = this.createAxiosInstance();
          const response = await this.rateLimiter.whenReady(() =>
            axios.get("/siret", {
              params: this.createSiretQueryParams(
                siret,
                includeClosedEstablishments,
              ),
            }),
          );
          const dataFromApi: SirenGatewayAnswer | undefined = response?.data;
          const establishment = dataFromApi?.etablissements[0];
          if (!establishment) return;
          return convertSirenRawEstablishmentToSirenEstablishmentDto(
            establishment,
          );
        } catch (error: any) {
          if (error.response?.status === 404) {
            return;
          }
          if (isRetryableError(logger, error)) throw new RetryableError(error);
          logAxiosError(logger, error);
          throw error;
        }
      })
      .catch((error) => {
        const serviceName = "Sirene API";
        logger.error({ siret, error }, "Error fetching siret");
        if (error?.initialError?.status === 429)
          throw new TooManyRequestApiError(serviceName);
        throw new UnavailableApiError(serviceName);
      });
  }

  private createSiretQueryParams(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ) {
    const params: any = {
      q: `siret:${siret}`,
    };

    // According to API SIRENE documentation :
    // etatAdministratifEtablissement :
    //   État de l'établissement pendant la période :
    //     A= établissement actif
    //     F= établissement fermé
    if (!includeClosedEstablishments) {
      params.q += " AND periode(etatAdministratifEtablissement:A)";
      params.date = formatISO(this.timeGateway.now(), {
        representation: "date",
      });
    }

    return params;
  }
}

export type SirenApiRawEstablishment = {
  siret: string;
  uniteLegale: Partial<{
    denominationUniteLegale?: string;
    nomUniteLegale?: string;
    prenomUsuelUniteLegale?: string;
    activitePrincipaleUniteLegale?: string;
    nomenclatureActivitePrincipaleUniteLegale?: string;
    trancheEffectifsUniteLegale?: string;
    etatAdministratifUniteLegale?: string;
  }>;
  adresseEtablissement: Partial<{
    numeroVoieEtablissement?: string;
    typeVoieEtablissement?: string;
    libelleVoieEtablissement?: string;
    codePostalEtablissement?: string;
    libelleCommuneEtablissement?: string;
  }>;
  periodesEtablissement: Array<
    Partial<{
      dateFin: string | null;
      dateDebut: string | null;
      etatAdministratifEtablissement: "A" | "F";
    }>
  >;
};

export type SirenGatewayAnswer = {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: SirenApiRawEstablishment[];
};

export const convertSirenRawEstablishmentToSirenEstablishmentDto = (
  sirenEstablishment: SirenApiRawEstablishment,
): SirenEstablishmentDto => ({
  siret: sirenEstablishment.siret,
  businessName: getBusinessName(sirenEstablishment),
  businessAddress: getFormattedAddress(sirenEstablishment),
  nafDto: getNafAndNomenclature(sirenEstablishment),
  numberEmployeesRange: getNumberEmployeesRange(sirenEstablishment),
  isOpen: getIsActive(sirenEstablishment),
});

const getBusinessName = ({ uniteLegale }: SirenApiRawEstablishment): string => {
  const denomination = uniteLegale.denominationUniteLegale;
  if (denomination) return denomination;

  return [uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale]
    .filter((el) => !!el)
    .join(" ");
};

const getNafAndNomenclature = ({
  uniteLegale,
}: SirenApiRawEstablishment): NafDto | undefined => {
  const naf = uniteLegale.activitePrincipaleUniteLegale?.replace(".", "");
  if (!naf || !uniteLegale.nomenclatureActivitePrincipaleUniteLegale) return;

  return {
    code: naf,
    nomenclature: uniteLegale.nomenclatureActivitePrincipaleUniteLegale,
  };
};
const getFormattedAddress = ({
  adresseEtablissement,
}: SirenApiRawEstablishment): string =>
  [
    adresseEtablissement.numeroVoieEtablissement,
    adresseEtablissement.typeVoieEtablissement,
    adresseEtablissement.libelleVoieEtablissement,
    adresseEtablissement.codePostalEtablissement,
    adresseEtablissement.libelleCommuneEtablissement,
  ]
    .filter((el) => !!el)
    .join(" ");

const getIsActive = ({
  uniteLegale,
  periodesEtablissement,
}: SirenApiRawEstablishment) => {
  const lastPeriod = periodesEtablissement.find(propEq("dateFin", null));
  if (!lastPeriod) return false;

  return (
    uniteLegale.etatAdministratifUniteLegale === "A" &&
    lastPeriod.etatAdministratifEtablissement === "A"
  );
};

const getNumberEmployeesRange = ({
  uniteLegale,
}: SirenApiRawEstablishment): NumberEmployeesRange => {
  const tefenCode = uniteLegale.trancheEffectifsUniteLegale;
  if (!tefenCode || tefenCode === "NN") return "";
  return employeeRangeByTefenCode[<TefenCode>+tefenCode];
};

// prettier-ignore
// tefenCode is a French standard code for the number of employees in a company.
type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

const employeeRangeByTefenCode: Record<TefenCode, NumberEmployeesRange> = {
  [-1]: "",
  [0]: "0",
  [1]: "1-2",
  [2]: "3-5",
  [3]: "6-9",
  [11]: "10-19",
  [12]: "20-49",
  [21]: "50-99",
  [22]: "100-199",
  [31]: "200-249",
  [32]: "250-499",
  [41]: "500-999",
  [42]: "1000-1999",
  [51]: "2000-4999",
  [52]: "5000-9999",
  [53]: "+10000",
};
