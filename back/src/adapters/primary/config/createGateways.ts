import axios from "axios";
import { Pool } from "pg";
import { exhaustiveCheck, immersionFacileNoReplyEmailSender } from "shared";
import type { UnknownSharedRoute } from "shared-routes";
import { createAxiosSharedClient } from "shared-routes/axios";
import { GetAccessTokenResponse } from "../../../domain/convention/ports/PoleEmploiGateway";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { DocumentGateway } from "../../../domain/generic/fileManagement/port/DocumentGateway";
import { PdfGeneratorGateway } from "../../../domain/generic/htmlToPdf/PdfGeneratorGateway";
import { NotificationGateway } from "../../../domain/generic/notifications/ports/NotificationGateway";
import { InclusionConnectGateway } from "../../../domain/inclusionConnect/port/InclusionConnectGateway";
import { PeConnectGateway } from "../../../domain/peConnect/port/PeConnectGateway";
import { createLogger } from "../../../utils/logger";
import { HttpAddressGateway } from "../../secondary/addressGateway/HttpAddressGateway";
import { addressesExternalRoutes } from "../../secondary/addressGateway/HttpAddressGateway.routes";
import { InMemoryAddressGateway } from "../../secondary/addressGateway/InMemoryAddressGateway";
import { InMemoryCachingGateway } from "../../secondary/core/InMemoryCachingGateway";
import { CustomTimeGateway } from "../../secondary/core/TimeGateway/CustomTimeGateway";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { MetabaseDashboardGateway } from "../../secondary/dashboardGateway/MetabaseDashboardGateway";
import { StubDashboardGateway } from "../../secondary/dashboardGateway/StubDashboardGateway";
import { NotImplementedDocumentGateway } from "../../secondary/documentGateway/NotImplementedDocumentGateway";
import { S3DocumentGateway } from "../../secondary/documentGateway/S3DocumentGateway";
import { EmailableEmailValidationGateway } from "../../secondary/emailValidationGateway/EmailableEmailValidationGateway";
import { emailableValidationRoutes } from "../../secondary/emailValidationGateway/EmailableEmailValidationGateway.routes";
import { InMemoryEmailValidationGateway } from "../../secondary/emailValidationGateway/InMemoryEmailValidationGateway";
import { HttpInclusionConnectGateway } from "../../secondary/InclusionConnectGateway/HttpInclusionConnectGateway";
import { makeInclusionConnectExternalRoutes } from "../../secondary/InclusionConnectGateway/inclusionConnectExternalRoutes";
import { InMemoryInclusionConnectGateway } from "../../secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { BrevoNotificationGateway } from "../../secondary/notificationGateway/BrevoNotificationGateway";
import { brevoNotificationGatewayRoutes } from "../../secondary/notificationGateway/BrevoNotificationGateway.routes";
import { InMemoryNotificationGateway } from "../../secondary/notificationGateway/InMemoryNotificationGateway";
import { HttpLaBonneBoiteGateway } from "../../secondary/offer/laBonneBoite/HttpLaBonneBoiteGateway";
import { InMemoryLaBonneBoiteGateway } from "../../secondary/offer/laBonneBoite/InMemoryLaBonneBoiteGateway";
import { createLbbRoutes } from "../../secondary/offer/laBonneBoite/LaBonneBoite.routes";
import { HttpPassEmploiGateway } from "../../secondary/offer/passEmploi/HttpPassEmploiGateway";
import { InMemoryPassEmploiGateway } from "../../secondary/offer/passEmploi/InMemoryPassEmploiGateway";
import { InMemoryPdfGeneratorGateway } from "../../secondary/pdfGeneratorGateway/InMemoryPdfGeneratorGateway";
import { PuppeteerPdfGeneratorGateway } from "../../secondary/pdfGeneratorGateway/PuppeteerPdfGeneratorGateway";
import {
  makeScalingoPdfGeneratorRoutes,
  ScalingoPdfGeneratorGateway,
} from "../../secondary/pdfGeneratorGateway/ScalingoPdfGeneratorGateway";
import { HttpPeConnectGateway } from "../../secondary/PeConnectGateway/HttpPeConnectGateway";
import { InMemoryPeConnectGateway } from "../../secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { makePeConnectExternalRoutes } from "../../secondary/PeConnectGateway/peConnectApi.routes";
import { HttpPoleEmploiGateway } from "../../secondary/poleEmploi/HttpPoleEmploiGateway";
import { InMemoryPoleEmploiGateway } from "../../secondary/poleEmploi/InMemoryPoleEmploiGateway";
import { createPoleEmploiRoutes } from "../../secondary/poleEmploi/PoleEmploiRoutes";
import { DeterministShortLinkIdGeneratorGateway } from "../../secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { NanoIdShortLinkIdGeneratorGateway } from "../../secondary/shortLinkIdGeneratorGateway/NanoIdShortLinkIdGeneratorGateway";
import { AnnuaireDesEntreprisesSiretGateway } from "../../secondary/siret/AnnuaireDesEntreprisesSiretGateway";
import { annuaireDesEntreprisesSiretRoutes } from "../../secondary/siret/AnnuaireDesEntreprisesSiretGateway.routes";
import { InMemorySiretGateway } from "../../secondary/siret/InMemorySiretGateway";
import { InseeSiretGateway } from "../../secondary/siret/InseeSiretGateway";
import { HttpSubscribersGateway } from "../../secondary/subscribersGateway/HttpSubscribersGateway";
import { InMemorySubscribersGateway } from "../../secondary/subscribersGateway/InMemorySubscribersGateway";
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
export type Gateways = ReturnType<typeof createGateways> extends Promise<infer T>
  ? T
  : never;

export const createGateways = async (
  config: AppConfig,
  uuidGenerator: UuidGenerator,
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  logger.info({
    notificationGateway: config.notificationGateway,
    repositories: config.repositories,
    romeRepository: config.romeRepository,
    siretGateway: config.siretGateway,
    apiAddress: config.apiAddress,
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
          new InMemoryCachingGateway<GetAccessTokenResponse>(
            timeGateway,
            "expires_in",
          ),
          config.peApiUrl,
          config.poleEmploiAccessTokenConfig,
          noRetries,
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

  const inclusionConnectGateway: InclusionConnectGateway =
    config.inclusionConnectGateway === "HTTPS"
      ? new HttpInclusionConnectGateway(
          createAxiosHttpClientForExternalAPIs(
            makeInclusionConnectExternalRoutes(
              config.inclusionConnectConfig.inclusionConnectBaseUri,
            ),
          ),
          config.inclusionConnectConfig,
        )
      : new InMemoryInclusionConnectGateway();

  const createEmailValidationGateway = (config: AppConfig) =>
    ({
      IN_MEMORY: () => new InMemoryEmailValidationGateway(),
      EMAILABLE: () =>
        new EmailableEmailValidationGateway(
          createAxiosHttpClientForExternalAPIs(emailableValidationRoutes),
          config.emailableApiKey,
        ),
    }[config.emailValidationGateway]());

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
      PUPPETEER: () => new PuppeteerPdfGeneratorGateway(uuidGenerator),
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
    dashboardGateway: createDashboardGateway(config),
    documentGateway: createDocumentGateway(config),
    notification: createNotificationGateway(config, timeGateway),
    emailValidationGateway: createEmailValidationGateway(config),

    inclusionConnectGateway,
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
