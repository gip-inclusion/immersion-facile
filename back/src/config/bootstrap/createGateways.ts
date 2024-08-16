import axios from "axios";
import { Pool } from "pg";
import { exhaustiveCheck, immersionFacileNoReplyEmailSender } from "shared";
import type { UnknownSharedRoute } from "shared-routes";
import { createAxiosSharedClient } from "shared-routes/axios";
import { HttpPoleEmploiGateway } from "../../domains/convention/adapters/pole-emploi-gateway/HttpPoleEmploiGateway";
import { InMemoryPoleEmploiGateway } from "../../domains/convention/adapters/pole-emploi-gateway/InMemoryPoleEmploiGateway";
import { createPoleEmploiRoutes } from "../../domains/convention/adapters/pole-emploi-gateway/PoleEmploiRoutes";
import { PoleEmploiGetAccessTokenResponse } from "../../domains/convention/ports/PoleEmploiGateway";
import { HttpAddressGateway } from "../../domains/core/address/adapters/HttpAddressGateway";
import { addressesExternalRoutes } from "../../domains/core/address/adapters/HttpAddressGateway.routes";
import { InMemoryAddressGateway } from "../../domains/core/address/adapters/InMemoryAddressGateway";
import { HttpSubscribersGateway } from "../../domains/core/api-consumer/adapters/HttpSubscribersGateway";
import { InMemorySubscribersGateway } from "../../domains/core/api-consumer/adapters/InMemorySubscribersGateway";
import { HttpOAuthGateway } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/HttpOAuthGateway";
import { InMemoryOAuthGateway } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/InMemoryOAuthGateway";
import { makeInclusionConnectRoutes } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/inclusionConnect.routes";
import { makeProConnectRoutes } from "../../domains/core/authentication/inclusion-connect/adapters/oauth-gateway/proConnect.routes";
import { OAuthGateway } from "../../domains/core/authentication/inclusion-connect/port/OAuthGateway";
import { HttpPeConnectGateway } from "../../domains/core/authentication/pe-connect/adapters/pe-connect-gateway/HttpPeConnectGateway";
import { InMemoryPeConnectGateway } from "../../domains/core/authentication/pe-connect/adapters/pe-connect-gateway/InMemoryPeConnectGateway";
import { makePeConnectExternalRoutes } from "../../domains/core/authentication/pe-connect/adapters/pe-connect-gateway/peConnectApi.routes";
import { PeConnectGateway } from "../../domains/core/authentication/pe-connect/port/PeConnectGateway";
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
import { AppConfig, makeEmailAllowListPredicate } from "./appConfig";

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
  <R extends Record<string, UnknownSharedRoute>>(routes: R) =>
    createAxiosSharedClient(
      routes,
      axios.create({
        timeout: config.externalAxiosTimeout,
      }),
      { skipResponseValidation: true },
    );

// prettier-ignore
export type Gateways = ReturnType<typeof createGateways> extends Promise<
  infer T
>
  ? T
  : never;

export const createGateways = async (
  config: AppConfig,
  uuidGenerator: UuidGenerator,
  // eslint-disable-next-line @typescript-eslint/require-await
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

  const createAxiosHttpClientForExternalAPIs =
    configureCreateAxiosHttpClientForExternalAPIs(config);

  const timeGateway =
    config.timeGateway === "CUSTOM"
      ? new CustomTimeGateway()
      : new RealTimeGateway();

  const poleEmploiGateway =
    config.poleEmploiGateway === "HTTPS"
      ? new HttpPoleEmploiGateway(
          createAxiosHttpClientForExternalAPIs(
            createPoleEmploiRoutes(config.peApiUrl),
          ),
          new InMemoryCachingGateway<PoleEmploiGetAccessTokenResponse>(
            timeGateway,
            "expires_in",
          ),
          config.peApiUrl,
          config.poleEmploiAccessTokenConfig,
          noRetries,
          config.envType === "dev",
        )
      : new InMemoryPoleEmploiGateway();

  const peConnectGateway: PeConnectGateway =
    config.peConnectGateway === "HTTPS"
      ? new HttpPeConnectGateway(
          createAxiosHttpClientForExternalAPIs(
            makePeConnectExternalRoutes({
              peApiUrl: config.peApiUrl,
              peAuthCandidatUrl: config.peAuthCandidatUrl,
            }),
          ),
          {
            immersionFacileBaseUrl: config.immersionFacileBaseUrl,
            poleEmploiClientId: config.poleEmploiClientId,
            poleEmploiClientSecret: config.poleEmploiClientSecret,
          },
        )
      : new InMemoryPeConnectGateway();

  const oAuthGateway: OAuthGateway =
    config.inclusionConnectGateway === "HTTPS"
      ? new HttpOAuthGateway(
          createAxiosHttpClientForExternalAPIs(
            makeInclusionConnectRoutes(
              config.inclusionConnectConfig.inclusionConnectBaseUri,
            ),
          ),
          createAxiosHttpClientForExternalAPIs(
            makeProConnectRoutes(
              config.inclusionConnectConfig.proConnectBaseUri,
            ),
          ),
          config.inclusionConnectConfig,
        )
      : new InMemoryOAuthGateway(config.inclusionConnectConfig);

  const createEmailValidationGateway = (config: AppConfig) =>
    ({
      IN_MEMORY: () => new InMemoryEmailValidationGateway(),
      EMAILABLE: () =>
        new EmailableEmailValidationGateway(
          createAxiosHttpClientForExternalAPIs(emailableValidationRoutes),
          config.emailableApiKey,
        ),
    })[config.emailValidationGateway]();

  const appellationsGateway = (config: AppConfig) =>
    ({
      IN_MEMORY: () => new InMemoryAppellationsGateway(),
      DIAGORIENTE: () =>
        new DiagorienteAppellationsGateway(
          createAxiosHttpClientForExternalAPIs(diagorienteAppellationsRoutes),
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
        createAxiosHttpClientForExternalAPIs(addressesExternalRoutes),
        config.apiKeyOpenCageDataGeocoding,
        config.apiKeyOpenCageDataGeosearch,
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
        httpClient: createAxiosHttpClientForExternalAPIs(
          brevoNotificationGatewayRoutes,
        ),
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
        new InseeSiretGateway(config.inseeHttpConfig, timeGateway, noRetries),
      INSEE: () =>
        new InseeSiretGateway(config.inseeHttpConfig, timeGateway, noRetries),
      IN_MEMORY: () => new InMemorySiretGateway(),
      ANNUAIRE_DES_ENTREPRISES: () =>
        new AnnuaireDesEntreprisesSiretGateway(
          createAxiosHttpClientForExternalAPIs(
            annuaireDesEntreprisesSiretRoutes,
          ),
          new InseeSiretGateway(config.inseeHttpConfig, timeGateway, noRetries),
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
          createAxiosHttpClientForExternalAPIs(
            makeScalingoPdfGeneratorRoutes(config.pdfGenerator.baseUrl),
          ),
          config.pdfGenerator.apiKey,
          uuidGenerator,
        ),
    };

    return gatewayByOption[config.pdfGeneratorGateway]();
  };

  return {
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
            createAxiosHttpClientForExternalAPIs(
              createLbbRoutes(config.peApiUrl),
            ),
            poleEmploiGateway,
            config.poleEmploiClientId,
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
    peConnectGateway,
    poleEmploiGateway,
    timeGateway,
    establishmentMarketingGateway:
      config.establishmentMarketingGateway === "BREVO"
        ? new BrevoEstablishmentMarketingGateway({
            apiKey: config.apiKeyBrevo,
            establishmentContactListId: config.brevoEstablishmentContactListId,
            httpClient:
              createAxiosHttpClientForExternalAPIs(brevoContactRoutes),
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
