import { expectObjectToMatch } from "shared/src/expectToEqual";

import { reasonableSchedule } from "shared/src/ScheduleSchema";
import { ImmersionApplicationDto } from "src/../../shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  immersionConventionSlice,
  ImmersionConventionState,
} from "./immersionConvention.slice";

const DATE_SUBMISSION = "2021-01-04";
const DATE_START = "2021-01-06";
const DATE_END = "2021-01-15";
const DEMANDE_IMMERSION_ID = "40400404-9c0b-bbbb-bb6d-6bb9bd38bbbb";

const validImmersionApplication: ImmersionApplicationDto = {
  id: DEMANDE_IMMERSION_ID,
  status: "DRAFT",
  postalCode: "75001",
  agencyId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  email: "beneficiary@email.fr",
  phone: "+33012345678",
  firstName: "Esteban",
  lastName: "Ocon",
  emergencyContact: "Clariss Ocon",
  emergencyContactPhone: "0663567896",
  dateSubmission: DATE_SUBMISSION,
  dateStart: DATE_START,
  dateEnd: DATE_END,
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  mentor: "Alain Prost",
  mentorPhone: "0601010101",
  mentorEmail: "establishment@example.com",
  schedule: reasonableSchedule,
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionAppellation: {
    romeCode: "A1101",
    romeLabel: "Conduite d'engins agricoles et forestiers",
    appellationCode: "17751",
    appellationLabel: "Pilote de machines d'abattage",
  },
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
};

describe("Immersion Application slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("stores null as convention without an immersion application matching in backend", () => {
    expectImmersionConventionState({
      isLoading: false,
      convention: null,
    });
    store.dispatch(
      immersionConventionSlice.actions.immersionConventionRequested("my-jwt"),
    );
    expectImmersionConventionState({ isLoading: true });
    feedGatewayWithConvention(undefined);
    expectImmersionConventionState({
      convention: null,
      isLoading: false,
    });
  });

  it("stores the convention if one matches in backend", () => {
    expectImmersionConventionState({
      isLoading: false,
      convention: null,
    });
    store.dispatch(
      immersionConventionSlice.actions.immersionConventionRequested("my-jwt"),
    );
    expectImmersionConventionState({ isLoading: true });
    feedGatewayWithConvention(validImmersionApplication);
    expectImmersionConventionState({
      convention: validImmersionApplication,
      isLoading: false,
    });
  });

  it("stores error if failure during fetch", () => {
    expectImmersionConventionState({
      isLoading: false,
      convention: null,
      error: null,
    });
    store.dispatch(
      immersionConventionSlice.actions.immersionConventionRequested("my-jwt"),
    );
    expectImmersionConventionState({ isLoading: true });
    feedGatewayWithError(new Error("I failed !"));
    expectImmersionConventionState({
      convention: null,
      isLoading: false,
      error: "I failed !",
    });
  });

  const expectImmersionConventionState = (
    immersionConventionState: Partial<ImmersionConventionState>,
  ) => {
    expectObjectToMatch(
      store.getState().immersionConvention,
      immersionConventionState,
    );
  };

  const feedGatewayWithError = (error: Error) => {
    dependencies.immersionApplicationGateway.immersionConvention$.error(error);
  };

  const feedGatewayWithConvention = (
    convention: ImmersionApplicationDto | undefined,
  ) => {
    dependencies.immersionApplicationGateway.immersionConvention$.next(
      convention,
    );
  };
});
