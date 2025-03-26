import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  type ConventionActionState,
  conventionActionInitialState,
  conventionActionSlice,
} from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import type { Feedbacks } from "src/core-logic/domain/feedback/feedback.slice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("convention action slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      conventionAction: {
        ...conventionActionInitialState,
      },
    }));
  });

  describe("transferConventionToAgency", () => {
    it("transfers convention to agency", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.transferConventionToAgencyRequested({
          transferConventionToAgencyParams: {
            conventionId: "fake-covention-id",
            agencyId: "fake-agency-id",
            justification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "transfer-convention-to-agency",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayTransferConventionToAgencySuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "transfer-convention-to-agency"
        ],
        {
          level: "success",
          message: "La convention a bien été transférée au nouvel organisme",
          on: "update",
          title: "La convention a bien été transférée",
        },
      );
    });

    it("gets error message when transferring convention to agency fails", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.transferConventionToAgencyRequested({
          transferConventionToAgencyParams: {
            conventionId: "fake-covention-id",
            agencyId: "fake-agency-id",
            justification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "transfer-convention-to-agency",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue lors du transfert de la convention.";
      feedGatewayWithTransferConventionToAgencyFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "transfer-convention-to-agency"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème lors du transfert de la convention",
        },
      );
    });
  });

  describe("cancelConvention", () => {
    it("cancels convention successfully", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.cancelConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "CANCELLED",
            statusJustification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-cancel",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayUpdateConventionStatusSuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-cancel"
        ],
        {
          level: "success",
          message: "La convention a bien été annulée",
          on: "update",
          title: "La convention a bien été annulée",
        },
      );
    });

    it("gets error message when cancelling convention fails", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.cancelConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "CANCELLED",
            statusJustification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-cancel",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue lors de l'annulation de la convention.";
      feedGatewayWithUpdateConventionStatusFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-cancel"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème lors de l'annulation de la convention",
        },
      );
    });
  });

  describe("deprecateConvention", () => {
    it("deprecates convention successfully", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.deprecateConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "DEPRECATED",
            statusJustification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-deprecate",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayUpdateConventionStatusSuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-deprecate"
        ],
        {
          level: "success",
          message: "La convention a bien été marquée comme obsolète",
          on: "update",
          title: "La convention a bien été marquée comme obsolète",
        },
      );
    });

    it("gets error message when deprecating convention fails", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.deprecateConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "DEPRECATED",
            statusJustification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-deprecate",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue pour marquer la convention comme obsolète.";
      feedGatewayWithUpdateConventionStatusFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-deprecate"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème pour marquer la convention comme obsolète",
        },
      );
    });
  });

  describe("rejectConvention", () => {
    it("rejects convention successfully", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.rejectConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "REJECTED",
            statusJustification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-reject",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayUpdateConventionStatusSuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-reject"
        ],
        {
          level: "success",
          message: "La convention a bien été rejetée",
          on: "update",
          title: "La convention a bien été rejetée",
        },
      );
    });

    it("gets error message when rejecting convention fails", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.rejectConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "REJECTED",
            statusJustification: "fake-justification",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-reject",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue lors du rejet de la convention.";
      feedGatewayWithUpdateConventionStatusFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-reject"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème lors du rejet de la convention",
        },
      );
    });
  });

  describe("editConvention", () => {
    it("requests convention edit successfully", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.editConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "DRAFT",
            statusJustification: "fake-justification",
            modifierRole: "validator",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-edit",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayUpdateConventionStatusSuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-edit"
        ],
        {
          level: "success",
          message: "La convention a bien été modifiée",
          on: "update",
          title: "La convention a bien été modifiée",
        },
      );
    });

    it("gets error message when requesting convention edit fails", () => {
      store.dispatch(
        conventionActionSlice.actions.editConventionRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "DRAFT",
            statusJustification: "fake-justification",
            modifierRole: "validator",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-edit",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue lors de la demande de modification de la convention.";
      feedGatewayWithUpdateConventionStatusFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-edit"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème lors de la demande de modification de la convention",
        },
      );
    });
  });

  describe("acceptByValidator", () => {
    it("accepts convention by validator successfully", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.acceptByValidatorRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "ACCEPTED_BY_VALIDATOR",
            firstname: "jean",
            lastname: "pierre",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-accept-by-validator",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayUpdateConventionStatusSuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-accept-by-validator"
        ],
        {
          level: "success",
          message: "La convention a bien été validée",
          on: "update",
          title: "La convention a bien été validée",
        },
      );
    });

    it("redirects to counsellor when convention needs counsellor review", () => {
      store.dispatch(
        conventionActionSlice.actions.acceptByValidatorRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "ACCEPTED_BY_VALIDATOR",
            firstname: "jean",
            lastname: "pierre",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-accept-by-validator",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayWithUpdateConventionStatusFailure(
        new Error("Convention should be reviewed by counsellor"),
      );
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-accept-by-validator"
        ],
        {
          level: "success",
          message: "La convention a bien été validée",
          on: "update",
          title: "La convention a bien été validée",
        },
      );
    });

    it("gets error message when accepting convention by validator fails", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.acceptByValidatorRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "ACCEPTED_BY_VALIDATOR",
            firstname: "jean",
            lastname: "pierre",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-accept-by-validator",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue lors de la validation de la convention.";
      feedGatewayWithUpdateConventionStatusFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-accept-by-validator"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème lors de la validation de la convention",
        },
      );
    });
  });

  describe("acceptByCounsellor", () => {
    it("accepts convention by counsellor successfully", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.acceptByCounsellorRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "ACCEPTED_BY_COUNSELLOR",
            firstname: "jean",
            lastname: "pierre",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-accept-by-counsellor",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayUpdateConventionStatusSuccess();

      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-accept-by-counsellor"
        ],
        {
          level: "success",
          message: "La convention a bien été validée",
          on: "update",
          title: "La convention a bien été validée",
        },
      );
    });

    it("gets error message when accepting convention by counsellor fails", () => {
      expectInitialConventionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.acceptByCounsellorRequested({
          updateStatusParams: {
            conventionId: "fake-convention-id",
            status: "ACCEPTED_BY_COUNSELLOR",
            firstname: "jean",
            lastname: "pierre",
          },
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-accept-by-counsellor",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage =
        "Une erreur est survenue lors de la validation de la convention.";
      feedGatewayWithUpdateConventionStatusFailure(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "convention-action-accept-by-counsellor"
        ],
        {
          level: "error",
          message: errorMessage,
          on: "update",
          title: "Problème lors de la validation de la convention",
        },
      );
    });
  });

  describe()

  const expectInitialConventionAndFeedbackState = () => {
    expectConventionActionState({
      isLoading: false,
    });
    expectFeebackState({});
  };

  const expectFeebackState = (feedbackState: Partial<Feedbacks>) => {
    expectObjectsToMatch(store.getState().feedbacks, feedbackState);
  };

  const expectConventionActionState = (
    conventionActionState: Partial<ConventionActionState>,
  ) => {
    expectObjectsToMatch(
      store.getState().conventionAction,
      conventionActionState,
    );
  };

  const feedGatewayTransferConventionToAgencySuccess = () => {
    dependencies.conventionGateway.transferConventionToAgencyResult$.next(
      undefined,
    );
  };

  const feedGatewayWithTransferConventionToAgencyFailure = (error: Error) => {
    dependencies.conventionGateway.transferConventionToAgencyResult$.error(
      error,
    );
  };

  const feedGatewayUpdateConventionStatusSuccess = () => {
    dependencies.conventionGateway.updateConventionResult$.next(undefined);
  };

  const feedGatewayWithUpdateConventionStatusFailure = (error: Error) => {
    dependencies.conventionGateway.updateConventionResult$.error(error);
  };
});
