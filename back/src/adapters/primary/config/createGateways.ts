import { TargetUrlsMapper } from "@serenity-dev/http-client";
import { ManagedAxios } from "@serenity-dev/http-client/src/adapters/axios.adapter";
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
  errorMapper,
  HttpPeConnectGateway,
  httpPeConnectGatewayTargetMapperMaker,
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

const logger = createLogger(__filename);

const AXIOS_TIMEOUT_FIVE_SECOND = 5000;

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

// eslint-disable-next-line @typescript-eslint/require-await
export const createGateways = async (config: AppConfig, clock: Clock) => {
  logger.info({
    repositories: config.repositories,
    sireneGateway: config.sireneGateway,
    emailGateway: config.emailGateway,
    romeRepository: config.romeRepository,
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
        clock,
      )
    : new InMemoryAccessTokenGateway();

  const httpPeConnectGatewayTargetUrlsMapper: TargetUrlsMapper<PeConnectUrlTargets> =
    config.poleEmploiGateway === "HTTPS"
      ? httpPeConnectGatewayTargetMapperMaker(
          config.poleEmploiAccessTokenConfig,
        )
      : ({} as TargetUrlsMapper<PeConnectUrlTargets>);

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
            new ManagedAxios<PeConnectUrlTargets>(
              httpPeConnectGatewayTargetUrlsMapper,
              errorMapper,
              {
                timeout: AXIOS_TIMEOUT_FIVE_SECOND,
              },
            ),
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
