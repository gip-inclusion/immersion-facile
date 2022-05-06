import { Store } from "@reduxjs/toolkit";
import { GetSiretResponseDto } from "shared/src/siret";
import {
  siretErrorSelector,
  siretStateSelector,
} from "src/core-logic/domain/siret/siret.selectors";
import {
  siretSlice,
  SiretState,
} from "src/core-logic/domain/siret/siret.slice";
import {
  GetSiretInfo,
  tooManiSirenRequestsSiretErrorMessage,
} from "src/core-logic/ports/SiretGatewayThroughBack";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { RootState } from "src/core-logic/storeConfig/store";

describe("Siret validation and fetching", () => {
  let store: Store<RootState>;
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
        establishment: { siret: "11110000111100" } as GetSiretResponseDto,
        error: "Missing establishment on SIRENE API.",
      });

      dispatchSiretModified("111100001111");
      expectEstablishmentToEqual(null);
      expectSiretErrorToBe("Le SIRET doit être composé de 14 chiffres");
    });
  });

  describe("Siret fetching when a 14 digit siret is provided", () => {
    it("fetches correctly and keeps the returned establishment", () => {
      dispatchSiretModified("11110000111100");
      const establishmentFetched = {
        siret: "11110000111100",
        businessName: "Existing open business on Sirene Corp.",
        businessAddress: "",
        isOpen: true,
      };
      feedSirenGatewayThroughBackWith(establishmentFetched);
      expectEstablishmentToEqual(establishmentFetched);
      expectOnly_getSirenInfoIfNotAlreadySaved_toHaveBeenCalled();
    });

    it("fetches correctly and keeps the returned error", () => {
      dispatchSiretModified("11110000111100");
      feedSirenGatewayThroughBackWith(tooManiSirenRequestsSiretErrorMessage);
      expectSiretErrorToBe(
        "Le service de vérification du SIRET a reçu trop d'appels.",
      );
    });

    it("does not fetch if the featureFlag to fetch siret is off", () => {
      ({ store, dependencies } = createTestStore(
        {
          featureFlags: {
            featureFlags: {
              enableInseeApi: false,
              enableAdminUi: true,
              enablePeConnectApi: false,
            },
          },
        },
        "skip",
      ));
      dispatchSiretModified("11110000111100");
      expectIsSearchingToBe(false);
    });

    it("when 'withAlreadySavedCheck' is false, fetches correctly but calls the relevant route", () => {
      setStoreWithInitialSiretState({
        shouldFetchEvenIfAlreadySaved: true,
      });

      dispatchSiretModified("11110000111100");
      const establishmentFetched = {
        siret: "11110000111100",
        businessName: "Existing open business on Sirene Corp.",
        businessAddress: "",
        isOpen: true,
      };
      feedSirenGatewayThroughBackWith(establishmentFetched);
      expectEstablishmentToEqual(establishmentFetched);
      expectOnly_getSirenInfoObservable_toHaveBeenCalled();
    });
  });

  it("toggles shouldFetchEvenIfAlreadySaved and clears establishment and errors", () => {
    store.dispatch(siretSlice.actions.toggleShouldFetchEvenIfAlreadySaved());
    expectSiretErrorToBe(null);
    store.dispatch(siretSlice.actions.toggleShouldFetchEvenIfAlreadySaved());
    expectShouldFetchEvenIfAlreadySavedToBe(false);
  });

  const dispatchSiretModified = (siret: string) =>
    store.dispatch(siretSlice.actions.siretModified(siret));

  const expectShouldFetchEvenIfAlreadySavedToBe = (expected: boolean) => {
    expect(
      siretStateSelector(store.getState()).shouldFetchEvenIfAlreadySaved,
    ).toBe(expected);
  };

  const expectCurrentSiretToBe = (expected: string) => {
    expect(siretStateSelector(store.getState()).currentSiret).toBe(expected);
  };

  const expectIsSearchingToBe = (expected: boolean) => {
    expect(siretStateSelector(store.getState()).isSearching).toBe(expected);
  };

  const expectEstablishmentToEqual = (expected: GetSiretResponseDto | null) => {
    expect(siretStateSelector(store.getState()).establishment).toBe(expected);
  };

  const expectSiretErrorToBe = (expected: string | null) => {
    expect(siretErrorSelector(store.getState())).toBe(expected);
  };

  const feedSirenGatewayThroughBackWith = (response: GetSiretInfo) => {
    dependencies.siretGatewayThroughBack.siretInfo$.next(response);
  };

  const expectOnly_getSirenInfoIfNotAlreadySaved_toHaveBeenCalled = () => {
    expect(
      dependencies.siretGatewayThroughBack
        .getSiretInfoIfNotAlreadySavedCallCount,
    ).toBe(1);
    expect(
      dependencies.siretGatewayThroughBack.getSiretInfoObservableCallCount,
    ).toBe(0);
  };

  const expectOnly_getSirenInfoObservable_toHaveBeenCalled = () => {
    expect(
      dependencies.siretGatewayThroughBack.getSiretInfoObservableCallCount,
    ).toBe(1);
    expect(
      dependencies.siretGatewayThroughBack
        .getSiretInfoIfNotAlreadySavedCallCount,
    ).toBe(0);
  };

  const setStoreWithInitialSiretState = (siretState: Partial<SiretState>) => {
    ({ store, dependencies } = createTestStore(
      {
        siret: {
          ...siretSlice.getInitialState(),
          ...siretState,
        },
      },
      "skip",
    ));
  };
});
