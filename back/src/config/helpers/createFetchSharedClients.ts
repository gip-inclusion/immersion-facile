import { createFetchSharedClient } from "shared-routes/fetch";
import { createFranceTravailRoutes } from "../../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { AppConfig } from "../bootstrap/appConfig";

export const createPeFetchSharedClient = (config: AppConfig) => {
  const poleEmploiRoutes = createFranceTravailRoutes(config.peApiUrl);
  return createFetchSharedClient(poleEmploiRoutes, fetch);
};
