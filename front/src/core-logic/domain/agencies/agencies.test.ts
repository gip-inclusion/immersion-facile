import { ConventionViewAgencyDto } from "shared/src/agency/agency.dto";
import { expectToEqual } from "shared/src/expectToEqual";
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
    const expected: ConventionViewAgencyDto[] = [];
    expectToEqual(store.getState().agencies, expected);
  });

  it("should return filtered agencies list in Ain department using department code", () => {
    // Arrange
    const expected: ConventionViewAgencyDto[] = [conventionAgencies[0]];

    const departementCode = "11";

    // Execute
    store.dispatch(
      agenciesSlice.actions.fetchAgenciesRequested(departementCode),
    );
    dependencies.agencyGateway.agencies$.next(conventionAgencies);

    // Expect
    expectToEqual(agenciesSelector(store.getState()), expected);
  });

  it("should return filtered agencies list in Ain department using postcode", () => {
    // Arrange
    const expected: ConventionViewAgencyDto[] = [conventionAgencies[0]];

    const postCode = "11000";

    // Execute
    store.dispatch(agenciesSlice.actions.fetchAgenciesRequested(postCode));
    dependencies.agencyGateway.agencies$.next(conventionAgencies);

    // Expect
    expectToEqual(agenciesSelector(store.getState()), expected);
  });
});

const conventionAgencies: ConventionViewAgencyDto[] = [
  {
    id: "0",
    kind: "pole-emploi",
    name: "Agence de Bougoin",
    address: {
      streetNumberAndAddress: "17 rue du Chat",
      postcode: "11000",
      departmentCode: "11",
      city: "Carcassonne",
    },
  },
  {
    id: "1",
    kind: "pole-emploi",
    name: "Agence de Vaulx",
    address: {
      streetNumberAndAddress: "21 rue du Chien",
      postcode: "69120",
      departmentCode: "69",
      city: "Vaulx-en-Velin",
    },
  },
];
