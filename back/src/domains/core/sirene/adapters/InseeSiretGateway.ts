import Bottleneck from "bottleneck";
import { format, formatISO } from "date-fns";
import {
  NafDto,
  NumberEmployeesRange,
  OmitFromExistingKeys,
  SiretDto,
  SiretEstablishmentDto,
  errors,
  filterNotFalsy,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  AccessTokenResponse,
  InseeAccessTokenConfig,
} from "../../../../config/bootstrap/appConfig";
import { partnerNames } from "../../../../config/bootstrap/partnerNames";
import { createLogger } from "../../../../utils/logger";
import { InMemoryCachingGateway } from "../../caching-gateway/adapters/InMemoryCachingGateway";
import { RetryStrategy } from "../../retry-strategy/ports/RetryStrategy";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { SiretGateway } from "../ports/SirenGateway";
import { InseeExternalRoutes } from "./InseeSiretGateway.routes";

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

  readonly #config: InseeAccessTokenConfig;
  readonly #httpClient: HttpClient<InseeExternalRoutes>;

  readonly #timeGateway: TimeGateway;

  readonly #caching: InMemoryCachingGateway<AccessTokenResponse>;

  constructor(
    config: InseeAccessTokenConfig,
    httpClient: HttpClient<InseeExternalRoutes>,
    timeGateway: TimeGateway,
    retryStrategy: RetryStrategy,
    caching: InMemoryCachingGateway<AccessTokenResponse>,
  ) {
    this.#config = config;
    this.#retryStrategy = retryStrategy;
    this.#timeGateway = timeGateway;
    this.#caching = caching;
    this.#httpClient = httpClient;
  }

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SiretEstablishmentDto | undefined> {
    return this.#retryStrategy.apply(async () => {
      const response = await this.#limiter.schedule(async () =>
        this.#httpClient.getEstablishmentBySiret({
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            Authorization: `Bearer ${
              (await this.#getAccessToken()).access_token
            }`,
          },
          queryParams: this.#createSiretQueryParams(
            siret,
            includeClosedEstablishments,
          ),
        }),
      );
      if (response.status === 404) return;
      if (response.status === 200) {
        const establishment = response.body.etablissements.at(0);
        if (!establishment) return;
        return convertSirenRawEstablishmentToSirenEstablishmentDto(
          establishment,
        );
      }

      if ([429, 503].includes(response.status)) {
        throw errors.siretApi.tooManyRequests({
          serviceName: partnerNames.inseeSiret,
        });
      }

      logger.error({
        message: `INSEE API Failed with ${response.status} : ${JSON.stringify(
          response.body,
          null,
          2,
        )}`,
      });

      throw errors.siretApi.unavailable({
        serviceName: partnerNames.inseeSiret,
        message: `${response.status} - ${
          response.body.header?.message ?? JSON.stringify(response.body)
        }`,
      });
    });
  }

  public async getEstablishmentUpdatedBetween(
    fromDate: Date,
    toDate: Date,
    sirets: SiretDto[],
  ): Promise<Record<SiretDto, SiretEstablishmentDto>> {
    const formattedFromDate = format(fromDate, "yyyy-MM-dd");
    const formattedToDate = format(toDate, "yyyy-MM-dd");

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

    const response = await this.#httpClient.getEstablishmentUpdatedBetween({
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Bearer ${(await this.#getAccessToken()).access_token}`,
      },
      body: requestBody,
    });

    if (response.status === 404) return {};

    if ([429, 503].includes(response.status)) {
      throw errors.siretApi.tooManyRequests({
        serviceName: partnerNames.inseeSiret,
      });
    }

    if (response.status !== 200) {
      logger.error({
        message: `INSEE API Failed with ${response.status} : ${JSON.stringify(
          response.body,
          null,
          2,
        )}`,
      });

      throw new Error(
        `INSEE API Failed with ${response.status}. More logs in datadog.`,
      );
    }

    return response.body.etablissements.reduce(
      (acc, establishment) => ({
        ...acc,
        [establishment.siret]:
          convertSirenRawEstablishmentToSirenEstablishmentDto(establishment),
      }),
      {} satisfies Record<SiretDto, SiretEstablishmentDto>,
    );
  }

  async #getAccessToken() {
    return this.#caching.caching(this.#config.clientId, () =>
      this.#retryStrategy.apply(() =>
        this.#tokenLimiter.schedule(() => {
          return this.#httpClient
            .getAccessToken({
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "password",
                client_id: this.#config.clientId,
                client_secret: this.#config.clientSecret,
                username: this.#config.username,
                password: this.#config.password,
              }).toString(),
            })
            .then((response) => {
              if (response?.status === 200) return response.body;
              throw new Error(
                `Could not access INSEE SIREN API. Status: ${
                  response?.status
                }. Body: ${JSON.stringify(response?.body)}`,
              );
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

export type SirenGatewayAnswer = {
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
