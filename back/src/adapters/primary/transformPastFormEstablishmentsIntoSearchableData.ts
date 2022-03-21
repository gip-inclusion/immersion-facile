import { Pool } from "pg";
import { UpsertEstablishmentAggregateFromForm } from "../../domain/immersionOffer/useCases/UpsertEstablishmentAggregateFromFormEstablishement";
import { FormEstablishmentDto } from "../../shared/FormEstablishmentDto";

import { random, sleep } from "../../shared/utils";
import { createLogger } from "../../utils/logger";
import { notifyDiscord } from "../../utils/notifyDiscord";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../secondary/core/QpsRateLimiter";
import { ThrottledSequenceRunner } from "../secondary/core/ThrottledSequenceRunner";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { HttpAdresseAPI } from "../secondary/immersionOffer/HttpAdresseAPI";
import { PgRomeRepository } from "../secondary/pg/PgRomeRepository";
import { PgUowPerformer } from "../secondary/pg/PgUowPerformer";
import { AppConfig } from "./appConfig";
import { createPgUow } from "./config";

const maxQpsApiAdresse = 5;
const maxQpsSireneApi = 0.25;

const logger = createLogger(__filename);

const clock = new RealClock();

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
  const adresseAPI = new HttpAdresseAPI(
    new QpsRateLimiter(maxQpsApiAdresse, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );
  const sequenceRunner = new ThrottledSequenceRunner(100, 3);
  const sireneRepository = new HttpsSireneRepository(
    config.sireneHttpsConfig,
    clock,
    new QpsRateLimiter(maxQpsSireneApi, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );
  const poleEmploiGateway = new PgRomeRepository(clientOrigin);
  const testPool = getTestPgPool();
  const pgUowPerformer = new PgUowPerformer(testPool, createPgUow);

  const upsertAggregateFromForm = new UpsertEstablishmentAggregateFromForm(
    pgUowPerformer,
    sireneRepository,
    adresseAPI,
    poleEmploiGateway,
    sequenceRunner,
    new UuidV4Generator(),
    new RealClock(),
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
      businessAddress: row.business_address,
      naf: row.naf,
      professions: row.professions,
      businessContacts: row.business_contacts,
      preferredContactMethods: row.preferred_contact_methods,
    };
    try {
      await upsertAggregateFromForm.execute(formEstablishmentDto);
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
);
