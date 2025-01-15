import axios, { AxiosInstance } from "axios";
import { Pool } from "pg";
import { exhaustiveCheck, immersionFacileNoReplyEmailSender } from "shared";
import type { UnknownSharedRoute } from "shared-routes";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createFetchSharedClient } from "shared-routes/fetch";
import { createFranceTravailRoutes } from "../../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../../domains/convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { InMemoryFranceTravailGateway } from "../../domains/convention/adapters/france-travail-gateway/InMemoryFranceTravailGateway";
import { HttpAddressGateway } from "../../domains/core/address/adapters/HttpAddressGateway";
import { addressesExternalRoutes } from "../../domains/core/address/adapters/HttpAddressGateway.routes";
import { InMemoryAddressGateway } from "../../domains/core/address/adapters/InMemoryAddressGateway";
import { HttpSubscribersGateway } from "../../domains/core/api-consumer/adapters/HttpSubscribersGateway";
import { InMemorySubscribersGateway } from "../../domains/core/api-consumer/adapters/InMemorySubscribersGateway";
import { HttpFtConnectGateway } from "../../domains/core/authentication/ft-connect/adapters/ft-connect-gateway/HttpFtConnectGateway";
import { InMemoryFtConnectGateway } from "../../domains/core/authentication/ft-connect/adapters/ft-connect-gateway/InMemoryFtConnectGateway";
import { makeFtConnectExternalRoutes } from "../../domains/core/authentication/ft-connect/adapters/ft-connect-gateway/ftConnectApi.routes";
import { FtConnectGateway } from "../../domains/core/authentication/ft-connect/port/FtConnectGateway";
import { HttpOAuthGateway } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/HttpOAuthGateway";
import { InMemoryOAuthGateway } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/InMemoryOAuthGateway";
import { makeInclusionConnectRoutes } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/inclusionConnect.routes";
import { makeProConnectRoutes } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/proConnect.routes";
import { OAuthGateway } from "../../domains/core/authentication/inclusion-connect/port/OAuthGateway";
import { InMemoryCachingGateway } from "../../domains/core/caching-gateway/adapters/InMemoryCachingGateway";
import { MetabaseDashboardGateway } from "../../domains/core/dashboard/adapters/MetabaseDashboardGateway";
import { StubDashboardGateway } from "../../domains/core/dashboard/adapters/StubDashboardGateway";
import { DashboardGateway } from "../../domains/core/dashboard/port/DashboardGateway";
import { EmailableEmailValidationGateway } from "../../domains/core/email-validation/adapters/EmailableEmailValidationGateway";
import { emailableValidationRoutes } from "../../domains/core/email-validation/adapters/EmailableEmailValidationGateway.routes";
import { InMemoryEmailValidationGateway } from "../../domains/core/email-validation/adapters/InMemoryEmailValidationGateway";
import { NotImplementedDocumentGateway } from "../../domains/core/file-storage/adapters/NotImplementedDocumentGateway";
import { S3DocumentGateway } from "../../domains/core/file-storage/adapters/S3DocumentGateway";
import { DocumentGateway } from "../../domains/core/file-storage/port/DocumentGateway";
import { BrevoNotificationGateway } from "../../domains/core/notifications/adapters/BrevoNotificationGateway";
import { brevoNotificationGatewayRoutes } from "../../domains/core/notifications/adapters/BrevoNotificationGateway.routes";
import { InMemoryNotificationGateway } from "../../domains/core/notifications/adapters/InMemoryNotificationGateway";
import { NotificationGateway } from "../../domains/core/notifications/ports/NotificationGateway";
import { InMemoryPdfGeneratorGateway } from "../../domains/core/pdf-generation/adapters/InMemoryPdfGeneratorGateway";
import {
  ScalingoPdfGeneratorGateway,
  makeScalingoPdfGeneratorRoutes,
} from "../../domains/core/pdf-generation/adapters/ScalingoPdfGeneratorGateway";
import { PdfGeneratorGateway } from "../../domains/core/pdf-generation/ports/PdfGeneratorGateway";
import { noRetries } from "../../domains/core/retry-strategy/ports/RetryStrategy";
import { DiagorienteAppellationsGateway } from "../../domains/core/rome/adapters/DiagorienteAppellationsGateway";
import {
  DiagorienteAccessTokenResponse,
  diagorienteAppellationsRoutes,
  diagorienteTokenScope,
} from "../../domains/core/rome/adapters/DiagorienteAppellationsGateway.routes";
import { InMemoryAppellationsGateway } from "../../domains/core/rome/adapters/InMemoryAppellationsGateway";
import { DeterministShortLinkIdGeneratorGateway } from "../../domains/core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { NanoIdShortLinkIdGeneratorGateway } from "../../domains/core/short-link/adapters/short-link-generator-gateway/NanoIdShortLinkIdGeneratorGateway";
import { AnnuaireDesEntreprisesSiretGateway } from "../../domains/core/sirene/adapters/AnnuaireDesEntreprisesSiretGateway";
import { annuaireDesEntreprisesSiretRoutes } from "../../domains/core/sirene/adapters/AnnuaireDesEntreprisesSiretGateway.routes";
import { InMemorySiretGateway } from "../../domains/core/sirene/adapters/InMemorySiretGateway";
import { InseeSiretGateway } from "../../domains/core/sirene/adapters/InseeSiretGateway";
import { CustomTimeGateway } from "../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { RealTimeGateway } from "../../domains/core/time-gateway/adapters/RealTimeGateway";
import { TimeGateway } from "../../domains/core/time-gateway/ports/TimeGateway";
import { UuidGenerator } from "../../domains/core/uuid-generator/ports/UuidGenerator";
import { HttpLaBonneBoiteGateway } from "../../domains/establishment/adapters/la-bonne-boite/HttpLaBonneBoiteGateway";
import { InMemoryLaBonneBoiteGateway } from "../../domains/establishment/adapters/la-bonne-boite/InMemoryLaBonneBoiteGateway";
import { createLbbRoutes } from "../../domains/establishment/adapters/la-bonne-boite/LaBonneBoite.routes";
import { HttpPassEmploiGateway } from "../../domains/establishment/adapters/pass-emploi/HttpPassEmploiGateway";
import { InMemoryPassEmploiGateway } from "../../domains/establishment/adapters/pass-emploi/InMemoryPassEmploiGateway";
import { brevoContactRoutes } from "../../domains/marketing/adapters/establishmentMarketingGateway/BrevoContact.routes";
import { BrevoEstablishmentMarketingGateway } from "../../domains/marketing/adapters/establishmentMarketingGateway/BrevoEstablishmentMarketingGateway";
import { InMemoryEstablishmentMarketingGateway } from "../../domains/marketing/adapters/establishmentMarketingGateway/InMemoryEstablishmentMarketingGateway";
import { createLogger } from "../../utils/logger";
import {
  AccessTokenResponse,
  AppConfig,
  makeEmailAllowListPredicate,
} from "./appConfig";
import { getWithCache } from "./cache";
import { logPartnerResponses } from "./logPartnerResponses";
import { partnerNames } from "./partnerNames";

const logger = createLogger(__filename);

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
      logger.info({
        message: `creating postgresql connection pool from host=${host} and pathname=${pathname}`,
      });
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

const configureCreateAxiosHttpClientForExternalAPIs =
  (config: AppConfig) =>
  <R extends Record<string, UnknownSharedRoute>>({
    routes,
    partnerName,
    axiosInstance = axios.create({ timeout: config.externalAxiosTimeout }),
  }: {
    routes: R;
    partnerName: string;
    axiosInstance?: AxiosInstance;
  }) =>
    createAxiosSharedClient(routes, axiosInstance, {
      skipResponseValidation: true,
      onResponseSideEffect: logPartnerResponses(partnerName),
    });

const configureCreateFetchHttpClientForExternalAPIs =
  () =>
  <R extends Record<string, UnknownSharedRoute>>({
    routes,
    partnerName,
  }: {
    routes: R;
    partnerName: string;
  }) =>
    createFetchSharedClient(routes, fetch, {
      skipResponseValidation: true,
      onResponseSideEffect: logPartnerResponses(partnerName),
    });

export type Gateways = ReturnType<typeof createGateways> extends Promise<
  infer T
>
  ? T
  : never;

export const createGateways = async (
  config: AppConfig,
  uuidGenerator: UuidGenerator,
) => {
  //TODO: toujours nécéssaire de log ces configs d'adapters?
  logger.info({
    adapters: {
      notificationGateway: config.notificationGateway,
      repositories: config.repositories,
      romeRepository: config.romeRepository,
      siretGateway: config.siretGateway,
      apiAddress: config.apiAddress,
    },
  });

  const createFetchHttpClientForExternalAPIs =
    configureCreateFetchHttpClientForExternalAPIs();

  const createLegacyAxiosHttpClientForExternalAPIs =
    configureCreateAxiosHttpClientForExternalAPIs(config);

  const timeGateway =
    config.timeGateway === "CUSTOM"
      ? new CustomTimeGateway()
      : new RealTimeGateway();

  const franceTravailGateway =
    config.franceTravailGateway === "HTTPS"
      ? new HttpFranceTravailGateway(
          createLegacyAxiosHttpClientForExternalAPIs({
            partnerName: partnerNames.franceTravailApi,
            routes: createFranceTravailRoutes(config.ftApiUrl),
          }),
          new InMemoryCachingGateway<AccessTokenResponse>(
            timeGateway,
            "expires_in",
          ),
          config.ftApiUrl,
          config.franceTravailAccessTokenConfig,
          noRetries,
          config.envType === "dev",
        )
      : new InMemoryFranceTravailGateway();

  const { withCache, disconnectCache } = await getWithCache(config);

  const ftConnectGateway: FtConnectGateway =
    config.ftConnectGateway === "HTTPS"
      ? new HttpFtConnectGateway(
          createLegacyAxiosHttpClientForExternalAPIs({
            partnerName: partnerNames.franceTravailConnect,
            routes: makeFtConnectExternalRoutes({
              ftApiUrl: config.ftApiUrl,
              ftAuthCandidatUrl: config.ftAuthCandidatUrl,
            }),
          }),
          {
            immersionFacileBaseUrl: config.immersionFacileBaseUrl,
            franceTravailClientId: config.franceTravailClientId,
            franceTravailClientSecret: config.franceTravailClientSecret,
          },
        )
      : new InMemoryFtConnectGateway();

  const oAuthGateway: OAuthGateway =
    config.inclusionConnectGateway === "HTTPS"
      ? new HttpOAuthGateway(
          createLegacyAxiosHttpClientForExternalAPIs({
            partnerName: partnerNames.inclusionConnect,
            routes: makeInclusionConnectRoutes(
              config.inclusionConnectConfig.providerBaseUri,
            ),
          }),
          createLegacyAxiosHttpClientForExternalAPIs({
            partnerName: partnerNames.proConnect,
            routes: makeProConnectRoutes(
              config.proConnectConfig.providerBaseUri,
            ),
          }),
          config.inclusionConnectConfig,
          config.proConnectConfig,
        )
      : new InMemoryOAuthGateway(config.inclusionConnectConfig);

  const createEmailValidationGateway = (config: AppConfig) =>
    ({
      IN_MEMORY: () => new InMemoryEmailValidationGateway(),
      EMAILABLE: () =>
        new EmailableEmailValidationGateway(
          createFetchHttpClientForExternalAPIs({
            partnerName: partnerNames.emailable,
            routes: emailableValidationRoutes,
          }),
          config.emailableApiKey,
          withCache,
        ),
    })[config.emailValidationGateway]();

  const appellationsGateway = (config: AppConfig) =>
    ({
      IN_MEMORY: () => new InMemoryAppellationsGateway(),
      DIAGORIENTE: () =>
        new DiagorienteAppellationsGateway(
          createFetchHttpClientForExternalAPIs({
            partnerName: partnerNames.diagoriente,
            routes: diagorienteAppellationsRoutes,
          }),
          new InMemoryCachingGateway<DiagorienteAccessTokenResponse>(
            timeGateway,
            diagorienteTokenScope,
          ),
          {
            clientId: config.diagorienteApiClientId,
            clientSecret: config.diagorienteApiClientSecret,
          },
        ),
    })[config.appellationsGateway]();

  const addressGateway = {
    IN_MEMORY: () => new InMemoryAddressGateway(),
    OPEN_CAGE_DATA: () =>
      new HttpAddressGateway(
        createFetchHttpClientForExternalAPIs({
          partnerName: partnerNames.openCageData,
          routes: addressesExternalRoutes,
        }),
        config.apiKeyOpenCageDataGeocoding,
        config.apiKeyOpenCageDataGeosearch,
        withCache,
      ),
  }[config.apiAddress]();

  const createNotificationGateway = (
    config: AppConfig,
    timeGateway: TimeGateway,
  ): NotificationGateway => {
    if (config.notificationGateway === "IN_MEMORY")
      return new InMemoryNotificationGateway(timeGateway);

    const brevoNotificationGateway = new BrevoNotificationGateway(
      {
        httpClient: createFetchHttpClientForExternalAPIs({
          partnerName: partnerNames.brevoNotifications,
          routes: brevoNotificationGatewayRoutes,
        }),
        blackListedEmailDomains: config.emailDomainBlackList,
        defaultSender: immersionFacileNoReplyEmailSender,
        emailAllowListPredicate: makeEmailAllowListPredicate({
          skipEmailAllowList: config.skipEmailAllowlist,
          emailAllowList: config.emailAllowList,
        }),
      },
      config.apiKeyBrevo,
    );

    if (config.notificationGateway === "BREVO") {
      return brevoNotificationGateway;
    }

    return exhaustiveCheck(config.notificationGateway, {
      variableName: "config.notificationGateway",
      throwIfReached: true,
    });
  };

  const getSiretGateway = (
    provider: AppConfig["siretGateway"],
    config: AppConfig,
    timeGateway: TimeGateway,
  ) => {
    const gatewayByProvider = {
      HTTPS: () =>
        new InseeSiretGateway(
          config.inseeHttpConfig,
          timeGateway,
          noRetries,
          new InMemoryCachingGateway<AccessTokenResponse>(
            timeGateway,
            "expires_in",
          ),
        ),
      INSEE: () =>
        new InseeSiretGateway(
          config.inseeHttpConfig,
          timeGateway,
          noRetries,
          new InMemoryCachingGateway<AccessTokenResponse>(
            timeGateway,
            "expires_in",
          ),
        ),
      IN_MEMORY: () => new InMemorySiretGateway(),
      ANNUAIRE_DES_ENTREPRISES: () =>
        new AnnuaireDesEntreprisesSiretGateway(
          createFetchHttpClientForExternalAPIs({
            partnerName: partnerNames.annuaireDesEntreprises,
            routes: annuaireDesEntreprisesSiretRoutes,
          }),
          new InseeSiretGateway(
            config.inseeHttpConfig,
            timeGateway,
            noRetries,
            new InMemoryCachingGateway<AccessTokenResponse>(
              timeGateway,
              "expires_in",
            ),
          ),
        ),
    };
    return gatewayByProvider[provider]();
  };

  const createPdfGeneratorGateway = (): PdfGeneratorGateway => {
    const gatewayByOption: Record<
      AppConfig["pdfGeneratorGateway"],
      () => PdfGeneratorGateway
    > = {
      IN_MEMORY: () => new InMemoryPdfGeneratorGateway(),
      SCALINGO: () =>
        new ScalingoPdfGeneratorGateway(
          createLegacyAxiosHttpClientForExternalAPIs({
            partnerName: partnerNames.pdfGenerator,
            routes: makeScalingoPdfGeneratorRoutes(config.pdfGenerator.baseUrl),
            axiosInstance: axios.create({
              timeout: config.externalAxiosTimeout,
              validateStatus: () => true,
            }),
          }),
          config.pdfGenerator.apiKey,
          uuidGenerator,
        ),
    };

    return gatewayByOption[config.pdfGeneratorGateway]();
  };

  return {
    disconnectCache: disconnectCache,
    addressApi: addressGateway,
    appellationsGateway: appellationsGateway(config),
    dashboardGateway: createDashboardGateway(config),
    documentGateway: createDocumentGateway(config),
    notification: createNotificationGateway(config, timeGateway),
    emailValidationGateway: createEmailValidationGateway(config),

    oAuthGateway,
    laBonneBoiteGateway:
      config.laBonneBoiteGateway === "HTTPS"
        ? new HttpLaBonneBoiteGateway(
            createFetchHttpClientForExternalAPIs({
              partnerName: partnerNames.laBonneBoite,
              routes: createLbbRoutes(config.ftApiUrl),
            }),
            franceTravailGateway,
            config.franceTravailClientId,
          )
        : new InMemoryLaBonneBoiteGateway(),
    subscribersGateway:
      config.subscribersGateway === "HTTPS"
        ? new HttpSubscribersGateway(
            axios.create({
              timeout: config.externalAxiosTimeout,
            }),
          )
        : new InMemorySubscribersGateway(),
    passEmploiGateway:
      config.passEmploiGateway === "HTTPS"
        ? new HttpPassEmploiGateway(config.passEmploiUrl, config.passEmploiKey)
        : new InMemoryPassEmploiGateway(),
    pdfGeneratorGateway: createPdfGeneratorGateway(),
    ftConnectGateway,
    franceTravailGateway,
    timeGateway,
    establishmentMarketingGateway:
      config.establishmentMarketingGateway === "BREVO"
        ? new BrevoEstablishmentMarketingGateway({
            apiKey: config.apiKeyBrevo,
            establishmentContactListId: config.brevoEstablishmentContactListId,
            httpClient: createLegacyAxiosHttpClientForExternalAPIs({
              partnerName: partnerNames.brevoEstablishmentMarketing,
              routes: brevoContactRoutes,
              axiosInstance: axios.create({
                timeout: config.externalAxiosTimeout,
                validateStatus: () => true,
              }),
            }),
          })
        : new InMemoryEstablishmentMarketingGateway(),
    siret: getSiretGateway(config.siretGateway, config, timeGateway),
    shortLinkGenerator:
      config.shortLinkIdGeneratorGateway === "NANO_ID"
        ? new NanoIdShortLinkIdGeneratorGateway()
        : new DeterministShortLinkIdGeneratorGateway(),
  };
};

const createDocumentGateway = (config: AppConfig): DocumentGateway => {
  switch (config.documentGateway) {
    case "S3":
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return new S3DocumentGateway(config.cellarS3Params!);
    case "NONE":
      return new NotImplementedDocumentGateway();
    default: {
      const exhaustiveCheck: never = config.documentGateway;
      logger.error({
        message: "Should not have been reached (Document Gateway declaration)",
      });
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
