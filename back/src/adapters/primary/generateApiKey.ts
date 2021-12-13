import { makeGenerateJwt } from "../../domain/auth/jwt";
import { ApiConsumer } from "../../shared/tokens/ApiConsumer";
import { createLogger } from "../../utils/logger";
import { RealClock } from "../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { AppConfig } from "./appConfig";

const logger = createLogger(__filename);

const uuidGenerator = new UuidV4Generator();
const clock = new RealClock();
const appConfig = AppConfig.createFromEnv();
const generateJwt = makeGenerateJwt<ApiConsumer>(appConfig);

const numberOfSecondsSince1970 = clock.now().getTime() / 1000;
const validityDurationInSeconds = 2 * 365 * 24 * 3600; // = 2 years

const apiConsumer: ApiConsumer = {
  id: uuidGenerator.new(),
  consumer: "passeEmploi",
  iat: Math.round(numberOfSecondsSince1970),
  exp: Math.round(numberOfSecondsSince1970) + validityDurationInSeconds,
};

logger.info(apiConsumer, "Generating api key with payload ");
console.log("\n ID of api key : ", apiConsumer.id);
console.log("\n JWT : ", generateJwt(apiConsumer));
