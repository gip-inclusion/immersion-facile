import { addYears } from "date-fns";
import { makeGenerateJwt } from "../../domain/auth/jwt";
import {
  ApiConsumer,
  WithApiConsumerId,
} from "../../domain/core/valueObjects/ApiConsumer";
import { createLogger } from "../../utils/logger";
import { RealClock } from "../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { AppConfig } from "./appConfig";

const logger = createLogger(__filename);

const uuidGenerator = new UuidV4Generator();
const clock = new RealClock();
const appConfig = AppConfig.createFromEnv();
const generateJwt = makeGenerateJwt<WithApiConsumerId>(appConfig);

const createdAt = clock.now();
const expirationDate = addYears(createdAt, 2);

const apiConsumer: ApiConsumer = {
  id: uuidGenerator.new(),
  consumer: "passeEmploi",
  description: "some",
  isAuthorized: true,
  createdAt,
  expirationDate,
};

const makeSqlQueryToAddConsumer = ({
  id,
  consumer,
  isAuthorized,
  createdAt,
  expirationDate,
  description,
}: ApiConsumer): string =>
  "INSERT INTO api_consumers (id, consumer, description, is_authorized, created_at, expiration_date) " +
  `VALUES ('${id}', '${consumer}', '${description}', ${isAuthorized}, '${createdAt.toISOString()}', '${expirationDate.toISOString()}');`;

logger.info(apiConsumer, "Generating api key with payload ");
console.log("\n ApiConsumer : ", apiConsumer);
console.log(
  "\n Query to add in DB : \n",
  makeSqlQueryToAddConsumer(apiConsumer),
  "\n ----- \n",
);
console.log("\n JWT : ", generateJwt({ id: apiConsumer.id }));
