import axios from "axios";
import {
  addressRoutes,
  adminRoutes,
  agencyRoutes,
  conventionMagicLinkRoutes,
  establishmentLeadRoutes,
  establishmentRoutes,
  formCompletionRoutes,
  inclusionConnectedAllowedRoutes,
  searchImmersionRoutes,
  technicalRoutes,
  unauthenticatedConventionRoutes,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createCommonDependencies } from "src/config/createCommonDependencies";
import type { Dependencies } from "src/config/dependencies";
import { HttpAddressGateway } from "src/core-logic/adapters/AddressGateway/HttpAddressGateway";
import { HttpAdminGateway } from "src/core-logic/adapters/AdminGateway/HttpAdminGateway";
import { HttpAgencyGateway } from "src/core-logic/adapters/AgencyGateway/HttpAgencyGateway";
import { HttpAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/HttpAssessmentGateway";
import { HttpConventionGateway } from "src/core-logic/adapters/Convention/HttpConventionGateway";
import { HttpEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/HttpEstablishmentGateway";
import { HttpEstablishmentLeadGateway } from "src/core-logic/adapters/EstablishmentLeadGateway/HttpEstablishmentLeadGateway";
import { HttpFormCompletionGateway } from "src/core-logic/adapters/FormCompletionGateway/HttpFormCompletionGateway";
import { HttpInclusionConnectedGateway } from "src/core-logic/adapters/InclusionConnected/HttpInclusionConnectedGateway";
import { HttpSearchGateway } from "src/core-logic/adapters/SearchGateway/HttpSearchGateway";
import { HttpTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/HttpTechnicalGateway";

export const createHttpDependencies = (): Dependencies => {
  const withBaseUrlConfig = { baseURL: "/api" };
  const axiosOnSlashApi = axios.create({
    ...withBaseUrlConfig,
    validateStatus: () => true,
  });

  return {
    ...createCommonDependencies(),
    addressGateway: new HttpAddressGateway(
      createAxiosSharedClient(addressRoutes, axiosOnSlashApi),
    ),
    adminGateway: new HttpAdminGateway(
      createAxiosSharedClient(adminRoutes, axiosOnSlashApi),
    ),
    agencyGateway: new HttpAgencyGateway(
      createAxiosSharedClient(agencyRoutes, axiosOnSlashApi),
    ),
    assessmentGateway: new HttpAssessmentGateway(
      createAxiosSharedClient(conventionMagicLinkRoutes, axiosOnSlashApi),
    ),
    conventionGateway: new HttpConventionGateway(
      createAxiosSharedClient(conventionMagicLinkRoutes, axiosOnSlashApi),
      createAxiosSharedClient(unauthenticatedConventionRoutes, axiosOnSlashApi),
    ),
    establishmentGateway: new HttpEstablishmentGateway(
      createAxiosSharedClient(establishmentRoutes, axiosOnSlashApi),
    ),
    establishmentLeadGateway: new HttpEstablishmentLeadGateway(
      createAxiosSharedClient(establishmentLeadRoutes, axiosOnSlashApi),
    ),
    formCompletionGateway: new HttpFormCompletionGateway(
      createAxiosSharedClient(formCompletionRoutes, axiosOnSlashApi),
    ),
    inclusionConnectedGateway: new HttpInclusionConnectedGateway(
      createAxiosSharedClient(inclusionConnectedAllowedRoutes, axiosOnSlashApi),
    ),
    searchGateway: new HttpSearchGateway(
      createAxiosSharedClient(searchImmersionRoutes, axiosOnSlashApi),
    ),
    technicalGateway: new HttpTechnicalGateway(
      createAxiosSharedClient(technicalRoutes, axiosOnSlashApi),
      axiosOnSlashApi,
    ),
  };
};
