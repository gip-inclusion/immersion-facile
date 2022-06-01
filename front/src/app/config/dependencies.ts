import { asyncScheduler, SchedulerLike } from "rxjs";
import { HttpImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/HttpImmersionAssessmentGateway";
import { SimulatedImmersionAssessmentGateway } from "src/core-logic/adapters/AssessmentGateway/SimulatedImmersionAssessmentGateway";
import { HttpApiAdresseGateway } from "src/core-logic/adapters/HttpApiAdresseGateway";
import { HttpEstablishmentGateway } from "src/core-logic/adapters/HttpEstablishmentGateway";
import { HttpImmersionApplicationGateway } from "src/core-logic/adapters/HttpImmersionApplicationGateway";
import { HttpImmersionSearchGateway } from "src/core-logic/adapters/HttpImmersionSearchGateway";
import { HttpRomeAutocompleteGateway } from "src/core-logic/adapters/HttpRomeAutocompleteGateway";
import { HttpSiretGatewayThroughBack } from "src/core-logic/adapters/HttpSiretGatewayThroughBack";
import { HttpTechnicalGateway } from "src/core-logic/adapters/HttpTechnicalGateway";
import { InMemoryApiAdresseGateway } from "src/core-logic/adapters/InMemoryApiAdresseGateway";
import { InMemoryEstablishmentGateway } from "src/core-logic/adapters/InMemoryEstablishmentGateway";
import { InMemoryImmersionApplicationGateway } from "src/core-logic/adapters/InMemoryImmersionApplicationGateway";
import {
  InMemoryImmersionSearchGateway,
  seedSearchResults,
} from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import {
  InMemoryRomeAutocompleteGateway,
  seedRomeDtos,
} from "src/core-logic/adapters/InMemoryRomeAutocompleteGateway";
import { InMemoryTechnicalGateway } from "src/core-logic/adapters/InMemoryTechnicalGateway";
import { ReactNavigationGateway } from "src/core-logic/adapters/ReactNavigationGateway";
import { SimulatedSiretGatewayThroughBack } from "src/core-logic/adapters/SimulatedSiretGatewayThroughBack";
import { ApiAdresseGateway } from "src/core-logic/ports/ApiAdresseGateway";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { createStore } from "src/core-logic/storeConfig/store";
import { AgencyGateway } from "src/domain/ports/AgencyGateway";
import { ENV } from "src/environmentVariables";
import { HttpAgencyGateway } from "src/infra/gateway/AgencyGateway/HttpAgencyGateway";
import { InMemoryAgencyGateway } from "src/infra/gateway/AgencyGateway/InMemoryAgencyGateway";

export const establishmentGateway: EstablishmentGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryEstablishmentGateway(
        ["12345678901238", "12345678901239", "12345678901237"],
        undefined,
        true,
      )
    : new HttpEstablishmentGateway();

const inMemoryImmersionApplicationGateway =
  new InMemoryImmersionApplicationGateway(500);

const getSimulatedSiretGatewayThroughBack = () =>
  new SimulatedSiretGatewayThroughBack(500, {
    12345678901238: {
      siret: "12345678901238",
      businessName: "",
      businessAddress: "",
      isOpen: true,
    },
    12345678901239: {
      siret: "12345678901239",
      businessName: "",
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

export const siretGatewayThroughBack =
  ENV.gateway === "IN_MEMORY"
    ? getSimulatedSiretGatewayThroughBack()
    : new HttpSiretGatewayThroughBack();

export const immersionApplicationGateway: ImmersionApplicationGateway =
  ENV.gateway === "IN_MEMORY"
    ? inMemoryImmersionApplicationGateway
    : new HttpImmersionApplicationGateway();

export const immersionSearchGateway: ImmersionSearchGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryImmersionSearchGateway(seedSearchResults, 500)
    : new HttpImmersionSearchGateway();

export const apiAdresseGateway: ApiAdresseGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryApiAdresseGateway()
    : new HttpApiAdresseGateway();

export const technicalGateway: TechnicalGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryTechnicalGateway()
    : new HttpTechnicalGateway();

export const agencyGateway: AgencyGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryAgencyGateway()
    : new HttpAgencyGateway();

export const romeAutocompleteGateway: RomeAutocompleteGateway =
  ENV.gateway === "IN_MEMORY"
    ? new InMemoryRomeAutocompleteGateway(seedRomeDtos, 500)
    : new HttpRomeAutocompleteGateway();

const navigationGateway = new ReactNavigationGateway();

export const immersionAssessmentGateway: ImmersionAssessmentGateway =
  ENV.gateway === "IN_MEMORY"
    ? new SimulatedImmersionAssessmentGateway()
    : new HttpImmersionAssessmentGateway();

export type Dependencies = {
  immersionAssessmentGateway: ImmersionAssessmentGateway;
  siretGatewayThroughBack: SiretGatewayThroughBack;
  agencyGateway: AgencyGateway;
  apiAdresseGateway: ApiAdresseGateway;
  technicalGateway: TechnicalGateway;
  establishmentGateway: EstablishmentGateway;
  immersionApplicationGateway: ImmersionApplicationGateway;
  immersionSearchGateway: ImmersionSearchGateway;
  romeAutocompleteGateway: RomeAutocompleteGateway;
  minSearchResultsToPreventRefetch: number;
  scheduler: SchedulerLike;
  navigationGateway: NavigationGateway;
};

export const store = createStore({
  dependencies: {
    siretGatewayThroughBack,
    agencyGateway,
    apiAdresseGateway,
    technicalGateway,
    establishmentGateway,
    immersionApplicationGateway,
    immersionSearchGateway,
    romeAutocompleteGateway,
    minSearchResultsToPreventRefetch: 10,
    scheduler: asyncScheduler,
    immersionAssessmentGateway,
    navigationGateway,
  },
});
