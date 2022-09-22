import { expectToEqual } from "shared/src/expectToEqual";
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

  it("should return filtered agencies list in Ain department using department code", () => {
    // Arrange
    const expected: AgencyIdAndName[] = [
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
    dependencies.agencyGateway.agencies$.next(conventionAgencies);

    // Expect
    expectToEqual(agenciesSelector(store.getState()), expected);
  });
});

const conventionAgencies: (AgencyIdAndName & { departmentCode: string })[] = [
  {
    id: "0",
    name: "Agence de Bougoin",
    departmentCode: "11",
  },
  {
    id: "1",
    name: "Agence de Vaulx",
    departmentCode: "69",
  },
];
