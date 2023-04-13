import { expectToEqual, SearchImmersionResultDto } from "shared";

import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import {
  searchSlice,
  SearchStatus,
} from "src/core-logic/domain/search/search.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

// prettier-ignore
const formSearchResult1 = { siret: "form1", rome: "A", voluntaryToImmersion: true} as SearchImmersionResultDto
// prettier-ignore
const formSearchResult2 = { siret: "form2", rome: "A", voluntaryToImmersion: true} as SearchImmersionResultDto
// prettier-ignore
const lbbSearchResult = { siret: "lbb1", rome: "A", voluntaryToImmersion: false } as SearchImmersionResultDto

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
          distance_km: 10,
          longitude: 0,
          latitude: 0,
          rome: "A1000",
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
          distance_km: 10,
          longitude: 0,
          latitude: 0,
          rome: "A1000",
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
          distance_km: 10,
          longitude: 0,
          latitude: 0,
          rome: "A1000",
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

  const expectStatus = (status: SearchStatus) =>
    expectToEqual(searchSelectors.searchStatus(store.getState()), status);

  const expectSearchInfo = (searchInfo: string) => {
    expectToEqual(searchSelectors.searchInfo(store.getState()), searchInfo);
  };

  const expectSearchResults = (searchResults: SearchImmersionResultDto[]) =>
    expectToEqual(
      searchSelectors.searchResults(store.getState()),
      searchResults,
    );

  const feedWithSearchResults = (results: SearchImmersionResultDto[]) =>
    dependencies.immersionSearchGateway.searchResults$.next(results);
});
