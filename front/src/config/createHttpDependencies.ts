import {
  addressRoutes,
  adminRoutes,
  agencyRoutes,
  conventionMagicLinkRoutes,
  createManagedAxiosInstance,
  establishmentRoutes,
  inclusionConnectedAllowedRoutes,
  searchImmersionRoutes,
  siretRoutes,
  technicalRoutes,
  unauthenticatedConventionRoutes,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createCommonDependencies } from "src/config/createCommonDependencies";
import type { Dependencies } from "src/config/dependencies";
import { HttpAddressGateway } from "src/core-logic/adapters/AddressGateway/HttpAddressGateway";
import { HttpAdminGateway } from "src/core-logic/adapters/AdminGateway/HttpAdminGateway";
import { HttpAgencyGateway } from "src/core-logic/adapters/AgencyGateway/HttpAgencyGateway";
import { HttpImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/HttpImmersionAssessmentGateway";
import { HttpConventionGateway } from "src/core-logic/adapters/Convention/HttpConventionGateway";
import { HttpEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/HttpEstablishmentGateway";
import { HttpInclusionConnectedGateway } from "src/core-logic/adapters/InclusionConnected/HttpInclusionConnectedGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/RomeAutocompleteGateway/HttpRomeAutocompleteGateway";
import { HttpSearchGateway } from "src/core-logic/adapters/SearchGateway/HttpSearchGateway";
import { HttpSiretGatewayThroughBack } from "src/core-logic/adapters/SiretGatewayThroughBack/HttpSiretGatewayThroughBack";
import { HttpTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/HttpTechnicalGateway";

export const createHttpDependencies = (): Dependencies => {
  const axiosOnSlashApi = createManagedAxiosInstance({ baseURL: "/api" });

  return {
    addressGateway: new HttpAddressGateway(
      createAxiosSharedClient(addressRoutes, axiosOnSlashApi),
    ),
    adminGateway: new HttpAdminGateway(
      createAxiosSharedClient(adminRoutes, axiosOnSlashApi),
    ),
    agencyGateway: new HttpAgencyGateway(
      createAxiosSharedClient(agencyRoutes, axiosOnSlashApi),
    ),
    inclusionConnectedGateway: new HttpInclusionConnectedGateway(
      createAxiosSharedClient(inclusionConnectedAllowedRoutes, axiosOnSlashApi),
    ),
    establishmentGateway: new HttpEstablishmentGateway(
      createAxiosSharedClient(establishmentRoutes, axiosOnSlashApi),
    ),
    conventionGateway: new HttpConventionGateway(
      createAxiosSharedClient(conventionMagicLinkRoutes, axiosOnSlashApi),
      createAxiosSharedClient(unauthenticatedConventionRoutes, axiosOnSlashApi),
    ),
    immersionAssessmentGateway: new HttpImmersionAssessmentGateway(
      axiosOnSlashApi,
    ),
    searchGateway: new HttpSearchGateway(
      createAxiosSharedClient(searchImmersionRoutes, axiosOnSlashApi),
    ),
    romeAutocompleteGateway: new HttpRomeAutocompleteGateway(axiosOnSlashApi),
    siretGatewayThroughBack: new HttpSiretGatewayThroughBack(
      createAxiosSharedClient(siretRoutes, axiosOnSlashApi),
    ),
    technicalGateway: new HttpTechnicalGateway(
      createAxiosSharedClient(technicalRoutes, axiosOnSlashApi),
      axiosOnSlashApi,
    ),
    ...createCommonDependencies(),
  };
};
