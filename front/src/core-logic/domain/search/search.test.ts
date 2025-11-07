import {
  type DataWithPagination,
  expectToEqual,
  type LocationId,
  type SearchResultDto,
} from "shared";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  initialState,
  type SearchStatus,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

const formSearchResult1 = {
  siret: "form1",
  rome: "A",
  voluntaryToImmersion: true,
} as SearchResultDto;

const formSearchResult2 = {
  siret: "form2",
  rome: "A",
  voluntaryToImmersion: true,
} as SearchResultDto;

const lbbSearchResult = {
  siret: "lbb1",
  rome: "A",
  voluntaryToImmersion: false,
} as SearchResultDto;

const locationId: LocationId = "123";

const immersionOffer: SearchResultDto = {
  rome: "A1201",
  romeLabel: "Aide agricole de production fruitière ou viticole",
  establishmentScore: 0,
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
  fitForDisabledWorkers: "yes-ft-certified",
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
  locationId,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe("search epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("retrieves a list of search results", () => {
    it("gets the results from the API", () => {
      expectIsLoading(false);
      store.dispatch(
        searchSlice.actions.getOffersRequested({
          distanceKm: 10,
          longitude: 0,
          latitude: 0,
          appellationCodes: ["11000"],
          place: "4 rue dessange, 44000 Nantes",
          fitForDisabledWorkers: undefined,
          sortBy: "distance",
          sortOrder: "desc",
        }),
      );
      expectStatus("initialFetch");
      expectIsLoading(true);

      feedWithSearchResults([formSearchResult1, formSearchResult2]);
      expectStatus("ok");
      expectIsLoading(false);
      expectSearchResults({
        data: [formSearchResult1, formSearchResult2],
        pagination: {
          totalRecords: 2,
          currentPage: 1,
          totalPages: 1,
          numberPerPage: 12,
        },
      });
    });

    it("gets the results from the API for external search", () => {
      expectIsLoading(false);
      store.dispatch(
        searchSlice.actions.getOffersRequested({
          distanceKm: 10,
          longitude: 0,
          latitude: 0,
          isExternal: true,
          sortBy: "score",
          sortOrder: "asc",
        }),
      );
      expectStatus("initialFetch");
      expectIsLoading(true);

      feedWithExternalSearchResults([formSearchResult1, formSearchResult2]);
      expectStatus("ok");
      expectIsLoading(false);
      expectSearchResults({
        data: [formSearchResult1, formSearchResult2],
        pagination: {
          totalRecords: 2,
          currentPage: 1,
          totalPages: 1,
          numberPerPage: 50,
        },
      });
    });

    it("displays message when there are no results", () => {
      expectIsLoading(false);
      store.dispatch(
        searchSlice.actions.getOffersRequested({
          distanceKm: 10,
          longitude: 0,
          latitude: 0,
          appellationCodes: ["11000"],
          place: "9 rue pruneaux, 44000 Nantes",
          fitForDisabledWorkers: undefined,
          sortBy: "distance",
          sortOrder: "desc",
        }),
      );

      feedWithSearchResults([]);
      expectStatus("ok");
      expectIsLoading(false);
      expectSearchInfo(
        "Pas de résultat. Essayez avec un plus grand rayon de recherche...",
      );
    });
  });

  it("should retrieve the immersion offer and populate our store", () => {
    expectStateToMatchInitialState();

    store.dispatch(
      searchSlice.actions.fetchSearchResultRequested({
        searchResult: {
          appellationCode: immersionOffer.appellations[0].appellationCode,
          siret: immersionOffer.siret,
          locationId: locationId,
        },
        feedbackTopic: "search-result",
      }),
    );
    expect(searchSelectors.isLoading(store.getState())).toBe(true);

    dependencies.searchGateway.currentSearchResult$.next(immersionOffer);

    expect(searchSelectors.isLoading(store.getState())).toBe(false);

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
        searchResult: {
          appellationCode: immersionOffer.appellations[0].appellationCode,
          siret: immersionOffer.siret,
          locationId: locationId,
        },
        feedbackTopic: "search-result",
      }),
    );
    expect(searchSelectors.isLoading(store.getState())).toBe(true);

    dependencies.searchGateway.currentSearchResult$.error(
      new Error(errorMessage),
    );

    expect(searchSelectors.isLoading(store.getState())).toBe(false);

    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "search-result": {
        on: "fetch",
        level: "error",
        title: "Oups !",
        message: errorMessage,
      },
    });
  });

  it("should reset search status when clicking on an offer", () => {
    expectStatus("noSearchMade");
    store.dispatch(
      searchSlice.actions.getOffersRequested({
        distanceKm: 10,
        latitude: immersionOffer.position.lat,
        longitude: immersionOffer.position.lon,
        fitForDisabledWorkers: undefined,
        sortBy: "distance",
        sortOrder: "desc",
      }),
    );
    feedWithSearchResults([]);
    feedWithSearchResults([]);
    expectStatus("ok");
  });

  describe("get a single search result", () => {
    it("should retrieve a search result and populate our store", () => {
      expectStateToMatchInitialState();
      store.dispatch(
        searchSlice.actions.externalSearchResultRequested({
          siretAndAppellation: {
            appellationCode: "11000",
            siret: lbbSearchResult.siret,
          },
          feedbackTopic: "search-result",
        }),
      );
      expectIsLoading(true);
      dependencies.searchGateway.currentSearchResult$.next(lbbSearchResult);
      expectToEqual(
        searchSelectors.currentSearchResult(store.getState()),
        lbbSearchResult,
      );
      expectIsLoading(false);
    });
    it("should throw if the gateway returns an error", () => {
      expectStateToMatchInitialState();
      store.dispatch(
        searchSlice.actions.externalSearchResultRequested({
          siretAndAppellation: {
            appellationCode: "11000",
            siret: lbbSearchResult.siret,
          },
          feedbackTopic: "search-result",
        }),
      );
      expectIsLoading(true);
      dependencies.searchGateway.currentSearchResult$.error(new Error("error"));
      expectIsLoading(false);
    });
  });

  const expectStateToMatchInitialState = () => {
    expectToEqual(store.getState().search, initialState);
  };

  const expectStatus = (status: SearchStatus) =>
    expectToEqual(searchSelectors.searchStatus(store.getState()), status);

  const expectSearchInfo = (searchInfo: string) => {
    expectToEqual(searchSelectors.searchInfo(store.getState()), searchInfo);
  };

  const expectSearchResults = (
    searchResults: DataWithPagination<SearchResultDto>,
  ) =>
    expectToEqual(
      searchSelectors.searchResultsWithPagination(store.getState()),
      searchResults,
    );

  const expectIsLoading = (isLoading: boolean) =>
    expect(searchSelectors.isLoading(store.getState())).toBe(isLoading);

  const feedWithSearchResults = (results: SearchResultDto[]) =>
    dependencies.searchGateway.searchResults$.next({
      data: results,
      pagination: {
        totalRecords: results.length,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 12,
      },
    });
  const feedWithExternalSearchResults = (results: SearchResultDto[]) =>
    dependencies.searchGateway.externalSearchResults$.next({
      data: results,
      pagination: {
        totalRecords: results.length,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 50,
      },
    });
});
