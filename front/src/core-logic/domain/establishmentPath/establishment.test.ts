import {
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  InclusionConnectJwt,
  SiretEstablishmentDto,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
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

    expect(
      establishmentSelectors.isReadyForLinkRequestOrRedirection(
        store.getState(),
      ),
    ).toBe(true);
  });

  it("does not trigger navigation when siret is requested if status is not 'READY_FOR_LINK_REQUEST_OR_REDIRECTION'", () => {
    store.dispatch(
      siretSlice.actions.siretInfoSucceeded({
        siret: "123",
      } as SiretEstablishmentDto),
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered(null);
  });

  it("triggers navigation when siret is requested if status is 'READY_FOR_LINK_REQUEST_OR_REDIRECTION' without address provided", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        isLoading: false,
        feedback: { kind: "readyForLinkRequestOrRedirection" },
        formEstablishment: defaultFormEstablishmentValue(),
      },
    }));
    store.dispatch(siretSlice.actions.siretModified("10002000300040"));
    dependencies.formCompletionGateway.siretInfo$.next(
      establishmentWithoutAddressFromSiretFetched,
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered({
      siret: establishmentWithoutAddressFromSiretFetched.siret,
      bName: establishmentWithoutAddressFromSiretFetched.businessName,
    });
  });

  it("triggers navigation when siret is requested if status is 'READY_FOR_LINK_REQUEST_OR_REDIRECTION' with address provided", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        isLoading: false,
        feedback: { kind: "readyForLinkRequestOrRedirection" },
        formEstablishment: defaultFormEstablishmentValue(),
      },
    }));
    store.dispatch(siretSlice.actions.siretModified("10002000300040"));
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
      feedback: { kind: "idle" },
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested("siret-123"),
    );
    expectEstablishmentStateToMatch({ isLoading: true });
    dependencies.establishmentGateway.establishmentModificationResponse$.next(
      undefined,
    );
    expectEstablishmentStateToMatch({
      isLoading: false,
      feedback: { kind: "sendModificationLinkSuccess" },
    });
    expect(
      establishmentSelectors.sendModifyLinkSucceeded(store.getState()),
    ).toBe(true);
  });

  it("handle send modification link error", () => {
    expectEstablishmentStateToMatch({
      isLoading: false,
      feedback: { kind: "idle" },
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested("siret-123"),
    );
    expect(establishmentSelectors.isLoading(store.getState())).toBe(true);
    dependencies.establishmentGateway.establishmentModificationResponse$.error(
      new Error("whatever message"),
    );
    expect(establishmentSelectors.isLoading(store.getState())).toBe(false);
    expect(establishmentSelectors.feedback(store.getState())).toEqual({
      kind: "sendModificationLinkErrored",
    });
    expect(
      establishmentSelectors.sendModifyLinkSucceeded(store.getState()),
    ).toBe(false);
  });

  describe("establishment fetch", () => {
    it("fetches establishment on establishment creation (empty params)", () => {
      expectStoreToMatchInitialState();
      store.dispatch(establishmentSlice.actions.establishmentRequested({}));

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "success",
      });
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
        establishmentSlice.actions.establishmentRequested(testedQueryParams),
      );

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "success",
      });
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
        establishmentSlice.actions.establishmentRequested(testedQueryParams),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "success",
      });
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
        establishmentSlice.actions.establishmentRequested(testedQueryParams),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.formEstablishment$.error(
        new Error("some-error"),
      );

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "errored",
        errorMessage: "some-error",
      });
      expectToEqual(
        establishmentSelectors.formEstablishment(store.getState()),
        defaultFormEstablishmentValue(),
      );
    });

    it("should clear establishment", () => {
      const initialEstablishmentState: EstablishmentState = {
        isLoading: true,
        feedback: { kind: "success" },
        formEstablishment,
      };
      ({ store, dependencies } = createTestStore({
        establishment: initialEstablishmentState,
      }));
      expectEstablishmentStateToMatch(initialEstablishmentState);
      store.dispatch(establishmentSlice.actions.establishmentClearRequested());

      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "idle",
      });
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
        establishmentSlice.actions.establishmentCreationRequested(
          formEstablishment,
        ),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.addFormEstablishmentResult$.next(
        undefined,
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "submitSuccess",
      });
    });

    it("should fail when creating establishment on gateway error", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.establishmentCreationRequested(
          formEstablishment,
        ),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.addFormEstablishmentResult$.error(
        new Error("Submit error message not used in slice"),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "submitErrored",
      });
    });
  });

  describe("establishment edition", () => {
    it("should edit requested establishment", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.establishmentRequested({
          jwt: "previously-saved-jwt",
          siret: "12345678901234",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        feedback: { kind: "success" },
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
        establishmentSlice.actions.establishmentEditionRequested({
          formEstablishment: editedEstablishment,
          jwt: "previously-saved-jwt",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.editFormEstablishmentResult$.next(
        undefined,
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "submitSuccess",
      });
    });

    it("should fail when editing establishment on gateway error", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.establishmentRequested({
          jwt: "previously-saved-jwt",
          siret: "12345678901234",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        feedback: { kind: "success" },
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
        establishmentSlice.actions.establishmentEditionRequested({
          formEstablishment: editedEstablishment,
          jwt: "previously-saved-jwt",
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.editFormEstablishmentResult$.error(
        new Error("Submit error message not used in slice"),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "submitErrored",
      });
    });
  });

  describe("establishment deletion", () => {
    const backOfficeJwt: InclusionConnectJwt = "backoffice-jwt";

    it("should delete requested establishment", () => {
      expectStoreToMatchInitialState();

      store.dispatch(
        establishmentSlice.actions.establishmentRequested({
          jwt: backOfficeJwt,
          siret: "12345678901234",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        feedback: { kind: "success" },
        formEstablishment,
        isLoading: false,
      });

      store.dispatch(
        establishmentSlice.actions.establishmentDeletionRequested({
          siret: formEstablishment.siret,
          jwt: backOfficeJwt,
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.deleteEstablishmentResult$.next(
        undefined,
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "deleteSuccess",
      });
    });

    it("should fail when editing establishment on gateway error", () => {
      expectStoreToMatchInitialState();
      store.dispatch(
        establishmentSlice.actions.establishmentRequested({
          jwt: backOfficeJwt,
          siret: "12345678901234",
        }),
      );
      dependencies.establishmentGateway.formEstablishment$.next(
        formEstablishment,
      );
      expectEstablishmentStateToMatch({
        feedback: { kind: "success" },
        formEstablishment,
        isLoading: false,
      });
      store.dispatch(
        establishmentSlice.actions.establishmentDeletionRequested({
          siret: formEstablishment.siret,
          jwt: backOfficeJwt,
        }),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), true);
      dependencies.establishmentGateway.deleteEstablishmentResult$.error(
        new Error("Deletion error message not used in slice"),
      );
      expectToEqual(establishmentSelectors.isLoading(store.getState()), false);
      expectToEqual(establishmentSelectors.feedback(store.getState()), {
        kind: "deleteErrored",
      });
    });
  });

  const expectStoreToMatchInitialState = () =>
    expectEstablishmentStateToMatch({
      isLoading: false,
      feedback: { kind: "idle" },
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
