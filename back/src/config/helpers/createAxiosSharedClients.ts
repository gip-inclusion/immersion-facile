import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createPoleEmploiRoutes } from "../../domains/convention/adapters/pole-emploi-gateway/PoleEmploiRoutes";
import { AppConfig } from "../bootstrap/appConfig";

export const createPeAxiosSharedClient = (
  config: AppConfig,
  axiosInstance = axios.create({ timeout: config.externalAxiosTimeout }),
) => {
  const poleEmploiRoutes = createPoleEmploiRoutes(config.peApiUrl);
  return createAxiosSharedClient(poleEmploiRoutes, axiosInstance);
};
