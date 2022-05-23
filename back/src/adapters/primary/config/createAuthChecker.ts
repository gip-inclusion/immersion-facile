import { ALWAYS_REJECT } from "../../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../../domain/auth/InMemoryAuthChecker";
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "./appConfig";

const logger = createLogger(__filename);

export const createAuthChecker = (config: AppConfig) => {
  if (!config.backofficeUsername || !config.backofficePassword) {
    logger.warn("Missing backoffice credentials. Disabling backoffice access.");
    return ALWAYS_REJECT;
  }
  return InMemoryAuthChecker.create(
    config.backofficeUsername,
    config.backofficePassword,
  );
};
