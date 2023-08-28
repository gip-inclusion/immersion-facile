import { expectToEqual, SearchResultDto } from "shared";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  initialState,
  searchSlice,
  SearchStatus,
} from "src/core-logic/domain/search/search.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

// prettier-ignore
const formSearchResult1 = { siret: "form1", rome: "A", voluntaryToImmersion: true} as SearchResultDto
// prettier-ignore
const formSearchResult2 = { siret: "form2", rome: "A", voluntaryToImmersion: true} as SearchResultDto
// prettier-ignore
const lbbSearchResult = { siret: "lbb1", rome: "A", voluntaryToImmersion: false } as SearchResultDto

const immersionOffer: SearchResultDto = {
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

describe("search epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("retrieves a list of search results", () => {
    it("with extra fetch if less than minimum results", () => {
      expectStatus("noSearchMade");
      expectSearchInfo("Veuillez sélectionner vos critères");

      store.dispatch(
        searchSlice.actions.searchRequested({
          distanceKm: 10,
          longitude: 0,
          latitude: 0,
          appellationCode: "11000",
          sortedBy: "distance",
          place: "23 rue lunaire, 44000 Nantes",
        }),
      );
      expectStatus("initialFetch");

      feedWithSearchResults([formSearchResult1]);
      expectSearchResults([formSearchResult1]);
      expectStatus("extraFetch");
      expectSearchInfo("Nous cherchons à compléter les résultats...");

      feedWithSearchResults([lbbSearchResult]);
      expectSearchResults([formSearchResult1, lbbSearchResult]);
      expectStatus("ok");
    });

    it("without extra fetch if enough results in initial fetch", () => {
      store.dispatch(
        searchSlice.actions.searchRequested({
          distanceKm: 10,
          longitude: 0,
          latitude: 0,
          appellationCode: "11000",
          sortedBy: "distance",
          place: "4 rue dessange, 44000 Nantes",
        }),
      );
      expectStatus("initialFetch");

      feedWithSearchResults([formSearchResult1, formSearchResult2]);
      expectStatus("ok");
      expectSearchResults([formSearchResult1, formSearchResult2]);
    });

    it("displays message when there are no results", () => {
      store.dispatch(
        searchSlice.actions.searchRequested({
          distanceKm: 10,
          longitude: 0,
          latitude: 0,
          appellationCode: "11000",
          sortedBy: "distance",
          place: "9 rue pruneaux, 44000 Nantes",
        }),
      );

      feedWithSearchResults([]);
      expectStatus("extraFetch");

      feedWithSearchResults([]);
      expectStatus("ok");
      expectSearchInfo(
        "Pas de résultat. Essayez avec un plus grand rayon de recherche...",
      );
    });
  });

  it("should retrieve the immersion offer and populate our store", () => {
    expectStateToMatchInitialState();

    store.dispatch(
      searchSlice.actions.fetchSearchResultRequested({
        appellationCode: immersionOffer.appellations[0].appellationCode,
        siret: immersionOffer.siret,
      }),
    );
    expect(searchSelectors.isLoading(store.getState())).toBe(true);

    dependencies.searchGateway.currentSearchResult$.next(immersionOffer);

    expect(searchSelectors.isLoading(store.getState())).toBe(false);

    expectToEqual(searchSelectors.feedback(store.getState()), {
      kind: "success",
    });
    expectToEqual(
      searchSelectors.currentSearchResult(store.getState()),
      immersionOffer,
    );
  });

  it("should throw if the gateway returns an error", () => {
    const errorMessage = "Error fetching immersion offer";
    expectStateToMatchInitialState();

    store.dispatch(
      searchSlice.actions.fetchSearchResultRequested({
        appellationCode: immersionOffer.appellations[0].appellationCode,
        siret: immersionOffer.siret,
      }),
    );
    expect(searchSelectors.isLoading(store.getState())).toBe(true);

    dependencies.searchGateway.currentSearchResult$.error(
      new Error(errorMessage),
    );

    expect(searchSelectors.isLoading(store.getState())).toBe(false);

    expectToEqual(searchSelectors.feedback(store.getState()), {
      kind: "errored",
      errorMessage,
    });
  });

  it("should clear the current search result", () => {
    expectStateToMatchInitialState();

    store.dispatch(
      searchSlice.actions.fetchSearchResultRequested({
        appellationCode: immersionOffer.appellations[0].appellationCode,
        siret: immersionOffer.siret,
      }),
    );
    expect(searchSelectors.isLoading(store.getState())).toBe(true);

    dependencies.searchGateway.currentSearchResult$.next(immersionOffer);

    expect(searchSelectors.isLoading(store.getState())).toBe(false);

    expectToEqual(searchSelectors.feedback(store.getState()), {
      kind: "success",
    });
    expectToEqual(
      searchSelectors.currentSearchResult(store.getState()),
      immersionOffer,
    );

    store.dispatch(searchSlice.actions.clearSearchResult());

    expectToEqual(searchSelectors.feedback(store.getState()), {
      kind: "idle",
    });
    expectToEqual(
      searchSelectors.currentSearchResult(store.getState()),
      initialState.currentSearchResult,
    );
  });

  const expectStateToMatchInitialState = () => {
    expectToEqual(store.getState().search, initialState);
  };

  const expectStatus = (status: SearchStatus) =>
    expectToEqual(searchSelectors.searchStatus(store.getState()), status);

  const expectSearchInfo = (searchInfo: string) => {
    expectToEqual(searchSelectors.searchInfo(store.getState()), searchInfo);
  };

  const expectSearchResults = (searchResults: SearchResultDto[]) =>
    expectToEqual(
      searchSelectors.searchResults(store.getState()),
      searchResults,
    );

  const feedWithSearchResults = (results: SearchResultDto[]) =>
    dependencies.searchGateway.searchResults$.next(results);
});
