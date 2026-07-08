import { castError, executeInSequence } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../config/bootstrap/appConfig";
import { getWithCache } from "../config/bootstrap/cache";
import { createFetchHttpClientForExternalAPIs } from "../config/bootstrap/createGateways";
import { logPartnerResponses } from "../config/bootstrap/logPartnerResponses";
import { partnerNames } from "../config/bootstrap/partnerNames";
import { type KyselyDb, makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { AnnuaireDesEntreprisesSiretGateway } from "../domains/core/sirene/adapters/AnnuaireDesEntreprisesSiretGateway";
import { annuaireDesEntreprisesSiretRoutes } from "../domains/core/sirene/adapters/AnnuaireDesEntreprisesSiretGateway.routes";
import { InseeSiretGateway } from "../domains/core/sirene/adapters/InseeSiretGateway";
import { inseeExternalRoutes } from "../domains/core/sirene/adapters/InseeSiretGateway.routes";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { makeAxiosInstances } from "../utils/axiosUtils";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";
import "./instrumentSentryCron";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

type ReportElement =
  | {
      siret: string;
      nafCode: string;
    }
  | {
      siret: string;
      error: Error;
    };

const triggerUpdateEstablishmentMarketingNafCode = async (): Promise<{
  report: ReportElement[];
}> => {
  const arg = process.argv.slice(2)[0];
  const limit = Number.parseInt(arg ?? "1000", 10);

  const pgPool = createMakeProductionPgPool(config)();
  const transaction: KyselyDb = makeKyselyDb(pgPool);
  const { withCache, disconnectCache } = await getWithCache(config);
  const timeGateway = new RealTimeGateway();
  const { axiosWithValidateStatus } = makeAxiosInstances(
    config.externalAxiosTimeout,
  );
  const inseeSiretGateway = new InseeSiretGateway(
    config.inseeHttpConfig,
    createAxiosSharedClient(inseeExternalRoutes, axiosWithValidateStatus, {
      skipResponseValidation: true,
      onResponseSideEffect: logPartnerResponses({
        partnerName: partnerNames.inseeSiret,
      }),
    }),
    timeGateway,
    noRetries,
    withCache,
  );
  const siretGateway = new AnnuaireDesEntreprisesSiretGateway(
    createFetchHttpClientForExternalAPIs({
      partnerName: partnerNames.annuaireDesEntreprises,
      routes: annuaireDesEntreprisesSiretRoutes,
      config,
    }),
    inseeSiretGateway,
    withCache,
  );

  const siretsWithNoNafCode = await transaction
    .selectFrom("marketing_establishment_contacts")
    .where("naf_code", "is", null)
    .select("siret")
    .limit(limit)
    .execute();

  const report: ReportElement[] = await executeInSequence(
    siretsWithNoNafCode,
    async ({ siret }) =>
      updateEstablishmentNafCode(siretGateway, siret, transaction).catch(
        (error) => ({
          siret,
          error: castError(error),
        }),
      ),
  );

  await disconnectCache();
  await pgPool.end();
  return { report };
};

handleCRONScript({
  name: "triggerUpdateEstablishmentMarketingNafCode",
  config,
  script: triggerUpdateEstablishmentMarketingNafCode,
  handleResults: ({ report }) => {
    const errors = report.filter((element) => "error" in element);
    return `
    Naf Code updated: ${report.filter((element) => "nafCode" in element).length} establishments
    Errors: ${errors.length}
    ${errors.map((e) => `- ${e.siret} - ${e.error.message}`).join("\n")}
  `;
  },
  logger,
});

async function updateEstablishmentNafCode(
  siretGateway: AnnuaireDesEntreprisesSiretGateway,
  siret: string,
  transaction: KyselyDb,
): Promise<ReportElement> {
  const nafCode = await siretGateway
    .getEstablishmentBySiret(siret, true)
    .then((establishment) => establishment?.nafDto?.code);
  if (nafCode) {
    await transaction
      .updateTable("marketing_establishment_contacts")
      .set({ naf_code: nafCode })
      .where("siret", "=", siret)
      .execute();
    return { siret, nafCode };
  }
  return { siret, error: new Error("No NAF code found for this SIRET") };
}
