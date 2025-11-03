import { delay, type Observable, of } from "rxjs";
import {
  type CreateDiscussionDto,
  type DataWithPagination,
  type GetOffersFlatQueryParams,
  type GroupSlug,
  type GroupWithResults,
  type SearchResultDto,
  type SiretAndAppellationDto,
  sleep,
} from "shared";
import type { SearchGateway } from "src/core-logic/ports/SearchGateway";
import { groupWithResultsStub, seedSearchResults } from "./simulatedSearchData";

export class SimulatedSearchGateway implements SearchGateway {
  #error: Error | null = null;

  #simulatedLatency: number;

  #seedResultsWithPagination: DataWithPagination<SearchResultDto>;

  #simulatedResponse: SearchResultDto = {
    rome: "A1201",
    romeLabel: "Aide agricole de production fruitière ou viticole",
    establishmentScore: 0,
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
    locationId: "123",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  constructor(
    seedResults: SearchResultDto[] = seedSearchResults,
    simulatedLatency = 0,
  ) {
    this.#simulatedLatency = simulatedLatency;
    this.#seedResultsWithPagination = {
      data: seedResults,
      pagination: {
        totalRecords: seedResults.length,
        numberPerPage: 48,
        currentPage: 1,
        totalPages: 1,
      },
    };
  }

  public async contactEstablishment(
    _params: CreateDiscussionDto,
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

  public getOffers$(
    _params: GetOffersFlatQueryParams,
  ): Observable<DataWithPagination<SearchResultDto>> {
    if (this.#error) throw this.#error;
    return this.#simulateSearch();
  }

  public getExternalSearchResult$(
    _params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return of(this.#simulatedResponse).pipe(delay(this.#simulatedLatency));
  }

  #simulateSearch() {
    return of(this.#seedResultsWithPagination).pipe(
      delay(this.#simulatedLatency),
    );
  }
}
