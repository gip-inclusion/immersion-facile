import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { expectToEqual } from "shared/src/expectToEqual";
import { agenciesSelectors } from "./agencies.selector";
import { AgencyDto, AgencyIdAndName } from "shared/src/agency/agency.dto";

import { agenciesSlice } from "./agencies.slice";

//const defaultAgencies: AgencyIdAndName[] = [];

describe("Agencies in store", () => {
  let store: ReduxStore;
  let _dependencies: TestDependencies;

  beforeEach(() => {
    ({ store } = createTestStore());
  });

  it("agencies list should be empty at start", () => {
    const expected: AgencyDto[] = [];
    expectToEqual(agenciesSelectors.agencies(store.getState()), expected);
    expectToEqual(agenciesSelectors.isLoading(store.getState()), false);
  });

  it("shows that fetch agencies has started", () => {
    store.dispatch(agenciesSlice.actions.fetchAgenciesRequested());
    expectToEqual(agenciesSelectors.isLoading(store.getState()), true);
  });

  it("loads agencies from gateway", () => {
    store.dispatch(agenciesSlice.actions.fetchAgenciesRequested());
    expectToEqual(agenciesSelectors.isLoading(store.getState()), true);
  });

  it("should return agencies list in Ain department", () => {
    // Arrange
    const agencies: AgencyIdAndName[] = [
      {
        id: "1",
        name: "Agence de l'Ain",
      },
      {
        id: "2",
        name: "Agence de l'Ain Bis",
      },
    ];

    // dependencies = {
    //   agencyGateway: {
    //     listAgencies: () => agencies,
    //   },
    // } as TestDependencies;

    const expected = agencies;

    // Execute
    //store.dispatch();

    // Expect
    expectToEqual(agenciesSelectors.agencies(store.getState()), expected);
  });
});
