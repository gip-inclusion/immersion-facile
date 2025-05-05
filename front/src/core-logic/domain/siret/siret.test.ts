import {
  type GetSiretInfo,
  type SiretEstablishmentDto,
  tooManiSirenRequestsSiretErrorMessage,
} from "shared";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import {
  type SiretState,
  siretSlice,
} from "src/core-logic/domain/siret/siret.slice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("Siret validation and fetching", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("Siret validation", () => {
    it("updates current siret", () => {
      dispatchSiretModified("1111");
      expectCurrentSiretToBe("1111");
      expectIsSearchingToBe(false);
    });

    it("does not trigger search if some characters are not digit", () => {
      dispatchSiretModified("1111000011110A");
      expectIsSearchingToBe(false);
    });

    it("reflects error when siret contains letters", () => {
      dispatchSiretModified("111AAAA");
      expectSiretErrorToBe("Le SIRET doit être composé de 14 chiffres");
      expectIsSearchingToBe(false);
    });

    it("reflects error when siret is not the correct length", () => {
      dispatchSiretModified("11110000");
      expectIsSearchingToBe(false);
      expectSiretErrorToBe("Le SIRET doit être composé de 14 chiffres");
    });

    it("triggers search when siret reaches 14 digit", () => {
      dispatchSiretModified("11110000111100");
      expectIsSearchingToBe(true);
    });

    it("triggers search when siret reaches 14 digits, even if there are white spaces", () => {
      dispatchSiretModified("1  111 0003 1111 00  ");
      expectIsSearchingToBe(true);
    });

    it("when the current siret is modified the establishments and api errors are dropped", () => {
      setStoreWithInitialSiretState({
        establishment: {
          siret: "11110000111100",
        } as SiretEstablishmentDto,
        error: "Missing establishment on SIRENE API.",
      });

      dispatchSiretModified("111100001111");
      expectEstablishmentToEqual(null);
      expectSiretErrorToBe("Le SIRET doit être composé de 14 chiffres");
    });
  });

  const establishmentFetched: SiretEstablishmentDto = {
    siret: "11110000111100",
    businessName: "Existing open business on Sirene Corp.",
    businessAddress: "2 avenue Karl Marx, 75018 Paris",
    isOpen: true,
    numberEmployeesRange: "",
  };

  describe("Siret fetching when a 14 digit siret is provided", () => {
    it("fetches correctly and keeps the returned establishment", () => {
      setStoreWithInitialSiretState({
        shouldFetchEvenIfAlreadySaved: false,
      });
      dispatchSiretModified("11110000111100");
      feedSirenGatewayThroughBackWith(establishmentFetched);
      expectEstablishmentToEqual(establishmentFetched);
      expectOnly_getSirenInfoIfNotAlreadySaved_toHaveBeenCalled();
      expectCurrentSiretToBe("11110000111100");
    });

    it("fetches correctly and keeps the returned error", () => {
      dispatchSiretModified("11110000111100");
      feedSirenGatewayThroughBackWith(tooManiSirenRequestsSiretErrorMessage);
      expectSiretErrorToBe(
        "Le service de vérification du SIRET a reçu trop d'appels.",
      );
    });

    it("fetches correctly and keeps the handles unexpected error", () => {
      dispatchSiretModified("11110000111100");
      feedSirenGatewayThroughBackWithError(new Error("Oups ! Failed"));
      expectSiretErrorToBe("Oups ! Failed");
    });

    it("when 'withAlreadySavedCheck' is false, fetches correctly but calls the relevant route", () => {
      dispatchSiretModified("11110000111100");
      feedSirenGatewayThroughBackWith(establishmentFetched);
      expectEstablishmentToEqual(establishmentFetched);
      expectOnly_getSirenInfoObservable_toHaveBeenCalled();
    });
  });

  describe("When toggling 'shouldFetchEvenIfAlreadySaved'", () => {
    it("clears error and establishment, and calls siretModified with new toggle mode", () => {
      setStoreWithInitialSiretState({
        currentSiret: "10002000300040",
        error: "Establishment with this siret is already in our DB",
        establishment: { siret: "yolo" } as SiretEstablishmentDto,
      });
      expectShouldFetchEvenIfAlreadySavedToBe(true);
      store.dispatch(
        siretSlice.actions.setShouldFetchEvenIfAlreadySaved({
          shouldFetchEvenIfAlreadySaved: false,
          addressAutocompleteLocator: "convention-immersion-address",
        }),
      );
      expectShouldFetchEvenIfAlreadySavedToBe(false);
      expectSiretErrorToBe(null);
      expectEstablishmentToEqual(null);
      expectCurrentSiretToBe("10002000300040");
      store.dispatch(
        siretSlice.actions.setShouldFetchEvenIfAlreadySaved({
          shouldFetchEvenIfAlreadySaved: true,
          addressAutocompleteLocator: "convention-immersion-address",
        }),
      );
      expectShouldFetchEvenIfAlreadySavedToBe(true);
      expectIsSearchingToBe(true);
    });
  });

  describe("Clearing siret info", () => {
    it("clears siret info", () => {
      setStoreWithInitialSiretState({
        currentSiret: "10002000300040",
        error: "Establishment with this siret is already in our DB",
        establishment: { siret: "yolo" } as SiretEstablishmentDto,
      });
      store.dispatch(siretSlice.actions.siretInfoClearRequested());
      expectCurrentSiretToBe("");
      expectEstablishmentToEqual(null);
      expectSiretErrorToBe(null);
      expectIsSearchingToBe(false);
    });
  });

  const dispatchSiretModified = (siret: string) =>
    store.dispatch(
      siretSlice.actions.siretModified({
        siret,
        feedbackTopic: "siret-input",
        addressAutocompleteLocator: "convention-immersion-address",
      }),
    );

  const expectShouldFetchEvenIfAlreadySavedToBe = (expected: boolean) => {
    expect(siretSelectors.shouldFetchEvenIfAlreadySaved(store.getState())).toBe(
      expected,
    );
  };

  const expectCurrentSiretToBe = (expected: string) => {
    expect(siretSelectors.currentSiret(store.getState())).toBe(expected);
  };

  const expectIsSearchingToBe = (expected: boolean) => {
    expect(siretSelectors.isFetching(store.getState())).toBe(expected);
  };

  const expectEstablishmentToEqual = (
    expected: SiretEstablishmentDto | null,
  ) => {
    expect(siretSelectors.establishmentInfos(store.getState())).toBe(expected);
  };

  const expectSiretErrorToBe = (expected: string | null) => {
    expect(siretSelectors.siretErrorToDisplay(store.getState())).toBe(expected);
  };

  const feedSirenGatewayThroughBackWith = (response: GetSiretInfo) => {
    dependencies.formCompletionGateway.siretInfo$.next(response);
  };

  const feedSirenGatewayThroughBackWithError = (error: Error) => {
    dependencies.formCompletionGateway.siretInfo$.error(error);
  };

  const expectOnly_getSirenInfoIfNotAlreadySaved_toHaveBeenCalled = () => {
    expect(
      dependencies.formCompletionGateway.getSiretInfoIfNotAlreadySavedCallCount,
    ).toBe(1);
    expect(dependencies.formCompletionGateway.getSiretInfoCallCount).toBe(0);
  };

  const expectOnly_getSirenInfoObservable_toHaveBeenCalled = () => {
    expect(dependencies.formCompletionGateway.getSiretInfoCallCount).toBe(1);
    expect(
      dependencies.formCompletionGateway.getSiretInfoIfNotAlreadySavedCallCount,
    ).toBe(0);
  };

  const setStoreWithInitialSiretState = (siretState: Partial<SiretState>) => {
    ({ store, dependencies } = createTestStore({
      siret: {
        ...siretSlice.getInitialState(),
        ...siretState,
      },
    }));
  };
});
