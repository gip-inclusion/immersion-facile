import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createFranceTravailRoutes } from "../../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { AppConfig } from "../bootstrap/appConfig";

export const createFtAxiosSharedClient = (
  config: AppConfig,
  axiosInstance = axios.create({ timeout: config.externalAxiosTimeout }),
) => {
  const franceTravailRoutes = createFranceTravailRoutes(config.ftApiUrl);
  return createAxiosSharedClient(franceTravailRoutes, axiosInstance);
};
