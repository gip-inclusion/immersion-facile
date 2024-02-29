import axios from "axios";
import { Pool } from "pg";
import { FormEstablishmentDto, random, sleep } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../config/bootstrap/appConfig";
import { getTestPgPool } from "../config/pg/pgUtils";
import { HttpAddressGateway } from "../domains/core/address/adapters/HttpAddressGateway";
import { addressesExternalRoutes } from "../domains/core/address/adapters/HttpAddressGateway.routes";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import {
  ExponentialBackoffRetryStrategy,
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
} from "../domains/core/retry-strategy/adapters/ExponentialBackoffRetryStrategy";
import { InseeSiretGateway } from "../domains/core/sirene/adapters/InseeSiretGateway";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { PgUowPerformer } from "../domains/core/unit-of-work/adapters/PgUowPerformer";
import { createPgUow } from "../domains/core/unit-of-work/adapters/createPgUow";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { InsertEstablishmentAggregateFromForm } from "../domains/establishment/use-cases/InsertEstablishmentAggregateFromFormEstablishement";
import { createLogger } from "../utils/logger";
import { notifyDiscord } from "../utils/notifyDiscord";

const logger = createLogger(__filename);

const timeGateway = new RealTimeGateway();

const config = AppConfig.createFromEnv();

const transformPastFormEstablishmentsIntoSearchableData = async (
  originPgConnectionString: string,
  destinationPgConnectionString: string,
) => {
  logger.info(
    { originPgConnectionString, destinationPgConnectionString },
    "starting to convert form establishement to searchable data",
  );

  // We create the use case transformFormEstablishementIntoSearchData
  const poolOrigin = new Pool({ connectionString: originPgConnectionString });
  const clientOrigin = await poolOrigin.connect();

  const poolDestination = new Pool({
    connectionString: destinationPgConnectionString,
  });
  const clientDestination = await poolDestination.connect();
  const addressAPI = new HttpAddressGateway(
    createAxiosSharedClient(
      addressesExternalRoutes,
      axios.create({ timeout: 10_000 }),
    ),
    config.apiKeyOpenCageDataGeocoding,
    config.apiKeyOpenCageDataGeosearch,
  );
  const siretGateway = new InseeSiretGateway(
    config.inseeHttpConfig,
    timeGateway,
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      timeGateway,
      sleep,
      random,
    ),
  );
  const testPool = getTestPgPool();
  const pgUowPerformer = new PgUowPerformer(testPool, createPgUow);
  const uuidGenerator = new UuidV4Generator();
  const upsertAggregateFromForm = new InsertEstablishmentAggregateFromForm(
    pgUowPerformer,
    siretGateway,
    addressAPI,
    new UuidV4Generator(),
    timeGateway,
    makeCreateNewEvent({ timeGateway, uuidGenerator }),
  );
  const missingFormEstablishmentRows = (
    await clientOrigin.query(
      `select * from form_establishments where siret not in 
    (select siret from establishments where data_source = 'form')`,
    )
  ).rows;
  logger.info(
    `Found ${missingFormEstablishmentRows.length} in form tables that are not in establishments`,
  );

  let succeed = 0;
  const failedSiret = [];
  for (const row of missingFormEstablishmentRows) {
    const formEstablishmentDto: FormEstablishmentDto = {
      source: row.source,
      siret: row.siret,
      businessName: row.business_name,
      businessNameCustomized: row.business_name_customized,
      website: row.website,
      additionalInformation: row.additional_information,
      businessAddresses: row.business_addresses, // No type on row, not sure what I'm doing
      naf: row.naf,
      appellations: row.professions,
      businessContact: row.business_contact,
      maxContactsPerWeek: row.max_contacts_per_week,
      searchableBy: {
        jobSeekers: row.searchable_by_job_seekers,
        students: row.searchable_by_students,
      },
    };
    try {
      await upsertAggregateFromForm.execute({
        formEstablishment: formEstablishmentDto,
      });
      logger.info(
        `Successfully added form with siret ${row.siret} to aggregate tables.`,
      );
      succeed += 1;
    } catch (_) {
      logger.warn(
        `Could not add form with siret ${row.siret} to aggregate tables.`,
      );
      failedSiret.push(row.siret);
    }
  }
  notifyDiscord(
    `Script summary: Succeed: ${succeed}; Failed: ${
      failedSiret.length
    }\nFailing siret were: ${failedSiret.join(", ")}`,
  );
  clientOrigin.release();
  await poolOrigin.end();
  clientDestination.release();
  await poolDestination.end();
};

transformPastFormEstablishmentsIntoSearchableData(
  config.pgImmersionDbUrl,
  config.pgImmersionDbUrl,
).then(
  () => {
    logger.info("Script finished success");
    process.exit(0);
  },
  (error: any) => {
    logger.error(error, "Script failed");
    process.exit(1);
  },
);
