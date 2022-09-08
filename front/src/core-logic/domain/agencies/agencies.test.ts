import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { expectToEqual } from "shared/src/expectToEqual";
import { agenciesSelector } from "./agencies.selector";
import { AgencyIdAndName } from "shared/src/agency/agency.dto";

import { agenciesSlice } from "./agencies.slice";

//const defaultAgencies: AgencyIdAndName[] = [];

describe("Agencies in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("agencies list should be initialState at start", () => {
    const expected: AgencyIdAndName[] = [];
    expectToEqual(store.getState().agencies, expected);
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

    dependencies = {
      agencyGateway: {
        listAgencies: () => agencies,
      },
    } as unknown as TestDependencies;

    const expected = agencies;

    // Execute
    store.dispatch(agenciesSlice.actions.fetchAgenciesRequested());
    // Expect
    expectToEqual(agenciesSelector(store.getState()), expected);
  });
});
