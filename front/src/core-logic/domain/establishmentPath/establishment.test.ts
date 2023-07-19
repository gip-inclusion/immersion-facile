import {
  expectObjectsToMatch,
  expectToEqual,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  LegacyHttpClientError,
  makeBooleanFeatureFlag,
  SiretEstablishmentDto,
} from "shared";
import { FormEstablishmentParamsInUrl } from "src/app/routes/routeParams/formEstablishment";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { makeStubFeatureFlags } from "src/core-logic/domain/testHelpers/test.helpers";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  defaultFormEstablishmentValue,
  EstablishmentRequestedPayload,
  establishmentSlice,
  EstablishmentState,
} from "./establishment.slice";

const establishmentFromSiretFetched: SiretEstablishmentDto = {
  siret: "11110000111100",
  businessName: "Existing open business on Sirene Corp.",
  businessAddress: "",
  isOpen: true,
  numberEmployeesRange: "",
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

  it("triggers navigation when siret is requested if status is 'READY_FOR_LINK_REQUEST_OR_REDIRECTION'", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        isLoading: false,
        feedback: { kind: "readyForLinkRequestOrRedirection" },
        formEstablishment: defaultFormEstablishmentValue(),
      },
    }));
    store.dispatch(siretSlice.actions.siretModified("10002000300040"));
    dependencies.siretGatewayThroughBack.siretInfo$.next(
      establishmentFromSiretFetched,
    );
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered({
      siret: establishmentFromSiretFetched.siret,
      bName: establishmentFromSiretFetched.businessName,
      bAddress: establishmentFromSiretFetched.businessAddress,
    });
  });

  it("triggers navigation when siret is requested if status is 'READY_FOR_LINK_REQUEST_OR_REDIRECTION', even if insee feature flag is OFF", () => {
    ({ store, dependencies } = createTestStore({
      establishment: {
        isLoading: false,
        feedback: { kind: "readyForLinkRequestOrRedirection" },
        formEstablishment: defaultFormEstablishmentValue(),
      },
      featureFlags: {
        ...makeStubFeatureFlags({
          enableInseeApi: {
            ...makeBooleanFeatureFlag(false),
          },
        }),
        isLoading: false,
      },
    }));
    store.dispatch(siretSlice.actions.siretModified("10002000300040"));
    dependencies.siretGatewayThroughBack.isSiretInDb$.next(false);
    expectNavigationToEstablishmentFormPageToHaveBeenTriggered({
      siret: "10002000300040",
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
    const errorMessage = "Error sending modification link";
    expectEstablishmentStateToMatch({
      isLoading: false,
      feedback: { kind: "idle" },
    });
    store.dispatch(
      establishmentSlice.actions.sendModificationLinkRequested("siret-123"),
    );
    expect(establishmentSelectors.isLoading(store.getState())).toBe(true);
    dependencies.establishmentGateway.establishmentModificationResponse$.error(
      new LegacyHttpClientError(errorMessage, new Error(), 400, {
        errors: errorMessage,
      }),
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
      const testedQueryParams: EstablishmentRequestedPayload = {
        siret: "12345678901234",
        fitForDisabledWorkers: true,
      };
      const expectedFormEstablishment: FormEstablishmentDto = {
        ...defaultFormEstablishmentValue(),
        siret: testedQueryParams.siret!,
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
        businessAddress: "26 rue des castors, 75002 Paris",
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
        businessAddress: "26 rue des castors, 75002 Paris",
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
