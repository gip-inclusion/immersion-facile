import { AgencyDtoBuilder } from "src/../../shared/src";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { agencyInfoSlice, AgencyInfoState } from "./agencyInfo.slice";

describe("Agency info in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const fakeAgencyId = "1111";
  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should switch isLoading to true when fetch agency info is requested", () => {
    store.dispatch(
      agencyInfoSlice.actions.fetchAgencyInfoRequested(fakeAgencyId),
    );

    expectIsLoadingToBe(true);
  });

  it("should store agency info when agency is fetched from agency id", () => {
    const agency = new AgencyDtoBuilder().build();

    const expectedAgencyInfos = {
      id: agency.id,
      name: agency.name,
      address: agency.address,
      position: agency.position,
    };

    store.dispatch(
      agencyInfoSlice.actions.fetchAgencyInfoRequested(expectedAgencyInfos.id),
    );
    dependencies.agencyGateway.agencyInfo$.next({
      id: expectedAgencyInfos.id,
      name: expectedAgencyInfos.name,
      address: expectedAgencyInfos.address,
      position: expectedAgencyInfos.position,
    });

    expectAgencyInfoToEqual(expectedAgencyInfos);
    expectIsLoadingToBe(false);
  });

  it("should throw an error when something goes wrong", () => {
    const errorMessage = "Error trying to fetch agency info by ID";
    const expectedFeedback: AgencyInfoState["feedback"] = {
      kind: "errored",
      errorMessage,
    };
    store.dispatch(
      agencyInfoSlice.actions.fetchAgencyInfoRequested(fakeAgencyId),
    );

    dependencies.agencyGateway.agencyInfo$.error(new Error(errorMessage));

    expectIsLoadingToBe(false);
    expectAgencyInfoToEqual(agencyInfoSlice.getInitialState().agencyInfo);
    expectFeedbackToEqual(expectedFeedback);
  });

  const expectIsLoadingToBe = (expected: AgencyInfoState["isLoading"]) =>
    expect(store.getState().agencyInfo.isLoading).toBe(expected);

  const expectAgencyInfoToEqual = (expected: AgencyInfoState["agencyInfo"]) =>
    expect(store.getState().agencyInfo.agencyInfo).toEqual(expected);

  const expectFeedbackToEqual = (expected: AgencyInfoState["feedback"]) =>
    expect(store.getState().agencyInfo.feedback).toEqual(expected);
});
