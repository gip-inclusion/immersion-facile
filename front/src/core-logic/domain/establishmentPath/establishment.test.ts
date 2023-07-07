import {
  expectObjectsToMatch,
  LegacyHttpClientError,
  SiretDto,
  SiretEstablishmentDto,
} from "shared";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { makeStubFeatureFlags } from "src/core-logic/domain/testHelpers/test.helpers";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { establishmentSlice, EstablishmentState } from "./establishment.slice";

const establishmentFetched: SiretEstablishmentDto = {
  siret: "11110000111100",
  businessName: "Existing open business on Sirene Corp.",
  businessAddress: "",
  isOpen: true,
  numberEmployeesRange: "",
};

describe("Establishment", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    const storeAndDeps = createTestStore();
    ({ store, dependencies } = storeAndDeps);
  });

  it("reflects when user wants to input siret", () => {
    store.dispatch(establishmentSlice.actions.gotReady());
    expectEstablishmentStateToMatch({
      status: "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
    });
  });

  it("does not trigger navigation when siret is requested if status is not 'READY_FOR_LINK_REQUEST_OR_REDIRECTION'", () => {
    store.dispatch(
      siretSlice.actions.siretInfoSucceeded({
        siret: "123",
      } as SiretEstablishmentDto),
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered(null);
  });

  it("triggers navigation when siret is requested if status is 'READY_FOR_LINK_REQUEST_OR_REDIRECTION'", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        status: "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
        isLoading: false,
        feedback: { kind: "idle" },
      },
    }));
    store.dispatch(siretSlice.actions.siretModified("10002000300040"));
    dependencies.siretGatewayThroughBack.siretInfo$.next(establishmentFetched);
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered(
      "10002000300040",
    );
  });

  it("triggers navigation when siret is requested if status is 'READY_FOR_LINK_REQUEST_OR_REDIRECTION', event if insee feature flag is OFF", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        status: "READY_FOR_LINK_REQUEST_OR_REDIRECTION",
        isLoading: false,
        feedback: { kind: "idle" },
      },
      featureFlags: {
        ...makeStubFeatureFlags({ enableInseeApi: false }),
        isLoading: false,
      },
    }));
    store.dispatch(siretSlice.actions.siretModified("10002000300040"));
    dependencies.siretGatewayThroughBack.isSiretInDb$.next(false);
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered(
      "10002000300040",
    );
  });

  it("send modification link", () => {
    expectEstablishmentStateToMatch({
      isLoading: false,
      status: "IDLE",
      feedback: { kind: "idle" },
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested("siret-123"),
    );
    expectEstablishmentStateToMatch({ isLoading: true });
    dependencies.establishmentGateway.establishmentModificationResponse$.next(
      undefined,
    );
    expectEstablishmentStateToMatch({
      isLoading: false,
      status: "LINK_SENT",
      feedback: { kind: "success" },
    });
    expect(establishmentSelectors.sendLinkSucceeded(store.getState())).toBe(
      true,
    );
  });

  it("handle send modification link error", () => {
    const errorMessage = "Error sending modification link";
    expectEstablishmentStateToMatch({
      isLoading: false,
      status: "IDLE",
      feedback: { kind: "idle" },
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested("siret-123"),
    );
    expectEstablishmentStateToMatch({ isLoading: true });
    dependencies.establishmentGateway.establishmentModificationResponse$.error(
      new LegacyHttpClientError(errorMessage, new Error(), 400, {
        errors: errorMessage,
      }),
    );
    expectEstablishmentStateToMatch({
      isLoading: false,
      status: "ERRORED",
      feedback: { kind: "errored", errorMessage },
    });
    expect(establishmentSelectors.sendLinkSucceeded(store.getState())).toBe(
      false,
    );
  });

  const expectEstablishmentStateToMatch = (
    expected: Partial<EstablishmentState>,
  ) => expectObjectsToMatch(store.getState().establishment, expected);

  const expectNavigationToEstablishmentFormPageToHaveBeenTriggered = (
    siretOfRoute: SiretDto | null,
  ) => {
    expect(dependencies.navigationGateway.navigatedToEstablishmentForm).toBe(
      siretOfRoute,
    );
  };
});
