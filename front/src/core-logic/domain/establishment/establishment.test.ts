import {
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  InclusionConnectJwt,
  SiretEstablishmentDto,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  EstablishmentRequestedPayload,
  EstablishmentState,
  defaultFormEstablishmentValue,
  establishmentSlice,
} from "./establishment.slice";

const establishmentWithoutAddressFromSiretFetched: SiretEstablishmentDto = {
  siret: "11110000111100",
  businessName: "Existing open business on Sirene Corp.",
  businessAddress: "",
  isOpen: true,
  numberEmployeesRange: "",
};
const establishmentWithAddressFromSiretFetched: SiretEstablishmentDto = {
  siret: "11110000111100",
  businessName: "Existing open business on Sirene Corp.",
  businessAddress: "102 rue du fake, 75001 Paris",
  isOpen: true,
  numberEmployeesRange: "10-19",
};

const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

describe("Establishment", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    const storeAndDeps = createTestStore();
    ({ store, dependencies } = storeAndDeps);
  });

  it("reflects when user wants to input siret", () => {
    store.dispatch(establishmentSlice.actions.gotReady());

    expect(establishmentSelectors.isReadyForRedirection(store.getState())).toBe(
      true,
    );
  });

  it("does not trigger navigation when siret is requested if establishment is not ready for redirection", () => {
    store.dispatch(
      siretSlice.actions.siretInfoSucceeded({
        siretEstablishment: {
          siret: "123",
        } as SiretEstablishmentDto,
        feedbackTopic: "siret-input",
      }),
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered(null);
  });

  it("triggers navigation when siret is requested if establishment is ready for redirection but has no address provided", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        isLoading: false,
        isReadyForRedirection: true,
        formEstablishment: defaultFormEstablishmentValue(),
      },
    }));
    store.dispatch(
      siretSlice.actions.siretModified({
        siret: "10002000300040",
        feedbackTopic: "siret-input",
      }),
    );
    dependencies.formCompletionGateway.siretInfo$.next(
      establishmentWithoutAddressFromSiretFetched,
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered({
      siret: establishmentWithoutAddressFromSiretFetched.siret,
      bName: establishmentWithoutAddressFromSiretFetched.businessName,
    });
  });

  it("triggers navigation when siret is requested if establishment is ready for redirection with address provided", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        isLoading: false,
        isReadyForRedirection: true,
        formEstablishment: defaultFormEstablishmentValue(),
      },
    }));
    store.dispatch(
      siretSlice.actions.siretModified({
        siret: "10002000300040",
        feedbackTopic: "siret-input",
      }),
    );
    dependencies.formCompletionGateway.siretInfo$.next(
      establishmentWithAddressFromSiretFetched,
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered({
      siret: establishmentWithAddressFromSiretFetched.siret,
      bName: establishmentWithAddressFromSiretFetched.businessName,
      bAddresses: [establishmentWithAddressFromSiretFetched.businessAddress],
    });
  });

  it("send modification link", () => {
    expectEstablishmentStateToMatch({
      isLoading: false,
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested({
        siret: "siret-123",
        feedbackTopic: "establishment-modification-link",
      }),
    );
    expectEstablishmentStateToMatch({ isLoading: true });
    dependencies.establishmentGateway.establishmentModificationResponse$.next(
      undefined,
    );
    expectEstablishmentStateToMatch({
      isLoading: false,
    });
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "establishment-modification-link": {
        on: "create",
        level: "success",
        message:
          "Le lien de modification de l'entreprise a bien été envoyé par email.",
        title: "Lien envoyé",
      },
    });
  });

  it("handle send modification link error", () => {
    const errorMessage =
      "Il y a eu un problème lors de l'envoi du lien de modification de l'entreprise.";
    expectEstablishmentStateToMatch({
      isLoading: false,
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested({
        siret: "siret-123",
        feedbackTopic: "establishment-modification-link",
      }),
    );
    expect(establishmentSelectors.isLoading(store.getState())).toBe(true);
    dependencies.establishmentGateway.establishmentModificationResponse$.error(
      new Error(errorMessage),
    );
    expect(establishmentSelectors.isLoading(store.getState())).toBe(false);
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "establishment-modification-link": {
        on: "create",
        level: "error",
        message: errorMessage,
        title: "Lien non envoyé",
      },
    });
  });

  describe("establishment fetch", () => {
    it("fetches establishment on establishment creation (empty params)", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: {},
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(
        establishmentSelectors.formEstablishment(store.getState()),
        defaultFormEstablishmentValue(),
      );
    });

    it("fetches establishment on establishment creation (with params)", () => {
      expectStoreToMatchInitialState();
      const testedQueryParams = {
        siret: "12345678901234",
        fitForDisabledWorkers: true,
      } satisfies EstablishmentRequestedPayload;
      const expectedFormEstablishment: FormEstablishmentDto = {
        ...defaultFormEstablishmentValue(),
        siret: testedQueryParams.siret,
        fitForDisabledWorkers: testedQueryParams.fitForDisabledWorkers,
      };
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: testedQueryParams,
          feedbackTopic: "form-establishment",
        }),
      );

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(
        establishmentSelectors.formEstablishment(store.getState()),
        expectedFormEstablishment,
      );
    });

    it("fetches establishment on establishment edition (JWT query params)", () => {
      expectStoreToMatchInitialState();
      const testedQueryParams: EstablishmentRequestedPayload = {
        jwt: "some-correct-jwt",
        siret: "12345678901234",
      };
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: testedQueryParams,
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(
        establishmentSelectors.formEstablishment(store.getState()),
        formEstablishment,
      );
    });

    it("should fail when fetching establishment on establishment edition (JWT query params) on gateway error", () => {
      expectStoreToMatchInitialState();
      const testedQueryParams: EstablishmentRequestedPayload = {
        jwt: "some-wrong-jwt",
        siret: "12345678901234",
      };
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: testedQueryParams,
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.formEstablishment$.error(
        new Error("some-error"),
      );

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "fetch",
          level: "error",
          message: "some-error",
          title: "Problème lors de la recuperation des données de l'entreprise",
        },
      });
      expectToEqual(
        establishmentSelectors.formEstablishment(store.getState()),
        defaultFormEstablishmentValue(),
      );
    });

    it("should clear establishment", () => {
      const initialEstablishmentState: EstablishmentState = {
        isLoading: true,
        isReadyForRedirection: false,
        formEstablishment,
      };
      ({ store, dependencies } = createTestStore({
        establishment: initialEstablishmentState,
      }));
      expectEstablishmentStateToMatch(initialEstablishmentState);
      store.dispatch(establishmentSlice.actions.clearEstablishmentRequested());

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);

      expectToEqual(
        establishmentSelectors.formEstablishment(store.getState()),
        defaultFormEstablishmentValue(),
      );
    });
  });

  describe("establishment creation", () => {
    it("should create establishment", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.createEstablishmentRequested({
          formEstablishment: formEstablishment,
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.addFormEstablishmentResult$.next(
        undefined,
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "create",
          level: "success",
          message: "L'entreprise a bien été ajoutée à notre annuaire.",
          title: "L'entreprise a bien été créée",
        },
      });
    });

    it("should fail when creating establishment on gateway error", () => {
      const errorMessageFromGateway = "Submit error message not used in slice";
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.createEstablishmentRequested({
          formEstablishment: formEstablishment,
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.addFormEstablishmentResult$.error(
        new Error(errorMessageFromGateway),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "create",
          level: "error",
          message: errorMessageFromGateway,
          title: "Problème lors de la création de l'entreprise",
        },
      });
    });
  });

  describe("establishment edition", () => {
    it("should edit requested establishment", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: {
            jwt: "previously-saved-jwt",
            siret: "12345678901234",
          },
          feedbackTopic: "form-establishment",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        formEstablishment,
        isLoading: false,
      });
      const editedEstablishment: FormEstablishmentDto = {
        ...formEstablishment,
        isEngagedEnterprise: !formEstablishment.isEngagedEnterprise,
        businessAddresses: [
          {
            id: "11111111-2222-4444-1111-1111111111111111",
            rawAddress: "26 rue des castors, 75002 Paris",
          },
        ],
        businessNameCustomized: "My custom name",
      };
      store.dispatch(
        establishmentSlice.actions.updateEstablishmentRequested({
          establishmentUpdate: {
            formEstablishment: editedEstablishment,
            jwt: "previously-saved-jwt",
          },
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.editFormEstablishmentResult$.next(
        undefined,
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "update",
          level: "success",
          message: "L'entreprise a bien été mise à jour",
          title: "L'entreprise a bien été mise à jour",
        },
      });
    });

    it("should fail when editing establishment on gateway error", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: {
            jwt: "previously-saved-jwt",
            siret: "12345678901234",
          },
          feedbackTopic: "form-establishment",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        formEstablishment,
        isLoading: false,
      });
      const editedEstablishment: FormEstablishmentDto = {
        ...formEstablishment,
        isEngagedEnterprise: !formEstablishment.isEngagedEnterprise,
        businessAddresses: [
          {
            id: "11111111-2222-4444-1111-111111111111",
            rawAddress: "26 rue des castors, 75002 Paris",
          },
        ],
        businessNameCustomized: "My custom name",
      };
      store.dispatch(
        establishmentSlice.actions.updateEstablishmentRequested({
          establishmentUpdate: {
            formEstablishment: editedEstablishment,
            jwt: "previously-saved-jwt",
          },
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.editFormEstablishmentResult$.error(
        new Error("Submit error message not used in slice"),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "update",
          level: "error",
          message: "Submit error message not used in slice",
          title: "Problème lors de la mise à jour de l'entreprise",
        },
      });
    });
  });

  describe("establishment deletion", () => {
    const backOfficeJwt: InclusionConnectJwt = "backoffice-jwt";

    it("should delete requested establishment", () => {
      expectStoreToMatchInitialState();

      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: {
            jwt: backOfficeJwt,
            siret: "12345678901234",
          },
          feedbackTopic: "form-establishment",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        formEstablishment,
        isLoading: false,
      });

      store.dispatch(
        establishmentSlice.actions.deleteEstablishmentRequested({
          establishmentDelete: {
            siret: formEstablishment.siret,
            jwt: backOfficeJwt,
          },
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.deleteEstablishmentResult$.next(
        undefined,
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "delete",
          level: "success",
          message: "L'entreprise a bien été supprimée",
          title: "L'entreprise a bien été supprimée",
        },
      });
    });

    it("should fail when editing establishment on gateway error", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.fetchEstablishmentRequested({
          establishmentRequested: {
            jwt: backOfficeJwt,
            siret: "12345678901234",
          },
          feedbackTopic: "form-establishment",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        formEstablishment,
        isLoading: false,
      });
      store.dispatch(
        establishmentSlice.actions.deleteEstablishmentRequested({
          establishmentDelete: {
            siret: formEstablishment.siret,
            jwt: backOfficeJwt,
          },
          feedbackTopic: "form-establishment",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.deleteEstablishmentResult$.error(
        new Error("Deletion error message not used in slice"),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "form-establishment": {
          on: "delete",
          level: "error",
          message: "Deletion error message not used in slice",
          title: "Problème lors de la suppression de l'entreprise",
        },
      });
    });
  });

  const expectStoreToMatchInitialState = () =>
    expectEstablishmentStateToMatch({
      isLoading: false,
      formEstablishment: defaultFormEstablishmentValue(),
    });
  const expectEstablishmentStateToMatch = (
    expected: Partial<EstablishmentState>,
  ) => expectObjectsToMatch(store.getState().establishment, expected);

  const expectNavigationToEstablishmentFormPageToHaveBeenTriggered = (
    formEstablishmentParamsInUrl: FormEstablishmentParamsInUrl | null,
  ) => {
    expect(dependencies.navigationGateway.navigatedToEstablishmentForm).toEqual(
      formEstablishmentParamsInUrl,
    );
  };
});
