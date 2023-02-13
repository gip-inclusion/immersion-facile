import { createCommonDependencies } from "src/config/createCommonDependencies";
import type { Dependencies } from "src/config/dependencies";
import { InMemoryAddressGateway } from "src/core-logic/adapters/AddressGateway/InMemoryAddressGateway";
import { SimulatedAdminGateway } from "src/core-logic/adapters/AdminGateway/SimulatedAdminGateway";
import { InMemoryAgencyGateway } from "src/core-logic/adapters/AgencyGateway/InMemoryAgencyGateway";
import { SimulatedImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/SimulatedImmersionAssessmentGateway";
import { InMemoryConventionGateway } from "src/core-logic/adapters/Convention/InMemoryConventionGateway";
import { StubSentEmailGateway } from "src/core-logic/adapters/EmailGateway/StubSentEmailGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/EstablishmentGateway/InMemoryEstablishmentGateway";
import {
  InMemoryImmersionSearchGateway,
  seedSearchResults,
} from "src/core-logic/adapters/ImmersionSearchGateway/InMemoryImmersionSearchGateway";
import { SimulatedInclusionConnectedGateway } from "src/core-logic/adapters/InclusionConnected/SimulatedInclusionConnectedGateway";
import {
  InMemoryRomeAutocompleteGateway,
  seedRomeDtos,
} from "src/core-logic/adapters/RomeAutocompleteGateway/InMemoryRomeAutocompleteGateway";
import { SimulatedSiretGatewayThroughBack } from "src/core-logic/adapters/SiretGatewayThroughBack/SimulatedSiretGatewayThroughBack";
import { SimulatedTechnicalGateway } from "src/core-logic/adapters/TechnicalGateway/SimulatedTechnicalGateway";

const SIMULATED_LATENCY_MS = 400;

export const createInMemoryDependencies = (): Dependencies => ({
  addressGateway: new InMemoryAddressGateway(SIMULATED_LATENCY_MS),
  adminGateway: new SimulatedAdminGateway(),
  agencyGateway: new InMemoryAgencyGateway(),
  conventionGateway: new InMemoryConventionGateway(SIMULATED_LATENCY_MS),
  establishmentGateway: new InMemoryEstablishmentGateway(
    ["12345678901238", "12345678901239", "12345678901237"],
    undefined,
    true,
  ),
  immersionAssessmentGateway: new SimulatedImmersionAssessmentGateway(),
  immersionSearchGateway: new InMemoryImmersionSearchGateway(
    seedSearchResults,
    SIMULATED_LATENCY_MS,
  ),
  romeAutocompleteGateway: new InMemoryRomeAutocompleteGateway(
    seedRomeDtos,
    SIMULATED_LATENCY_MS,
  ),
  sentEmailGateway: new StubSentEmailGateway(),
  siretGatewayThroughBack: getSimulatedSiretGatewayThroughBack(),
  technicalGateway: new SimulatedTechnicalGateway(),
  inclusionConnectedGateway: new SimulatedInclusionConnectedGateway(),
  ...createCommonDependencies(),
});

const getSimulatedSiretGatewayThroughBack = () =>
  new SimulatedSiretGatewayThroughBack(SIMULATED_LATENCY_MS, {
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
