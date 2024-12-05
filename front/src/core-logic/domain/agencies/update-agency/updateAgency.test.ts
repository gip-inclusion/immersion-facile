import { AgencyDto, AgencyDtoBuilder, expectToEqual } from "shared";
import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { updateAgencySelectors } from "src/core-logic/domain/agencies/update-agency/updateAgency.selectors";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";

import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("update agency", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      agency: agenciesPreloadedState({}),
    }));
  });

  const agencyDto = new AgencyDtoBuilder().build();

  it("shows when update is ongoing", () => {
    store.dispatch(
      updateAgencySlice.actions.updateAgencyRequested({
        ...agencyDto,
        feedbackTopic: "agency-for-dashboard",
      }),
    );

    expectToEqual(updateAgencySelectors.isLoading(store.getState()), true);
  });

  it("send request to update agency, shows feedback", () => {
    const updatedAgency: AgencyDto = {
      ...agencyDto,
      validatorEmails: ["a@b.com", "c@d.com"],
    };
    store.dispatch(
      updateAgencySlice.actions.updateAgencyRequested({
        ...updatedAgency,
        feedbackTopic: "agency-for-dashboard",
      }),
    );

    expectToEqual(updateAgencySelectors.isLoading(store.getState()), true);

    dependencies.agencyGateway.updateAgencyResponse$.next(undefined);

    expectToEqual(updateAgencySelectors.isLoading(store.getState()), false);

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["agency-for-dashboard"],
      {
        level: "success",
        message: "Les données de l'agence ont été mises à jour.",
        on: "update",
        title: "L'agence a été mis à jour",
      },
    );
  });

  it("when something goes wrong, shows error", () => {
    store.dispatch(
      updateAgencySlice.actions.updateAgencyRequested({
        ...agencyDto,
        feedbackTopic: "agency-for-dashboard",
      }),
    );
    expectToEqual(updateAgencySelectors.isLoading(store.getState()), true);

    dependencies.agencyGateway.updateAgencyResponse$.error(
      new Error("Une erreur est survenue lors de la mise à jour de l'agence"),
    );

    expectToEqual(updateAgencySelectors.isLoading(store.getState()), false);

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["agency-for-dashboard"],
      {
        level: "error",
        message: "Une erreur est survenue lors de la mise à jour de l'agence",
        on: "update",
        title: "Problème lors de la mise à jour de l'agence",
      },
    );
  });
});
