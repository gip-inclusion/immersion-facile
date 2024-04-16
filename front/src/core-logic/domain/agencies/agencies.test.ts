import { AgencyDtoBuilder, AgencyOption, AgencyPublicDisplayDto } from "shared";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { AgenciesState, agenciesSlice } from "./agencies.slice";

describe("Agencies in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const fakeAgencyId = "1111";
  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("agency infos", () => {
    it("should switch isLoading to true when fetch agency info is requested", () => {
      store.dispatch(
        agenciesSlice.actions.fetchAgencyInfoRequested(fakeAgencyId),
      );
      expectIsLoadingToBe(true);
    });

    it("should store agency info when agency is fetched from agency id", () => {
      const agency = new AgencyDtoBuilder().build();

      store.dispatch(agenciesSlice.actions.fetchAgencyInfoRequested(agency.id));

      const expectedAgencyInfos: AgencyPublicDisplayDto = {
        id: agency.id,
        name: agency.name,
        kind: agency.kind,
        address: agency.address,
        position: agency.position,
        signature: agency.signature,
        agencySiret: agency.agencySiret,
        refersToAgency: null,
        logoUrl: agency.logoUrl,
      };
      dependencies.agencyGateway.agencyInfo$.next(expectedAgencyInfos);

      expectAgencyInfoToEqual(expectedAgencyInfos);
      expectIsLoadingToBe(false);
      expectFeedbackToEqual({
        kind: "success",
      });
    });

    it("should throw an error when something goes wrong", () => {
      const errorMessage = "Error trying to fetch agency info by ID";
      const expectedFeedback: AgenciesState["feedback"] = {
        kind: "errored",
        errorMessage,
      };
      store.dispatch(
        agenciesSlice.actions.fetchAgencyInfoRequested(fakeAgencyId),
      );

      dependencies.agencyGateway.agencyInfo$.error(new Error(errorMessage));

      expectIsLoadingToBe(false);
      expectAgencyInfoToEqual(agenciesSlice.getInitialState().details);
      expectFeedbackToEqual(expectedFeedback);
    });
  });

  describe("agency options", () => {
    it("agencies list should be initialState at start", () => {
      const expected: AgencyOption[] = [];
      expectOptionsToEqual(expected);
    });

    it("retrieves agencies from API by department code and store in state", () => {
      // Arrange
      const agenciesFromApi: AgencyOption[] = [
        {
          id: "0",
          name: "Agence de Bougoin",
          kind: "autre",
        },
      ];

      const departementCode = "11";

      // Execute
      store.dispatch(
        agenciesSlice.actions.fetchAgenciesByDepartmentCodeRequested(
          departementCode,
        ),
      );
      expectIsLoadingToBe(true);
      dependencies.agencyGateway.agencies$.next(agenciesFromApi);

      // Expect
      expectIsLoadingToBe(false);
      expectOptionsToEqual(agenciesFromApi);
    });
  });

  const expectIsLoadingToBe = (expected: AgenciesState["isLoading"]) =>
    expect(agenciesSelectors.agencies(store.getState()).isLoading).toBe(
      expected,
    );

  const expectAgencyInfoToEqual = (expected: AgenciesState["details"]) =>
    expect(agenciesSelectors.agencies(store.getState()).details).toEqual(
      expected,
    );

  const expectFeedbackToEqual = (expected: AgenciesState["feedback"]) =>
    expect(agenciesSelectors.agencies(store.getState()).feedback).toEqual(
      expected,
    );

  const expectOptionsToEqual = (expected: AgenciesState["options"]) =>
    expect(agenciesSelectors.agencies(store.getState()).options).toEqual(
      expected,
    );
});
