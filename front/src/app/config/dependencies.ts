import { asyncScheduler, SchedulerLike } from "rxjs";
import { createManagedAxiosInstance } from "shared";
import { HttpAdminGateway } from "src/core-logic/adapters/AdminGateway/HttpAdminGateway";
import { SimulatedAdminGateway } from "src/core-logic/adapters/AdminGateway/SimulatedAdminGateway";
import { HttpAgencyGateway } from "src/core-logic/adapters/AgencyGateway/HttpAgencyGateway";
import { InMemoryAgencyGateway } from "src/core-logic/adapters/AgencyGateway/InMemoryAgencyGateway";
import { HttpImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/HttpImmersionAssessmentGateway";
import { SimulatedImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/SimulatedImmersionAssessmentGateway";
import { HttpConventionGateway } from "src/core-logic/adapters/Convention/HttpConventionGateway";
import { InMemoryConventionGateway } from "src/core-logic/adapters/Convention/InMemoryConventionGateway";
import { createLocalStorageDeviceRepository } from "src/core-logic/adapters/DeviceRepository/createLocalStorageDeviceRepository";
import { HttpSentEmailGateway } from "src/core-logic/adapters/EmailGateway/HttpSentEmailGateway";
import { StubSentEmailGateway } from "src/core-logic/adapters/EmailGateway/StubSentEmailGateway";
import { HttpEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/HttpEstablishmentGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/InMemoryEstablishmentGateway";
import { HttpAddressGateway } from "src/core-logic/adapters/AddressGateway/HttpAddressGateway";
import { InMemoryAddressGateway } from "src/core-logic/adapters/AddressGateway/InMemoryAddressGateway";

import { HttpImmersionSearchGateway } from "src/core-logic/adapters/ImmersionSearchGateway/HttpImmersionSearchGateway";
import {
  InMemoryImmersionSearchGateway,
  seedSearchResults,
} from "src/core-logic/adapters/ImmersionSearchGateway/InMemoryImmersionSearchGateway";
import { ReactNavigationGateway } from "src/core-logic/adapters/NavigationGateway/ReactNavigationGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/RomeAutocompleteGateway/HttpRomeAutocompleteGateway";
import {
  InMemoryRomeAutocompleteGateway,
  seedRomeDtos,
} from "src/core-logic/adapters/RomeAutocompleteGateway/InMemoryRomeAutocompleteGateway";
import { HttpSiretGatewayThroughBack } from "src/core-logic/adapters/SiretGatewayThroughBack/HttpSiretGatewayThroughBack";
import { SimulatedSiretGatewayThroughBack } from "src/core-logic/adapters/SiretGatewayThroughBack/SimulatedSiretGatewayThroughBack";
import { HttpTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/HttpTechnicalGateway";
import { SimulatedTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/SimulatedTechnicalGateway";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import { DeviceRepository } from "src/core-logic/ports/DeviceRepository";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { createStore } from "src/core-logic/storeConfig/store";
import { ENV } from "src/environmentVariables";

export const deviceRepository = createLocalStorageDeviceRepository();

export const establishmentGateway: EstablishmentGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryEstablishmentGateway(
        ["12345678901238", "12345678901239", "12345678901237"],
        undefined,
        true,
      )
    : new HttpEstablishmentGateway(
        createManagedAxiosInstance({ baseURL: "/api" }),
      );

const inMemoryConventionGateway = new InMemoryConventionGateway(500);

const getSimulatedSiretGatewayThroughBack = () =>
  new SimulatedSiretGatewayThroughBack(500, {
    12345678901238: {
      siret: "12345678901238",
      businessName: "Entreprise 38",
      businessAddress: "",
      isOpen: true,
    },
    12345678901239: {
      siret: "12345678901239",
      businessName: "Entreprise 39",
      businessAddress: "",
      isOpen: false,
    },
    12345678901236: {
      siret: "12345678901236",
      businessName:
        "Open Business on SIRENE but not registered on Immersion Facile",
      businessAddress: "5 Rue du Chevalier de Saint-George, 75008 Paris",
      isOpen: true,
    },
  });

export const adminGateway =
  ENV.gateway === "IN_MEMORY"
    ? new SimulatedAdminGateway()
    : new HttpAdminGateway(createManagedAxiosInstance({ baseURL: "/api" }));

export const siretGatewayThroughBack =
  ENV.gateway === "IN_MEMORY"
    ? getSimulatedSiretGatewayThroughBack()
    : new HttpSiretGatewayThroughBack(
        createManagedAxiosInstance({ baseURL: "/api" }),
      );

export const conventionGateway: ConventionGateway =
  ENV.gateway === "IN_MEMORY"
    ? inMemoryConventionGateway
    : new HttpConventionGateway(
        createManagedAxiosInstance({ baseURL: "/api" }),
      );

export const immersionSearchGateway: ImmersionSearchGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryImmersionSearchGateway(seedSearchResults, 500)
    : new HttpImmersionSearchGateway(
        createManagedAxiosInstance({ baseURL: "/api" }),
      );

const IMMERSION_API_ADDRESS_SIMULATED_LATENCY_MS = 150;
export const apiAddressGateway: AddressGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryAddressGateway(IMMERSION_API_ADDRESS_SIMULATED_LATENCY_MS)
    : new HttpAddressGateway(createManagedAxiosInstance());

export const technicalGateway: TechnicalGateway =
  ENV.gateway === "IN_MEMORY"
    ? new SimulatedTechnicalGateway()
    : new HttpTechnicalGateway(createManagedAxiosInstance({ baseURL: "/api" }));

export const agencyGateway: AgencyGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryAgencyGateway()
    : new HttpAgencyGateway(createManagedAxiosInstance({ baseURL: "/api" }));

export const romeAutocompleteGateway: RomeAutocompleteGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryRomeAutocompleteGateway(seedRomeDtos, 500)
    : new HttpRomeAutocompleteGateway(
        createManagedAxiosInstance({ baseURL: "/api" }),
      );

export const sentEmailGateway: SentEmailGateway =
  ENV.gateway === "IN_MEMORY"
    ? new StubSentEmailGateway()
    : new HttpSentEmailGateway(createManagedAxiosInstance({ baseURL: "/api" }));

const navigationGateway = new ReactNavigationGateway();

export const immersionAssessmentGateway: ImmersionAssessmentGateway =
  ENV.gateway === "IN_MEMORY"
    ? new SimulatedImmersionAssessmentGateway()
    : new HttpImmersionAssessmentGateway(
        createManagedAxiosInstance({ baseURL: "/api" }),
      );

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
  romeAutocompleteGateway: RomeAutocompleteGateway;
  navigationGateway: NavigationGateway;
  deviceRepository: DeviceRepository;
  sentEmailGateway: SentEmailGateway;
  minSearchResultsToPreventRefetch: number;
  scheduler: SchedulerLike;
};

export const store = createStore({
  dependencies: {
    adminGateway,
    siretGatewayThroughBack,
    agencyGateway,
    addressGateway: apiAddressGateway,
    technicalGateway,
    establishmentGateway,
    conventionGateway,
    immersionSearchGateway,
    romeAutocompleteGateway,
    immersionAssessmentGateway,
    navigationGateway,
    deviceRepository,
    minSearchResultsToPreventRefetch: 10,
    scheduler: asyncScheduler,
    sentEmailGateway,
  },
});
