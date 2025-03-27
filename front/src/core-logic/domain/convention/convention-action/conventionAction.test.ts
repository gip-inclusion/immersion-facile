import {
  ConventionDtoBuilder,
  type ConventionReadDto,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import {
  type ConventionActionState,
  conventionActionInitialState,
  conventionActionSlice,
} from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import {
  type ConventionState,
  initialConventionState,
} from "src/core-logic/domain/convention/convention.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import type { Feedbacks } from "src/core-logic/domain/feedback/feedback.slice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyFields = {
  agencyCounsellorEmails: [],
  agencyDepartment: "75",
  agencyKind: "mission-locale" as const,
  agencyName: "Agence Mission Locale",
  agencyRefersTo: undefined,
  agencySiret: "11110000111155",
  agencyValidatorEmails: [],
};
const convention: ConventionReadDto = {
  ...agencyFields,
  ...new ConventionDtoBuilder().notSigned().build(),
};

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
  describe("convention status change actions", () => {
    beforeEach(() => {
      ({ store, dependencies } = createTestStore({
        convention: {
          ...initialConventionState,
          convention,
        },
      }));
    });

    describe("cancelConvention", () => {
      it("cancels convention successfully", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        const conventionwithStatusChanged: ConventionReadDto = {
          ...agencyFields,
          ...new ConventionDtoBuilder(convention)
            .withStatus("CANCELLED")
            .build(),
        };

        feedGatewayWithConvention(conventionwithStatusChanged);

        expectConventionState({
          isLoading: false,
          convention: conventionwithStatusChanged,
        });
      });

      it("gets error message when cancelling convention fails", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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

        expectConventionState({
          isLoading: false,
          convention,
        });
      });
    });

    describe("deprecateConvention", () => {
      it("deprecates convention successfully", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        const conventionwithStatusChanged: ConventionReadDto = {
          ...agencyFields,
          ...new ConventionDtoBuilder(convention)
            .withStatus("DEPRECATED")
            .build(),
        };

        feedGatewayWithConvention(conventionwithStatusChanged);

        expectConventionState({
          isLoading: false,
          convention: conventionwithStatusChanged,
        });
      });

      it("gets error message when deprecating convention fails", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        expectConventionState({
          isLoading: false,
          convention,
        });
      });
    });

    describe("rejectConvention", () => {
      it("rejects convention successfully", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        const conventionwithStatusChanged: ConventionReadDto = {
          ...agencyFields,
          ...new ConventionDtoBuilder(convention)
            .withStatus("REJECTED")
            .build(),
        };
        feedGatewayWithConvention(conventionwithStatusChanged);

        expectConventionState({
          isLoading: false,
          convention: conventionwithStatusChanged,
        });
      });

      it("gets error message when rejecting convention fails", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        expectConventionState({
          isLoading: false,
          convention,
        });
      });
    });

    describe("editConvention", () => {
      it("requests convention edit successfully", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
            message: "La demande de modification a bien été prise en compte",
            on: "update",
            title: "La demande de modification a bien été prise en compte",
          },
        );
        const conventionwithStatusChanged: ConventionReadDto = {
          ...agencyFields,
          ...new ConventionDtoBuilder(convention).withStatus("DRAFT").build(),
        };
        feedGatewayWithConvention(conventionwithStatusChanged);

        expectConventionState({
          isLoading: false,
          convention: conventionwithStatusChanged,
        });
      });

      it("gets error message when requesting convention edit fails", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
            title: "Problème lors de la demande de modification",
          },
        );
        expectConventionState({
          isLoading: false,
          convention,
        });
      });
    });

    describe("acceptByValidator", () => {
      it("accepts convention by validator successfully", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        const conventionwithStatusChanged: ConventionReadDto = {
          ...agencyFields,
          ...new ConventionDtoBuilder(convention)
            .withStatus("ACCEPTED_BY_VALIDATOR")
            .build(),
        };
        feedGatewayWithConvention(conventionwithStatusChanged);

        expectConventionState({
          isLoading: false,
          convention: conventionwithStatusChanged,
        });
      });

      it("gets error message when accepting convention by validator fails", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
        expectConventionState({
          isLoading: false,
          convention,
        });
      });
    });

    describe("acceptByCounsellor", () => {
      it("accepts convention by counsellor successfully", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
            message: "La convention a bien été pré-validée",
            on: "update",
            title: "La convention a bien été pré-validée",
          },
        );
        const conventionwithStatusChanged: ConventionReadDto = {
          ...agencyFields,
          ...new ConventionDtoBuilder(convention)
            .withStatus("ACCEPTED_BY_COUNSELLOR")
            .build(),
        };
        feedGatewayWithConvention(conventionwithStatusChanged);

        expectConventionState({
          isLoading: false,
          convention: conventionwithStatusChanged,
        });
      });

      it("gets error message when accepting convention by counsellor fails", () => {
        expectInitialConventionActionAndFeedbackState();
        expectConventionState({
          isLoading: false,
          convention,
        });
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
            title: "Problème lors de la pré-validation de la convention",
          },
        );
        expectConventionState({
          isLoading: false,
          convention,
        });
      });
    });
  });
  describe("transferConventionToAgency", () => {
    beforeEach(() => {
      ({ store, dependencies } = createTestStore({
        convention: {
          ...initialConventionState,
          convention,
        },
      }));
    });
    it("transfers convention to agency", () => {
      expectInitialConventionActionAndFeedbackState();
      expectConventionState({
        isLoading: false,
        convention,
      });
      store.dispatch(
        conventionActionSlice.actions.transferConventionToAgencyRequested({
          transferConventionToAgencyParams: {
            conventionId: "fake-convention-id",
            agencyId: "agency-transferred-id",
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
      const conventionWithAgencyChanged: ConventionReadDto = {
        agencyName: "agency-transferred-name",
        agencyCounsellorEmails: [],
        agencyDepartment: "87",
        agencyKind: "pole-emploi" as const,
        agencyRefersTo: undefined,
        agencySiret: "22220000111155",
        agencyValidatorEmails: [],
        ...new ConventionDtoBuilder(convention)
          .withAgencyId("agency-transferred-id")
          .build(),
      };
      feedGatewayWithConvention(conventionWithAgencyChanged);

      expectConventionState({
        isLoading: false,
        convention: conventionWithAgencyChanged,
      });
    });

    it("gets error message when transferring convention to agency fails", () => {
      expectInitialConventionActionAndFeedbackState();
      expectConventionState({
        isLoading: false,
        convention,
      });
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
      expectConventionState({
        isLoading: false,
        convention,
      });
    });
  });

  describe("Broadcast convention to partner", () => {
    it("successfully trigger the broadcast, than needs to wait for a delay before broadcast is considered successfull", () => {
      expectInitialConventionActionAndFeedbackState();
      store.dispatch(
        conventionActionSlice.actions.broadcastConventionToPartnerRequested({
          conventionId: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
          feedbackTopic: "broadcast-convention-again",
        }),
      );
      expectConventionActionState({
        isBroadcasting: true,
      });

      dependencies.conventionGateway.broadcastConventionAgainResult$.next(
        undefined,
      );

      expectConventionActionState({
        isBroadcasting: true,
      });

      fastForwardObservables();

      expectConventionActionState({
        isBroadcasting: false,
      });

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "broadcast-convention-again": {
          on: "create",
          level: "success",
          title: "La convention a bien été rediffusée",
          message:
            "La convention a bien été rediffusée au partenaire. Vous pouvez vous rapprocher du partenaire pour le vérifier.",
        },
      });
    });

    it("fails when triggering the broadcast", () => {
      expectInitialConventionActionAndFeedbackState();
      const errorMessageFromApi = "error occurred from api";
      store.dispatch(
        conventionActionSlice.actions.broadcastConventionToPartnerRequested({
          conventionId: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
          feedbackTopic: "broadcast-convention-again",
        }),
      );
      expectConventionActionState({
        isBroadcasting: true,
      });

      dependencies.conventionGateway.broadcastConventionAgainResult$.error(
        new Error(errorMessageFromApi),
      );

      expectConventionActionState({
        isBroadcasting: false,
      });
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "broadcast-convention-again": {
          on: "create",
          level: "error",
          title: "Problème rencontré lors de la rediffusion au partenaire",
          message: errorMessageFromApi,
        },
      });
    });
  });

  describe("Convention signature", () => {
    beforeEach(() => {
      ({ store, dependencies } = createTestStore({
        convention: {
          ...initialConventionState,
          convention,
        },
      }));
    });

    it("signs the conventions with role from jwt", () => {
      expectInitialConventionActionAndFeedbackState();
      expectConventionState({
        isLoading: false,
        convention,
      });

      store.dispatch(
        conventionActionSlice.actions.signConventionRequested({
          conventionId: convention.id,
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-sign",
        }),
      );

      expectConventionActionState({
        isLoading: true,
      });
      feedGatewayWithSignSuccess();
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "convention-action-sign": {
          on: "update",
          level: "success",
          title: "La convention a bien été signée",
          message: "La convention a bien été signée",
        },
      });

      const signedConvention: ConventionReadDto = {
        ...agencyFields,
        ...new ConventionDtoBuilder(convention)
          .signedByEstablishmentRepresentative(new Date().toISOString())
          .build(),
      };

      feedGatewayWithConvention(signedConvention);

      expectConventionState({
        isLoading: false,
        convention: signedConvention,
      });
    });

    it("gets error message when signature fails", () => {
      expectInitialConventionActionAndFeedbackState();
      expectConventionState({
        isLoading: false,
        convention,
      });

      store.dispatch(
        conventionActionSlice.actions.signConventionRequested({
          conventionId: "id",
          jwt: "fake-jwt",
          feedbackTopic: "convention-action-sign",
        }),
      );
      expectConventionActionState({
        isLoading: true,
      });
      const errorMessage = "You are not allowed to sign";
      feedGatewayWithSignError(new Error(errorMessage));
      expectConventionActionState({
        isLoading: false,
      });

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "convention-action-sign": {
          on: "update",
          level: "error",
          title: "Problème lors de la signature de la convention",
          message: errorMessage,
        },
      });

      expectConventionState({
        isLoading: false,
        convention,
      });
    });
  });

  const expectInitialConventionActionAndFeedbackState = () => {
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
    dependencies.conventionGateway.conventionModificationResult$.next(
      undefined,
    );
  };

  const feedGatewayWithUpdateConventionStatusFailure = (error: Error) => {
    dependencies.conventionGateway.conventionModificationResult$.error(error);
  };

  const fastForwardObservables = () => dependencies.scheduler.flush();

  const expectConventionState = (conventionState: Partial<ConventionState>) => {
    expectObjectsToMatch(store.getState().convention, conventionState);
  };

  const feedGatewayWithConvention = (convention: ConventionReadDto) => {
    dependencies.conventionGateway.convention$.next(convention);
  };

  const feedGatewayWithSignSuccess = () => {
    dependencies.conventionGateway.conventionSignedResult$.next(undefined);
  };

  const feedGatewayWithSignError = (error: Error) => {
    dependencies.conventionGateway.conventionSignedResult$.error(error);
  };
});
