import { createFetchSharedClient } from "shared-routes/fetch";
import { createPoleEmploiRoutes } from "../../domains/convention/adapters/pole-emploi-gateway/PoleEmploiRoutes";
import { AppConfig } from "../bootstrap/appConfig";

export const createPeFetchSharedClient = (config: AppConfig) => {
  const poleEmploiRoutes = createPoleEmploiRoutes(config.peApiUrl);
  return createFetchSharedClient(poleEmploiRoutes, fetch);
};
