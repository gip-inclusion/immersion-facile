import { addYears } from "date-fns";
import {
  ApiConsumer,
  ApiConsumerName,
  authorisedNames,
  WithApiConsumerId,
} from "shared";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { AppConfig } from "../config/appConfig";

const logger = createLogger(__filename);

const uuidGenerator = new UuidV4Generator();
const timeGateway = new RealTimeGateway();
const appConfig = AppConfig.createFromEnv();
const generateApiKeyJwt = makeGenerateJwtES256<WithApiConsumerId>(
  appConfig.apiJwtPrivateKey,
);

const createdAt = timeGateway.now();
const expirationDate = addYears(createdAt, 2);

const getNameOrThrow = (name: string): ApiConsumerName => {
  if (!name)
    throw new Error(
      `please provide consumerName, expecting one of: ${authorisedNames.join(
        " | ",
      )}`,
    );

  if (authorisedNames.includes(name as ApiConsumerName))
    return name as ApiConsumerName;

  throw new Error(
    `Name must be one of ${authorisedNames.join(", ")}, got : ${name}`,
  );
};

const consumerName: ApiConsumerName = getNameOrThrow(process.argv[2]);

const apiConsumer: ApiConsumer = {
  id: uuidGenerator.new(),
  consumer: consumerName,
  isAuthorized: true,
  createdAt,
  expirationDate,
  description: "",
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
//eslint-disable-next-line no-console
console.log("\n ApiConsumer : ", apiConsumer);
//eslint-disable-next-line no-console
console.log(
  "\n Query to add in DB : \n",
  makeSqlQueryToAddConsumer(apiConsumer),
  "\n ----- \n",
);
//eslint-disable-next-line no-console
console.log("\n JWT : ", generateApiKeyJwt({ id: apiConsumer.id }));
