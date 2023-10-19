import axios from "axios";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createPoleEmploiRoutes } from "../../secondary/poleEmploi/PoleEmploiRoutes";
import { AppConfig } from "../config/appConfig";

export const createPeAxiosSharedClient = (
  config: AppConfig,
  axiosInstance = axios.create({ timeout: config.externalAxiosTimeout }),
) => {
  const poleEmploiRoutes = createPoleEmploiRoutes(config.peApiUrl);
  return createAxiosSharedClient(poleEmploiRoutes, axiosInstance);
};
