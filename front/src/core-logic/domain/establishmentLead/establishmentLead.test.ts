import { ConventionJwt, expectToEqual } from "shared";
import {
  establishmentLeadErrorSelector,
  establishmentLeadStatus,
} from "src/core-logic/domain/establishmentLead/establishmentLead.selectors";
import {
  EstablishmentLeadUIStatus,
  establishmentLeadSlice,
} from "src/core-logic/domain/establishmentLead/establishmentLead.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const jwt: ConventionJwt = "";

describe("EstablishmentLead slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("unsubscription requested - success", () => {
    expectEstablishmentLeadStatusToBe("idle");

    store.dispatch(
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadRequested(jwt),
    );
    expectEstablishmentLeadStatusToBe("loading");
    feedGatewayWithUnregisterSuccess();
    expectEstablishmentLeadStatusToBe("success");
  });

  it("unsubscription requested - failed", () => {
    const backendError: Error = new Error("Backend Error");
    expectEstablishmentLeadStatusToBe("idle");

    store.dispatch(
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadRequested(jwt),
    );
    expectEstablishmentLeadStatusToBe("loading");
    feedGatewayWithUnregisterError(backendError);
    expectEstablishmentLeadStatusToBe("errored");
    expectErrorToBe(backendError.message);
  });

  const expectErrorToBe = (expectedErrorMessage: string | null) => {
    expectToEqual(
      establishmentLeadErrorSelector(store.getState()),
      expectedErrorMessage,
    );
  };

  const expectEstablishmentLeadStatusToBe = (
    expectedStatus: EstablishmentLeadUIStatus,
  ) => {
    expect(establishmentLeadStatus(store.getState())).toBe(expectedStatus);
  };

  const feedGatewayWithUnregisterError = (error: Error) => {
    dependencies.establishmentLeadGateway.unregisterEstablishmentLeadResponse$.error(
      error,
    );
  };

  const feedGatewayWithUnregisterSuccess = () => {
    dependencies.establishmentLeadGateway.unregisterEstablishmentLeadResponse$.next(
      undefined,
    );
  };
});
