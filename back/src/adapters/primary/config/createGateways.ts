import { Pool } from "pg";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { Clock } from "../../../domain/core/ports/Clock";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { createLogger } from "../../../utils/logger";
import { CachingAccessTokenGateway } from "../../secondary/core/CachingAccessTokenGateway";
import { HybridEmailGateway } from "../../secondary/emailGateway/HybridEmailGateway";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueEmailGateway } from "../../secondary/emailGateway/SendinblueEmailGateway";
import {
  createManagedAxiosInstance,
  ErrorMapper,
  TargetMapper,
} from "../shared/src/httpClient/ports/axios.adapter";
import {
  HttpPeConnectGateway,
  makeApiPeConnectUrls,
  PeConnectUrlTargets,
} from "../../secondary/HttpPeConnectGateway";
import { HttpsSireneGateway } from "../../secondary/HttpsSireneGateway";
import { HttpLaBonneBoiteAPI } from "../../secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { HttpPassEmploiGateway } from "../../secondary/immersionOffer/HttpPassEmploiGateway";
import { HttpPoleEmploiGateway } from "../../secondary/immersionOffer/HttpPoleEmploiGateway";
import { InMemoryAccessTokenGateway } from "../../secondary/immersionOffer/InMemoryAccessTokenGateway";
import { InMemoryLaBonneBoiteAPI } from "../../secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryPassEmploiGateway } from "../../secondary/immersionOffer/InMemoryPassEmploiGateway";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { InMemoryDocumentGateway } from "../../secondary/InMemoryDocumentGateway";
import { InMemoryPeConnectGateway } from "../../secondary/InMemoryPeConnectGateway";
import { InMemoryPoleEmploiGateway } from "../../secondary/InMemoryPoleEmploiGateway";
import { InMemorySireneGateway } from "../../secondary/InMemorySireneGateway";
import { MinioDocumentGateway } from "../../secondary/MinioDocumentGateway";
import { ExcelReportingGateway } from "../../secondary/reporting/ExcelReportingGateway";
import { InMemoryReportingGateway } from "../../secondary/reporting/InMemoryReportingGateway";
import { AppConfig } from "./appConfig";
import { ManagedRedirectError } from "../helpers/redirectErrors";

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
      });
    }
    return pgPool;
  };
};

// prettier-ignore
export type Gateways = ReturnType<typeof createGateways> extends Promise<infer T>
  ? T
  : never;

const errorMapper: ErrorMapper<PeConnectUrlTargets> = {
  PECONNECT_ADVISORS_INFO: {
    401: () => new ManagedRedirectError("peConnectAdvisorForbiddenAccess"),
  },
  OAUTH2_ACCESS_TOKEN_STEP_2: {
    400: () => new ManagedRedirectError("peConnectInvalidGrant"),
  },
};

// eslint-disable-next-line @typescript-eslint/require-await
export const createGateways = async (config: AppConfig, clock: Clock) => {
  logger.info({
    repositories: config.repositories,
    sireneGateway: config.sireneGateway,
    emailGateway: config.emailGateway,
    romeRepository: config.romeRepository,
  });

  // TODO Move from here
  const httpPeConnectGatewayTargetMapper: TargetMapper<PeConnectUrlTargets> =
    config.poleEmploiGateway === "HTTPS"
      ? makeApiPeConnectUrls({
          peAuthCandidatUrl:
            config.poleEmploiAccessTokenConfig.peAuthCandidatUrl,
          immersionBaseUrl:
            config.poleEmploiAccessTokenConfig.immersionFacileBaseUrl,
          peApiUrl: config.poleEmploiAccessTokenConfig.peApiUrl,
        })
      : ({} as TargetMapper<PeConnectUrlTargets>);

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
        clock,
      )
    : new InMemoryAccessTokenGateway();

  return {
    email: createEmailGateway(config, clock),
    sirene:
      config.sireneGateway === "HTTPS"
        ? new HttpsSireneGateway(
            config.sireneHttpsConfig,
            clock,
            noRateLimit,
            noRetries,
          )
        : new InMemorySireneGateway(),
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

    peConnectGateway:
      config.peConnectGateway === "HTTPS"
        ? new HttpPeConnectGateway(
            config.poleEmploiAccessTokenConfig,
            createManagedAxiosInstance(
              httpPeConnectGatewayTargetMapper,
              errorMapper,
            ),
            /*new ExponentialBackoffRetryStrategy(
              3_000,
              15_0000,
              clock,
              sleep,
              random,
            ),*/
          )
        : new InMemoryPeConnectGateway(config.immersionFacileBaseUrl),

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

    reportingGateway:
      config.reporting === "EXCEL"
        ? new ExcelReportingGateway()
        : new InMemoryReportingGateway(),

    documentGateway:
      config.documentGateway === "MINIO"
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          new MinioDocumentGateway(config.minioParams!)
        : new InMemoryDocumentGateway(),
  };
};

export const makeEmailAllowListPredicate = ({
  skipEmailAllowList,
  emailAllowList,
}: {
  skipEmailAllowList: boolean;
  emailAllowList: string[];
}): ((recipient: string) => boolean) =>
  skipEmailAllowList
    ? (_recipient: string) => true
    : (recipient: string): boolean => emailAllowList.includes(recipient);

const createEmailGateway = (config: AppConfig, clock: Clock): EmailGateway => {
  if (config.emailGateway === "IN_MEMORY")
    return new InMemoryEmailGateway(clock);

  const sendInBlueEmailGateway = SendinblueEmailGateway.create(
    config.sendinblueApiKey,
    makeEmailAllowListPredicate({
      skipEmailAllowList: config.skipEmailAllowlist,
      emailAllowList: config.emailAllowList,
    }),
  );

  if (config.emailGateway === "SENDINBLUE") return sendInBlueEmailGateway;

  if (config.emailGateway === "HYBRID")
    return new HybridEmailGateway(
      sendInBlueEmailGateway,
      new InMemoryEmailGateway(clock, 15),
    );

  const _notReached: never = config.emailGateway;
  throw new Error("Unknown email gateway kind");
};
