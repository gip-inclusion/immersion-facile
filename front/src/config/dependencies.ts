import { SchedulerLike } from "rxjs";
import { createHttpDependencies } from "src/config/createHttpDependencies";
import { createInMemoryDependencies } from "src/config/createInMemoryDependencies";
import { ENV } from "src/config/environmentVariables";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import { DeviceRepository } from "src/core-logic/ports/DeviceRepository";
import { EmailValidationGateway } from "src/core-logic/ports/EmailValidationGateway";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";
import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";
import { OpenApiDocGateway } from "src/core-logic/ports/OpenApiDocGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { createStore } from "src/core-logic/storeConfig/store";

export type Dependencies = {
  adminGateway: AdminGateway;
  immersionAssessmentGateway: ImmersionAssessmentGateway;
  siretGatewayThroughBack: SiretGatewayThroughBack;
  agencyGateway: AgencyGateway;
  addressGateway: AddressGateway;
  technicalGateway: TechnicalGateway;
  establishmentGateway: EstablishmentGateway;
  conventionGateway: ConventionGateway;
  immersionSearchGateway: ImmersionSearchGateway;
  inclusionConnectedGateway: InclusionConnectedGateway;
  romeAutocompleteGateway: RomeAutocompleteGateway;
  navigationGateway: NavigationGateway;
  deviceRepository: DeviceRepository;
  minSearchResultsToPreventRefetch: number;
  scheduler: SchedulerLike;
  emailValidationGateway: EmailValidationGateway;
  openApiDocGateway: OpenApiDocGateway;
  immersionOfferGateway: ImmersionOfferGateway;
};

const dependencies =
  ENV.gateway === "IN_MEMORY"
    ? createInMemoryDependencies()
    : createHttpDependencies();

// these are exported for usages in component, we should try to have less and less (logic should go in redux)
export const apiAddressGateway = dependencies.addressGateway;
export const conventionGateway = dependencies.conventionGateway;
export const immersionSearchGateway = dependencies.immersionSearchGateway;
export const establishmentGateway = dependencies.establishmentGateway;
export const agencyGateway = dependencies.agencyGateway;
export const deviceRepository = dependencies.deviceRepository;
export const technicalGateway = dependencies.technicalGateway;
export const romeAutocompleteGateway = dependencies.romeAutocompleteGateway;
export const emailValidationGateway = dependencies.emailValidationGateway;

export const store = createStore({
  dependencies,
});
