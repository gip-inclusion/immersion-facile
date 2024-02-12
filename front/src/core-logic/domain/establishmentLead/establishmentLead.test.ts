import { ConventionJwt, expectToEqual } from "shared";
import {
  establishmentLeadErrorSelector,
  establishmentLeadStatus,
} from "src/core-logic/domain/establishmentLead/establishmentLead.selectors";
import { establishmentLeadSlice } from "src/core-logic/domain/establishmentLead/establishmentLead.slice";
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
    expectToEqual(establishmentLeadStatus(store.getState()), "Idle");

    store.dispatch(
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadRequested(jwt),
    );
    expectToEqual(establishmentLeadStatus(store.getState()), "Loading");
    feedGatewayWithUnregisterSuccess();
    expectToEqual(establishmentLeadStatus(store.getState()), "Success");
  });

  it("unsubscription requested - failed", () => {
    const backendError: Error = new Error("Backend Error");
    expectToEqual(establishmentLeadStatus(store.getState()), "Idle");

    store.dispatch(
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadRequested(jwt),
    );
    expectToEqual(establishmentLeadStatus(store.getState()), "Loading");
    feedGatewayWithUnregisterError(backendError);
    expectToEqual(establishmentLeadStatus(store.getState()), "Idle");
    expectErrorToBe(backendError.message);
  });

  const expectErrorToBe = (expectedErrorMessage: string | null) => {
    expectToEqual(
      establishmentLeadErrorSelector(store.getState()),
      expectedErrorMessage,
    );
  };

  const feedGatewayWithUnregisterError = (error: Error) => {
    dependencies.establishmentGateway.unregisterEstablishmentLeadResponse$.error(
      error,
    );
  };

  const feedGatewayWithUnregisterSuccess = () => {
    dependencies.establishmentGateway.unregisterEstablishmentLeadResponse$.next(
      undefined,
    );
  };
});
