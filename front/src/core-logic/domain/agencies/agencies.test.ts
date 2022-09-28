import { expectToEqual } from "shared";
import { AgencyIdAndName } from "src/../../shared/src/agency/agency.dto";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { agenciesSelector } from "./agencies.selector";

import { agenciesSlice } from "./agencies.slice";

describe("Agencies in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("agencies list should be initialState at start", () => {
    const expected: AgencyIdAndName[] = [];
    expectToEqual(agenciesSelector(store.getState()), expected);
  });

  it("retrieves agencies from API and store in state", () => {
    // Arrange
    const agenciesFromApi: AgencyIdAndName[] = [
      {
        id: "0",
        name: "Agence de Bougoin",
      },
    ];

    const departementCode = "11";

    // Execute
    store.dispatch(
      agenciesSlice.actions.fetchAgenciesRequested(departementCode),
    );
    dependencies.agencyGateway.agencies$.next(agenciesFromApi);

    // Expect
    expectToEqual(agenciesSelector(store.getState()), agenciesFromApi);
  });
});
