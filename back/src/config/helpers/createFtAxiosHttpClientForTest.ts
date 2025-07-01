import type { HttpClient } from "shared-routes";
import { createAxiosSharedClient } from "shared-routes/axios";
import {
  createFranceTravailRoutes,
  type FrancetTravailRoutes,
} from "../../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { makeAxiosInstances } from "../../utils/axiosUtils";
import type { AppConfig } from "../bootstrap/appConfig";

export const createFtAxiosHttpClientForTest = (
  config: AppConfig,
): HttpClient<FrancetTravailRoutes> =>
  createAxiosSharedClient(
    createFranceTravailRoutes({
      ftApiUrl: config.ftApiUrl,
      ftEnterpriseUrl: config.ftEnterpriseUrl,
    }),
    makeAxiosInstances(config.externalAxiosTimeout).axiosWithValidateStatus,
  );
