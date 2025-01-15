import { createFetchSharedClient } from "shared-routes/fetch";
import { createFranceTravailRoutes } from "../../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { AppConfig } from "../bootstrap/appConfig";

export const createFtFetchSharedClient = (config: AppConfig) => {
  const franceTravailRoutes = createFranceTravailRoutes(config.ftApiUrl);
  return createFetchSharedClient(franceTravailRoutes, fetch);
};
