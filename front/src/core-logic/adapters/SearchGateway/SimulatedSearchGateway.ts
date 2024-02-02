import { filter as ramdaFilter } from "ramda";
import { Observable, delay, map, of } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  GroupSlug,
  GroupWithResults,
  SearchQueryParamsDto,
  SearchResultDto,
  SiretAndAppellationDto,
  sleep,
} from "shared";
import { SearchGateway } from "src/core-logic/ports/SearchGateway";
import { groupWithResultsStub, seedSearchResults } from "./simulatedSearchData";

export class SimulatedSearchGateway implements SearchGateway {
  #error: Error | null = null;

  #simulatedLatency: number;

  #seedResults?: SearchResultDto[];

  #simulatedResponse: SearchResultDto = {
    rome: "A1201",
    romeLabel: "Aide agricole de production fruitière ou viticole",
    appellations: [
      {
        appellationCode: "20552",
        appellationLabel: "Aide agricole de production fruitière ou viticole",
      },
      {
        appellationCode: "15480",
        appellationLabel: "Ouvrier agricole polyvalent",
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

  constructor(seedResults?: SearchResultDto[], simulatedLatency = 0) {
    this.#simulatedLatency = simulatedLatency;
    this.#seedResults = seedResults;
  }

  public async contactEstablishment(
    _params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await sleep(this.#simulatedLatency);
    if (this.#error) throw this.#error;
    return;
  }

  public async getGroupBySlug(
    _groupName: GroupSlug,
  ): Promise<GroupWithResults> {
    this.#simulatedLatency && (await sleep(this.#simulatedLatency));
    return groupWithResultsStub;
  }

  public getSearchResult$(
    _params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return of(this.#simulatedResponse).pipe(delay(this.#simulatedLatency));
  }

  public search$(
    searchParams: SearchQueryParamsDto,
  ): Observable<SearchResultDto[]> {
    if (this.#error) throw this.#error;
    return this.#simulateSearch(searchParams);
  }

  #simulateSearch(searchParams: SearchQueryParamsDto) {
    const results$ = of(this.#seedResults ?? seedSearchResults);
    if (searchParams.voluntaryToImmersion === undefined) return results$;
    return results$.pipe(
      delay(this.#simulatedLatency),
      map(
        ramdaFilter<SearchResultDto>(
          (result) =>
            result.voluntaryToImmersion === searchParams.voluntaryToImmersion,
        ),
      ),
    );
  }
}
