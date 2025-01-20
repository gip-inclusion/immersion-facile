import querystring from "querystring";
import axios from "axios";
import Bottleneck from "bottleneck";
import { format, formatISO, secondsToMilliseconds } from "date-fns";
import { Logger } from "pino";
import {
  NafDto,
  NumberEmployeesRange,
  OmitFromExistingKeys,
  SiretDto,
  SiretEstablishmentDto,
  castError,
  errors,
  filterNotFalsy,
  queryParamsAsString,
} from "shared";
import {
  AccessTokenResponse,
  InseeAccessTokenConfig,
} from "../../../../config/bootstrap/appConfig";
import {
  createAxiosInstance,
  isRetryableError,
} from "../../../../utils/axiosUtils";
import { createLogger } from "../../../../utils/logger";
import { InMemoryCachingGateway } from "../../caching-gateway/adapters/InMemoryCachingGateway";
import {
  RetryStrategy,
  RetryableError,
} from "../../retry-strategy/ports/RetryStrategy";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { SiretGateway } from "../ports/SirenGateway";

const logger = createLogger(__filename);

const inseeMaxRequestsPerMinute = 500;
const inseeMaxRequestPerInterval = 1;
const rate_ms = 3_000;

const ONE_MINUTE_MS = 60 * 1000;
// The documentation can be found here:
// https://portail-api.insee.fr/catalog/all > Api Sirene Privée > Documentation

export class InseeSiretGateway implements SiretGateway {
  #limiter = new Bottleneck({
    reservoir: inseeMaxRequestsPerMinute,
    reservoirRefreshInterval: ONE_MINUTE_MS,
    reservoirRefreshAmount: inseeMaxRequestsPerMinute,
    minTime: Math.ceil(ONE_MINUTE_MS / inseeMaxRequestsPerMinute),
  });

  // 1 call every 3 seconds
  #tokenLimiter = new Bottleneck({
    maxConcurrent: 1,
    reservoir: inseeMaxRequestPerInterval,
    reservoirRefreshInterval: rate_ms,
    reservoirRefreshAmount: inseeMaxRequestPerInterval,
    minTime: Math.ceil(rate_ms / inseeMaxRequestPerInterval),
  });

  readonly #retryStrategy: RetryStrategy;

  readonly #axiosConfig: InseeAccessTokenConfig;

  readonly #timeGateway: TimeGateway;

  readonly #caching: InMemoryCachingGateway<AccessTokenResponse>;

  constructor(
    axiosConfig: InseeAccessTokenConfig,
    timeGateway: TimeGateway,
    retryStrategy: RetryStrategy,
    caching: InMemoryCachingGateway<AccessTokenResponse>,
  ) {
    this.#axiosConfig = axiosConfig;
    this.#retryStrategy = retryStrategy;
    this.#timeGateway = timeGateway;
    this.#caching = caching;
  }

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SiretEstablishmentDto | undefined> {
    logger.debug({
      message: `Fetching siret ${siret} with includeClosedEstablishments = ${includeClosedEstablishments}`,
    });

    return this.#retryStrategy
      .apply(async () => {
        try {
          const axios = await this.#createAxiosInstance();
          const response = await this.#limiter.schedule(() =>
            axios.get<SirenGatewayAnswer>("/siret", {
              params: this.#createSiretQueryParams(
                siret,
                includeClosedEstablishments,
              ),
            }),
          );
          const establishment = response?.data?.etablissements.at(0);
          return (
            establishment &&
            convertSirenRawEstablishmentToSirenEstablishmentDto(establishment)
          );
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
              return;
            }
            if (isRetryableError(logger as Logger, error))
              throw new RetryableError(error);
            logger.error({
              error,
            });
          }
          throw error;
        }
      })
      .catch((error) => {
        const serviceName = "Sirene API";
        logger.error({
          message: `Error fetching siret ${siret}`,
          error: castError(error),
        });
        if (error?.initialError?.status === 429)
          throw errors.siretApi.tooManyRequests({ serviceName });
        throw errors.siretApi.unavailable({ serviceName });
      });
  }

  public async getEstablishmentUpdatedBetween(
    fromDate: Date,
    toDate: Date,
    sirets: SiretDto[],
  ): Promise<Record<SiretDto, SiretEstablishmentDto>> {
    try {
      const formattedFromDate = format(fromDate, "yyyy-MM-dd");
      const formattedToDate = format(toDate, "yyyy-MM-dd");
      const axios = await this.#createAxiosInstance();

      const requestBody = queryParamsAsString({
        q: [
          `dateDernierTraitementEtablissement:[${formattedFromDate} TO ${formattedToDate}]`,
          `(${sirets.map((siret) => `siret:${siret}`).join(" OR ")})`,
        ].join(" AND "),
        champs: [
          "siret",
          "denominationUniteLegale",
          "nomUniteLegale",
          "prenomUsuelUniteLegale",
          "activitePrincipaleUniteLegale",
          "nomenclatureActivitePrincipaleUniteLegale",
          "trancheEffectifsUniteLegale",
          "etatAdministratifUniteLegale",
          "numeroVoieEtablissement",
          "typeVoieEtablissement",
          "libelleVoieEtablissement",
          "codePostalEtablissement",
          "libelleCommuneEtablissement",
          "dateDebut",
          "dateFin",
          "etatAdministratifEtablissement",
        ].join(","),
        nombre: 1000,
      });

      const response = await axios.post("/siret", requestBody, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return (
        response.data.etablissements as InseeApiRawEstablishment[]
      ).reduce(
        (acc, establishment) => ({
          ...acc,
          [establishment.siret]:
            convertSirenRawEstablishmentToSirenEstablishmentDto(establishment),
        }),
        {} satisfies Record<SiretDto, SiretEstablishmentDto>,
      );
    } catch (err) {
      const error = castError(err);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) return {};
        throw error.response?.data;
      }
      throw error;
    }
  }

  async #createAxiosInstance() {
    const accessToken = await this.#getAccessToken();
    return createAxiosInstance(logger, {
      baseURL: this.#axiosConfig.endpoint,
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
        Accept: "application/json",
      },
      timeout: secondsToMilliseconds(10),
    });
  }

  async #getAccessToken() {
    return this.#caching.caching(this.#axiosConfig.clientId, () =>
      this.#retryStrategy.apply(() =>
        this.#tokenLimiter.schedule(() => {
          return createAxiosInstance(logger)
            .post(
              "https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token?",
              querystring.stringify({
                grant_type: "password",
                client_id: this.#axiosConfig.clientId,
                client_secret: this.#axiosConfig.clientSecret,
                username: this.#axiosConfig.username,
                password: this.#axiosConfig.password,
              }),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: secondsToMilliseconds(10),
              },
            )
            .then((response) => {
              return response.data;
            })
            .catch((error) => {
              logger.error({
                error,
                message: "Raw error getting access token",
              });
              if (isRetryableError(logger, error))
                throw new RetryableError(error);
              throw error;
            });
        }),
      ),
    );
  }

  #createSiretQueryParams(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): {
    date?: string | undefined;
    q: string;
  } {
    // According to API SIRENE documentation :
    // etatAdministratifEtablissement :
    //   État de l'établissement pendant la période :
    //     A= établissement actif
    //     F= établissement fermé
    return includeClosedEstablishments
      ? { q: `siret:${siret}` }
      : {
          q: `siret:${siret} AND periode(etatAdministratifEtablissement:A)`,
          date: formatISO(this.#timeGateway.now(), {
            representation: "date",
          }),
        };
  }
}

type InseePeriodeEtablissment = Partial<{
  dateFin: string | null;
  dateDebut: string | null;
  etatAdministratifEtablissement: "A" | "F";
}>;

type InseePeriodeEtablissmentWithDateFin = OmitFromExistingKeys<
  InseePeriodeEtablissment,
  "dateFin"
> & {
  dateFin: string | null;
};

export type InseeApiRawEstablishment = {
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
  periodesEtablissement: Array<InseePeriodeEtablissment>;
};

type SirenGatewayAnswer = {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: InseeApiRawEstablishment[];
};

export const convertSirenRawEstablishmentToSirenEstablishmentDto = (
  siretEstablishment: InseeApiRawEstablishment,
): SiretEstablishmentDto => ({
  siret: siretEstablishment.siret,
  businessName: getBusinessName(siretEstablishment),
  businessAddress: getFormattedAddress(siretEstablishment),
  nafDto: getNafAndNomenclature(siretEstablishment),
  numberEmployeesRange: getNumberEmployeesRange(siretEstablishment),
  isOpen: getIsActive(siretEstablishment),
});

const getBusinessName = ({ uniteLegale }: InseeApiRawEstablishment): string => {
  const denomination = uniteLegale.denominationUniteLegale;
  if (denomination) return denomination;

  return [uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale]
    .filter(filterNotFalsy)
    .join(" ");
};

const getNafAndNomenclature = ({
  uniteLegale,
}: InseeApiRawEstablishment): NafDto | undefined => {
  const naf = uniteLegale.activitePrincipaleUniteLegale?.replace(".", "");
  if (!naf || !uniteLegale.nomenclatureActivitePrincipaleUniteLegale) return;

  return {
    code: naf,
    nomenclature: uniteLegale.nomenclatureActivitePrincipaleUniteLegale,
  };
};
const getFormattedAddress = ({
  adresseEtablissement,
}: InseeApiRawEstablishment): string =>
  [
    adresseEtablissement.numeroVoieEtablissement,
    adresseEtablissement.typeVoieEtablissement,
    adresseEtablissement.libelleVoieEtablissement,
    adresseEtablissement.codePostalEtablissement,
    adresseEtablissement.libelleCommuneEtablissement,
  ]
    .filter(filterNotFalsy)
    .join(" ");

const hasDateFin = (
  periode: InseePeriodeEtablissment,
): periode is InseePeriodeEtablissmentWithDateFin =>
  periode.dateFin !== undefined;

const getIsActive = ({
  uniteLegale,
  periodesEtablissement,
}: InseeApiRawEstablishment) => {
  const periodesEtablissementWithDateFin =
    periodesEtablissement.filter(hasDateFin);
  const lastPeriod = periodesEtablissementWithDateFin.find(
    ({ dateFin }) => dateFin === null,
  );
  if (!lastPeriod) return false;

  return (
    uniteLegale.etatAdministratifUniteLegale === "A" &&
    lastPeriod.etatAdministratifEtablissement === "A"
  );
};

const getNumberEmployeesRange = ({
  uniteLegale,
}: InseeApiRawEstablishment): NumberEmployeesRange => {
  const tefenCode = uniteLegale.trancheEffectifsUniteLegale;
  if (!tefenCode || tefenCode === "NN") return "";
  return employeeRangeByTefenCode[<TefenCode>+tefenCode];
};

// tefenCode is a French standard code for the number of employees in a company.
type TefenCode =
  | -1
  | 0
  | 1
  | 2
  | 3
  | 11
  | 12
  | 21
  | 22
  | 31
  | 32
  | 41
  | 42
  | 51
  | 52
  | 53;

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
