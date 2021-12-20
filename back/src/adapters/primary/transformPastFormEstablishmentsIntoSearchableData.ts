import { Pool } from "pg";
import { TransformFormEstablishmentIntoSearchData } from "../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
import { random, sleep } from "../../shared/utils";
import { createLogger } from "../../utils/logger";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../secondary/core/QpsRateLimiter";
import { ThrottledSequenceRunner } from "../secondary/core/ThrottledSequenceRunner";
import { TestUuidGenerator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { HttpAdresseAPI } from "../secondary/immersionOffer/HttpAdresseAPI";
import { PgImmersionOfferRepository } from "../secondary/pg/PgImmersionOfferRepository";
import { PgRomeGateway } from "../secondary/pg/PgRomeGateway";
import { AppConfig } from "./appConfig";

const maxQpsApiAdresse = 5;
const maxQpsSireneApi = 5;

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

  //We create the use case transformFormEstablishementIntoSearchData
  const poolOrigin = new Pool({ connectionString: originPgConnectionString });
  const clientOrigin = await poolOrigin.connect();

  const poolDestination = new Pool({
    connectionString: destinationPgConnectionString,
  });
  const clientDestination = await poolDestination.connect();
  const immersionOfferRepository = new PgImmersionOfferRepository(
    clientDestination,
  );
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
  const poleEmploiGateway = new PgRomeGateway(clientOrigin);

  const transformFormEstablishmentIntoSearchData =
    new TransformFormEstablishmentIntoSearchData(
      immersionOfferRepository,
      adresseAPI,
      sireneRepository,
      poleEmploiGateway,
      sequenceRunner,
      new TestUuidGenerator(),
    );
  const AllIdsResult = await clientOrigin.query(
    "SELECT id FROM public.form_establishments",
  );
  for (let pas = 0; pas < AllIdsResult.rows.length; pas++) {
    await transformFormEstablishmentIntoSearchData._execute(
      AllIdsResult.rows[pas],
    );
  }
  clientOrigin.release();
  await poolOrigin.end();
  clientDestination.release();
  await poolDestination.end();
};

transformPastFormEstablishmentsIntoSearchableData(
  config.pgImmersionDbUrl,
  config.pgImmersionDbUrl,
);
