import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createFranceTravailRoutes } from "../../domains/convention/adapters/pole-emploi-gateway/FrancetTravailRoutes";
import { AppConfig } from "../bootstrap/appConfig";

export const createPeAxiosSharedClient = (
  config: AppConfig,
  axiosInstance = axios.create({ timeout: config.externalAxiosTimeout }),
) => {
  const poleEmploiRoutes = createFranceTravailRoutes(config.peApiUrl);
  return createAxiosSharedClient(poleEmploiRoutes, axiosInstance);
};
