import axios from "axios";
import { configureHttpClient, createAxiosHandlerCreator } from "http-client";
import { Pool } from "pg";
import {
  exhaustiveCheck,
  immersionFacileContactEmail,
  pipeWithValue,
} from "shared";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { DocumentGateway } from "../../../domain/generic/fileManagement/port/DocumentGateway";
import { InclusionConnectGateway } from "../../../domain/inclusionConnect/port/InclusionConnectGateway";
import { createLogger } from "../../../utils/logger";
import {
  createHttpAddressClient,
  HttpAddressGateway,
} from "../../secondary/addressGateway/HttpAddressGateway";
import {
  addressesExternalTargets,
  AddressesTargets,
} from "../../secondary/addressGateway/HttpAddressGateway.targets";
import { InMemoryAddressGateway } from "../../secondary/addressGateway/InMemoryAddressGateway";
import { CachingAccessTokenGateway } from "../../secondary/core/CachingAccessTokenGateway";
import { MetabaseDashboardGateway } from "../../secondary/dashboardGateway/MetabaseDashboardGateway";
import { StubDashboardGateway } from "../../secondary/dashboardGateway/StubDashboardGateway";
import { HybridEmailGateway } from "../../secondary/emailGateway/HybridEmailGateway";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueHtmlEmailGateway } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway";

import { InMemoryAccessTokenGateway } from "../../secondary/immersionOffer/InMemoryAccessTokenGateway";
import { HttpLaBonneBoiteAPI } from "../../secondary/immersionOffer/laBonneBoite/HttpLaBonneBoiteAPI";
import { InMemoryLaBonneBoiteAPI } from "../../secondary/immersionOffer/laBonneBoite/InMemoryLaBonneBoiteAPI";
import { HttpPassEmploiGateway } from "../../secondary/immersionOffer/passEmploi/HttpPassEmploiGateway";
import { InMemoryPassEmploiGateway } from "../../secondary/immersionOffer/passEmploi/InMemoryPassEmploiGateway";
import { HttpPoleEmploiGateway } from "../../secondary/immersionOffer/poleEmploi/HttpPoleEmploiGateway";
import { InMemoryPoleEmploiGateway } from "../../secondary/immersionOffer/poleEmploi/InMemoryPoleEmploiGateway";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { HttpInclusionConnectGateway } from "../../secondary/InclusionConnectGateway/HttpInclusionConnectGateway";
import { makeInclusionConnectExternalTargets } from "../../secondary/InclusionConnectGateway/inclusionConnectExternal.targets";
import { InMemoryInclusionConnectGateway } from "../../secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { NotImplementedDocumentGateway } from "../../secondary/NotImplementedDocumentGateway";
import { HttpPeConnectGateway } from "../../secondary/PeConnectGateway/HttpPeConnectGateway";
import { InMemoryPeConnectGateway } from "../../secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { makePeConnectExternalTargets } from "../../secondary/PeConnectGateway/peConnectApi.targets";
import { ExcelExportGateway } from "../../secondary/reporting/ExcelExportGateway";
import { InMemoryExportGateway } from "../../secondary/reporting/InMemoryExportGateway";
import { S3DocumentGateway } from "../../secondary/S3DocumentGateway";
import { HttpSirenGateway } from "../../secondary/sirene/HttpSirenGateway";
import { InMemorySirenGateway } from "../../secondary/sirene/InMemorySirenGateway";
import { AppConfig, makeEmailAllowListPredicate } from "./appConfig";
import { CustomTimeGateway } from "../../secondary/core/TimeGateway/CustomTimeGateway";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { InMemoryEmailValidationGateway } from "../../secondary/emailValidationGateway/InMemoryEmailValidationStatusGateway";

const logger = createLogger(__filename);

const AXIOS_TIMEOUT_MS = 10_000;

const axiosHandlerCreator = createAxiosHandlerCreator(
  axios.create({
    timeout: AXIOS_TIMEOUT_MS,
  }),
);

const createHttpClientForExternalApi = configureHttpClient(axiosHandlerCreator);

export type GetPgPoolFn = () => Pool;
export const createGetPgPoolFn = (config: AppConfig): GetPgPoolFn => {
  let pgPool: Pool;
  return () => {
    if (config.repositories !== "PG" && config.romeRepository !== "PG")
      throw new Error(
        `Unexpected pg pool creation: REPOSITORIES=${config.repositories},
         ROME_GATEWAY=${config.romeRepository}`,
      );
    if (!pgPool) {
      const { host, pathname } = new URL(config.pgImmersionDbUrl);
      logger.info({ host, pathname }, "creating postgresql connection pool");
      pgPool = new Pool({
        connectionString: config.pgImmersionDbUrl,
        application_name: "Immersion Backend",
        max: 25,
        statement_timeout: 30_000,
        // statement_timeout is important as it avoids never ending queries.
        // We have had problems with eventBus not triggered due to never ending PG queries
      });
    }
    return pgPool;
  };
};

// prettier-ignore
export type Gateways = ReturnType<typeof createGateways> extends Promise<infer T>
  ? T
  : never;

// eslint-disable-next-line @typescript-eslint/require-await
export const createGateways = async (config: AppConfig) => {
  logger.info({
    emailGateway: config.emailGateway,
    repositories: config.repositories,
    romeRepository: config.romeRepository,
    sirenGateway: config.sirenGateway,
    apiAddress: config.apiAddress,
  });

  const cachingAccessTokenGateway = [
    config.laBonneBoiteGateway,
    config.poleEmploiGateway,
  ].includes("HTTPS")
    ? new CachingAccessTokenGateway(
        new PoleEmploiAccessTokenGateway(
          config.poleEmploiAccessTokenConfig,
          noRateLimit,
          noRetries,
        ),
      )
    : new InMemoryAccessTokenGateway();

  const timeGateway =
    config.timeGateway === "CUSTOM"
      ? new CustomTimeGateway()
      : new RealTimeGateway();

  return {
    addressApi: createAddressGateway(config),
    dashboardGateway: createDashboardGateway(config),
    documentGateway: createDocumentGateway(config),
    email: createEmailGateway(config, timeGateway),
    emailValidationGateway: createEmailValidationGateway(config),
    exportGateway:
      config.reporting === "EXCEL"
        ? new ExcelExportGateway()
        : new InMemoryExportGateway(),
    inclusionConnectGateway: createInclusionConnectGateway(config),
    laBonneBoiteAPI:
      config.laBonneBoiteGateway === "HTTPS"
        ? new HttpLaBonneBoiteAPI(
            config.peApiUrl,
            cachingAccessTokenGateway,
            config.poleEmploiClientId,
            noRateLimit,
            noRetries,
          )
        : new InMemoryLaBonneBoiteAPI(),
    passEmploiGateway:
      config.passEmploiGateway === "HTTPS"
        ? new HttpPassEmploiGateway(config.passEmploiUrl, config.passEmploiKey)
        : new InMemoryPassEmploiGateway(),
    peConnectGateway: createPoleEmploiConnectGateway(config),
    poleEmploiGateway:
      config.poleEmploiGateway === "HTTPS"
        ? new HttpPoleEmploiGateway(
            config.peApiUrl,
            cachingAccessTokenGateway,
            config.poleEmploiClientId,
            noRateLimit,
            noRetries,
          )
        : new InMemoryPoleEmploiGateway(),
    timeGateway,
    siren:
      config.sirenGateway === "HTTPS"
        ? new HttpSirenGateway(
            config.sirenHttpConfig,
            timeGateway,
            noRateLimit,
            noRetries,
          )
        : new InMemorySirenGateway(),
  };
};

const createEmailGateway = (
  config: AppConfig,
  timeGateway: TimeGateway,
): EmailGateway => {
  if (config.emailGateway === "IN_MEMORY")
    return new InMemoryEmailGateway(timeGateway);

  const sendinblueHtmlEmailGateway = new SendinblueHtmlEmailGateway(
    axios,
    makeEmailAllowListPredicate({
      skipEmailAllowList: config.skipEmailAllowlist,
      emailAllowList: config.emailAllowList,
    }),
    config.apiKeySendinblue,
    {
      name: "Immersion Facilitée",
      email: immersionFacileContactEmail,
    },
  );

  if (config.emailGateway === "SENDINBLUE_HTML") {
    return sendinblueHtmlEmailGateway;
  }

  if (config.emailGateway === "HYBRID")
    return new HybridEmailGateway(
      sendinblueHtmlEmailGateway,
      new InMemoryEmailGateway(timeGateway, 15),
    );

  return exhaustiveCheck(config.emailGateway, {
    variableName: "config.emailGateway",
    throwIfReached: true,
  });
};

const createPoleEmploiConnectGateway = (config: AppConfig) =>
  config.peConnectGateway === "HTTPS"
    ? new HttpPeConnectGateway(
        pipeWithValue(
          {
            peApiUrl: config.peApiUrl,
            peAuthCandidatUrl: config.peAuthCandidatUrl,
          },
          makePeConnectExternalTargets,
          createHttpClientForExternalApi,
        ),
        {
          immersionFacileBaseUrl: config.immersionFacileBaseUrl,
          poleEmploiClientId: config.poleEmploiClientId,
          poleEmploiClientSecret: config.poleEmploiClientSecret,
        },
      )
    : new InMemoryPeConnectGateway();

const createInclusionConnectGateway = (
  config: AppConfig,
): InclusionConnectGateway =>
  config.inclusionConnectGateway === "HTTPS"
    ? new HttpInclusionConnectGateway(
        pipeWithValue(
          config.inclusionConnectConfig.inclusionConnectBaseUri,
          makeInclusionConnectExternalTargets,
          createHttpClientForExternalApi,
        ),
        config.inclusionConnectConfig,
      )
    : new InMemoryInclusionConnectGateway();

const createAddressGateway = (config: AppConfig) =>
  ({
    IN_MEMORY: () => new InMemoryAddressGateway(),
    OPEN_CAGE_DATA: () =>
      new HttpAddressGateway(
        createHttpAddressClient<AddressesTargets>(addressesExternalTargets),
        config.apiKeyOpenCageDataGeocoding,
        config.apiKeyOpenCageDataGeosearch,
      ),
  }[config.apiAddress]());

const createEmailValidationGateway = (config: AppConfig) =>
  ({
    IN_MEMORY: () => new InMemoryEmailValidationGateway(),
    EMAILABLE: () =>
      new EmailableValidationGateway(
        createHttpAddressClient<AddressesTargets>(addressesExternalTargets),
        config.apiKeyOpenCageDataGeocoding,
        config.apiKeyOpenCageDataGeosearch,
      ),
  }[config.emailValidationGateway]());

const createDocumentGateway = (config: AppConfig): DocumentGateway => {
  switch (config.documentGateway) {
    case "S3":
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return new S3DocumentGateway(config.cellarS3Params!);
    case "NONE":
      return new NotImplementedDocumentGateway();
    default: {
      const exhaustiveCheck: never = config.documentGateway;
      logger.error(
        "Should not have been reached (Document Gateway declaration)",
      );
      return exhaustiveCheck;
    }
  }
};

const createDashboardGateway = (config: AppConfig): DashboardGateway =>
  config.dashboard === "METABASE"
    ? new MetabaseDashboardGateway(
        config.metabase.metabaseUrl,
        config.metabase.metabaseApiKey,
      )
    : new StubDashboardGateway();
