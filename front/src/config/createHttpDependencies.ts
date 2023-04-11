import { configureHttpClient, createAxiosHandlerCreator } from "http-client";
import {
  addressTargets,
  adminTargets,
  createManagedAxiosInstance,
  establishmentTargets,
  inclusionConnectedAllowedTargets,
  searchTargets,
  agencyTargets,
} from "shared";
import { createCommonDependencies } from "src/config/createCommonDependencies";
import type { Dependencies } from "src/config/dependencies";
import { HttpAddressGateway } from "src/core-logic/adapters/AddressGateway/HttpAddressGateway";
import { HttpAdminGateway } from "src/core-logic/adapters/AdminGateway/HttpAdminGateway";
import { HttpAgencyGateway } from "src/core-logic/adapters/AgencyGateway/HttpAgencyGateway";
import { HttpImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/HttpImmersionAssessmentGateway";
import { HttpConventionGateway } from "src/core-logic/adapters/Convention/HttpConventionGateway";
import { HttpSentEmailGateway } from "src/core-logic/adapters/EmailGateway/HttpSentEmailGateway";
import { HttpEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/HttpEstablishmentGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/ImmersionSearchGateway/HttpImmersionSearchGateway";
import { HttpInclusionConnectedGateway } from "src/core-logic/adapters/InclusionConnected/HttpInclusionConnectedGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/RomeAutocompleteGateway/HttpRomeAutocompleteGateway";
import { HttpSiretGatewayThroughBack } from "src/core-logic/adapters/SiretGatewayThroughBack/HttpSiretGatewayThroughBack";
import { HttpTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/HttpTechnicalGateway";

export const createHttpDependencies = (): Dependencies => {
  const axiosOnSlashApi = createManagedAxiosInstance({ baseURL: "/api" });
  const handlerCreator = createAxiosHandlerCreator(axiosOnSlashApi);
  const createHttpClient = configureHttpClient(handlerCreator);

  return {
    addressGateway: new HttpAddressGateway(createHttpClient(addressTargets)),
    adminGateway: new HttpAdminGateway(createHttpClient(adminTargets)),
    agencyGateway: new HttpAgencyGateway(createHttpClient(agencyTargets)),
    inclusionConnectedGateway: new HttpInclusionConnectedGateway(
      createHttpClient(inclusionConnectedAllowedTargets),
    ),
    establishmentGateway: new HttpEstablishmentGateway(
      createHttpClient(establishmentTargets),
    ),
    conventionGateway: new HttpConventionGateway(axiosOnSlashApi),
    immersionAssessmentGateway: new HttpImmersionAssessmentGateway(
      axiosOnSlashApi,
    ),
    immersionSearchGateway: new HttpImmersionSearchGateway(
      createHttpClient(searchTargets),
    ),
    romeAutocompleteGateway: new HttpRomeAutocompleteGateway(axiosOnSlashApi),
    sentEmailGateway: new HttpSentEmailGateway(axiosOnSlashApi),
    siretGatewayThroughBack: new HttpSiretGatewayThroughBack(axiosOnSlashApi),
    technicalGateway: new HttpTechnicalGateway(axiosOnSlashApi),
    ...createCommonDependencies(),
  };
};
