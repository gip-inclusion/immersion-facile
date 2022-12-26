import { Pool } from "pg";
import { ApplyAgenciesAddressesFromPositions } from "../../../domain/convention/useCases/agencies/ApplyAgenciesAddressesFromPositions";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { AppConfig } from "../config/appConfig";
import { createGateways } from "../config/createGateways";
import { createUowPerformer } from "../config/uowConfig";

// For tracing, we should try something like :
// import { tracingSdk } from "./tracing";
//
// tracingSdk
//   .start()
//   .then(() => applyAgenciesAddressDtosFromPositions())

const applyAgenciesAddressDtosFromPositions = async () => {
  const config = AppConfig.createFromEnv();
  const { addressApi } = await createGateways(config);
  const { uowPerformer } = createUowPerformer(
    config,
    () =>
      new Pool({
        connectionString: config.pgImmersionDbUrl,
      }),
  );
  await new ApplyAgenciesAddressesFromPositions(
    uowPerformer,
    addressApi,
  ).execute();
};

const logger = createLogger(__filename);
logger.info("Starting...");

applyAgenciesAddressDtosFromPositions()
  .then(() => {
    logger.info("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error, "Script failed with error : ");
    notifyObjectDiscord({
      message:
        "applyAgenciesAddressDtosFromPositions, script failed with error",
      error,
    });
    process.exit(1);
  });
