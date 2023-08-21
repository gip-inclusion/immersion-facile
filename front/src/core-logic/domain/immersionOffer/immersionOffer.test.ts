import { expectToEqual, SearchImmersionResultDto } from "shared";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { immersionOfferSelectors } from "./immersionOffer.selectors";
import { immersionOfferSlice, initialState } from "./immersionOffer.slice";

describe("ImmersionOffer epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should retrieve the immersion offer and populate our store", () => {
    expectStateToMatchInitialState();
    const immersionOffer: SearchImmersionResultDto = {
      rome: "A1201",
      romeLabel: "Aide agricole de production fruitière ou viticole",
      appellations: [
        {
          appellationCode: "A1201",
          appellationLabel: "Aide agricole de production fruitière ou viticole",
        },
      ],
      naf: "01.11Z",
      nafLabel:
        "Culture de céréales (à l'exception du riz), de légumineuses et de graines oléagineuses",
      siret: "12345678901234",
      name: "EARL DE LA FERME",
      voluntaryToImmersion: true,
      fitForDisabledWorkers: true,
      position: {
        lat: 48.8566969,
        lon: 2.3514616,
      },
      address: {
        streetNumberAndAddress: "1 rue de la ferme",
        city: "Paris",
        departmentCode: "75",
        postcode: "75001",
      },
      contactMode: "EMAIL",
      distance_m: 1000,
      numberOfEmployeeRange: "1-5",
      website: "https://www.earl-de-la-ferme.fr",
      additionalInformation: "Ferme bio",
      urlOfPartner: "https://www.emploi-store.fr/portail/accueil",
    };

    store.dispatch(
      immersionOfferSlice.actions.fetchImmersionOfferRequested({
        appellationCode: "11111",
        siret: "01234567890123",
      }),
    );
    expect(immersionOfferSelectors.isLoading(store.getState())).toBe(true);

    dependencies.immersionOfferGateway.currentImmersionOffer$.next(
      immersionOffer,
    );

    expect(immersionOfferSelectors.isLoading(store.getState())).toBe(false);

    expectToEqual(immersionOfferSelectors.feedback(store.getState()), {
      kind: "success",
    });
    expectToEqual(
      immersionOfferSelectors.currentImmersionOffer(store.getState()),
      immersionOffer,
    );
  });

  it("should throw if the gateway returns an error", () => {
    const errorMessage = "Error fetching immersion offer";
    expectStateToMatchInitialState();

    store.dispatch(
      immersionOfferSlice.actions.fetchImmersionOfferRequested({
        appellationCode: "11111",
        siret: "01234567890123",
      }),
    );
    expect(immersionOfferSelectors.isLoading(store.getState())).toBe(true);

    dependencies.immersionOfferGateway.currentImmersionOffer$.error(
      new Error(errorMessage),
    );

    expect(immersionOfferSelectors.isLoading(store.getState())).toBe(false);

    expectToEqual(immersionOfferSelectors.feedback(store.getState()), {
      kind: "errored",
      errorMessage,
    });
  });

  const expectStateToMatchInitialState = () => {
    expectToEqual(store.getState().immersionOffer, initialState);
  };
});
