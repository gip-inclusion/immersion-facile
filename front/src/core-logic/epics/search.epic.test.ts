import { Observable } from "rxjs";
import { InMemoryImmersionSearchGateway } from "src/core-logic/adapters/InMemoryImmersionSearchGateway";
import { createSearchEpic } from "src/core-logic/epics/search.epic";
import { SearchImmersionResultDto } from "src/shared/SearchImmersionDto";
import DoneCallback = jest.DoneCallback;

// those test should be fast, we don't want to wait 5s if they fail (
jest.setTimeout(300);

describe("Search immersions", () => {
  let immersionSearchGateway: InMemoryImmersionSearchGateway;
  let searchEpic: ReturnType<typeof createSearchEpic>;

  beforeEach(() => {
    immersionSearchGateway = new InMemoryImmersionSearchGateway({
      defaultResults: [],
      simulatedLatency: 0,
    });
    searchEpic = createSearchEpic({ immersionSearchGateway });
  });

  it("triggers the search and recovers some results", (done) => {
    const returnedFromApi: SearchImmersionResultDto[] = [
      {
        id: "search_result_id3",
        rome: "A0000",
        naf: "someName",
        siret: "12345678901234",
        name: "Hyper Corp",
        voluntaryToImmersion: false,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "IN_PERSON",
        romeLabel: "Hyper métier",
        nafLabel: "",
        city: "xxxx",
      },
    ];
    immersionSearchGateway.setNextSearchResult(returnedFromApi);

    expectObservableNextValuesToBe(
      searchEpic.views.searchResults$,
      [[], returnedFromApi],
      done,
    );

    searchEpic.actions.search({
      siret: "11112222333344",
      location: { lat: 0, lon: 0 },
      distance_km: 1,
    });
  });

  it("shows a loading state while fetching the data", (done) => {
    expectObservableNextValuesToBe(
      searchEpic.views.isSearching$,
      [false, true, false],
      done,
    );

    searchEpic.actions.search({
      siret: "11112222333344",
      location: { lat: 0, lon: 0 },
      distance_km: 1,
    });
  });

  it("when an error occurs, no result is return, and the error is logged", (done) => {
    immersionSearchGateway.setError(new Error("Oups, something went wrong !"));
    expectObservableNextValuesToBe(
      searchEpic.views.searchResults$,
      [[], []],
      done,
    );

    searchEpic.actions.search({
      siret: "11112222333344",
      location: { lat: 0, lon: 0 },
      distance_km: 1,
    });
  });

  it("when nothing happened, it should invite to give fill the form", (done) => {
    expectObservableNextValuesToBe(
      searchEpic.views.searchInfo$,
      ["Veuillez sélectionner vos critères"],
      done,
    );
  });

  it("when triggering a search and no results, it should inform the user", (done) => {
    expectObservableNextValuesToBe(
      searchEpic.views.searchInfo$,
      [
        "Veuillez sélectionner vos critères",
        "Pas de résultat. Essayez avec un plus grand rayon de recherche...",
      ],
      done,
    );

    searchEpic.actions.search({
      siret: "11112222333344",
      location: { lat: 0, lon: 0 },
      distance_km: 1,
    });
  });
});

const expectObservableNextValuesToBe = <T>(
  obs$: Observable<T>,
  values: T[],
  done: DoneCallback,
) => {
  obs$.subscribe({
    next: (v) => {
      const expectedValue = values.shift();
      expect(v).toEqual(expectedValue);
      if (values.length === 0) done();
    },
    error: (err) => {
      console.error(err);
      done.fail(err);
    },
  });
};
