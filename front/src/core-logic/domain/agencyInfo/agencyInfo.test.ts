import { AgencyDtoBuilder } from "shared";
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
    const expectedFeedback: AgencyInfoState["feedback"] = {
      kind: "success",
    };
    const expectedAgencyInfos = {
      id: agency.id,
      name: agency.name,
      address: agency.address,
      position: agency.position,
      signature: agency.signature,
    };

    store.dispatch(
      agencyInfoSlice.actions.fetchAgencyInfoRequested(expectedAgencyInfos.id),
    );
    dependencies.agencyGateway.agencyInfo$.next({
      id: expectedAgencyInfos.id,
      name: expectedAgencyInfos.name,
      address: expectedAgencyInfos.address,
      position: expectedAgencyInfos.position,
      signature: expectedAgencyInfos.signature,
    });

    expectAgencyInfoToEqual(expectedAgencyInfos);
    expectIsLoadingToBe(false);
    expectFeedbackToEqual(expectedFeedback);
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
    expectAgencyInfoToEqual(agencyInfoSlice.getInitialState().details);
    expectFeedbackToEqual(expectedFeedback);
  });

  const expectIsLoadingToBe = (expected: AgencyInfoState["isLoading"]) =>
    expect(store.getState().agencyInfo.isLoading).toBe(expected);

  const expectAgencyInfoToEqual = (expected: AgencyInfoState["details"]) =>
    expect(store.getState().agencyInfo.details).toEqual(expected);

  const expectFeedbackToEqual = (expected: AgencyInfoState["feedback"]) =>
    expect(store.getState().agencyInfo.feedback).toEqual(expected);
});
