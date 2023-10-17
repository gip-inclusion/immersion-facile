import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { createPoleEmploiRoutes } from "../adapters/secondary/poleEmploi/PoleEmploiRoutes";

export const createPeAxiosSharedClient = (
  config: AppConfig,
  axiosInstance = axios.create({ timeout: config.externalAxiosTimeout }),
) => {
  const poleEmploiRoutes = createPoleEmploiRoutes(config.peApiUrl);
  return createAxiosSharedClient(poleEmploiRoutes, axiosInstance);
};
