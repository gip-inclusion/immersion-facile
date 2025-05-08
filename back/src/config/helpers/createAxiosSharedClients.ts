import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createFranceTravailRoutes } from "../../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import type { AppConfig } from "../bootstrap/appConfig";

export const createFtAxiosSharedClient = (config: AppConfig) => {
  const axiosInstance = axios.create({
    timeout: config.externalAxiosTimeout,
    validateStatus: () => true,
  });
  const franceTravailRoutes = createFranceTravailRoutes({
    ftApiUrl: config.ftApiUrl,
    ftEnterpriseUrl: config.ftEnterpriseUrl,
  });
  return createAxiosSharedClient(franceTravailRoutes, axiosInstance);
};
