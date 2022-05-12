import { filter as ramdaFilter } from "ramda";
import { BehaviorSubject, delay, map, Observable, Subject } from "rxjs";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ContactEstablishmentRequestDto } from "shared/src/contactEstablishment";
import { SearchImmersionRequestDto } from "shared/src/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { sleep } from "shared/src/utils";

export class InMemoryImmersionSearchGateway implements ImmersionSearchGateway {
  private readonly _results$: Subject<SearchImmersionResultDto[]>;
  private _error: Error | null = null;

  constructor(
    private readonly seedResults?: SearchImmersionResultDto[],
    private readonly simulatedLatency = 0,
  ) {
    this._results$ = seedResults
      ? new BehaviorSubject(seedResults)
      : new Subject<SearchImmersionResultDto[]>();
  }

  public search(
    searchParams: SearchImmersionRequestDto,
  ): Observable<SearchImmersionResultDto[]> {
    if (this._error) throw this._error;
    if (this.seedResults) return this.simulateSearch(searchParams);

    return this.simulatedLatency
      ? this._results$.pipe(delay(this.simulatedLatency))
      : this._results$;
  }

  public async contactEstablishment(
    _params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await sleep(this.simulatedLatency);
    if (this._error) throw this._error;
    return;
  }

  private simulateSearch(searchParams: SearchImmersionRequestDto) {
    if (searchParams.voluntary_to_immersion === undefined)
      return this._results$;
    return this._results$.pipe(
      delay(this.simulatedLatency),
      map(
        ramdaFilter<SearchImmersionResultDto>(
          (result) =>
            result.voluntaryToImmersion === searchParams.voluntary_to_immersion,
        ),
      ),
    );
  }

  // test purpose
  get searchResults$() {
    return this._results$;
  }

  setError(error: Error) {
    this._error = error;
  }
}

const defaultNaf = "MyNaf";

export const seedSearchResults: SearchImmersionResultDto[] = [
  {
    rome: "A0000",
    naf: defaultNaf,
    siret: "12345678901234",
    name: "Super Corp",
    voluntaryToImmersion: true,
    location: { lat: 48.8666, lon: 2.3333 },
    address: "55 rue du Faubourg Saint-Honoré, 75017 Paris",
    contactMode: "EMAIL",
    romeLabel: "Super métier",
    appellationLabels: ["Facteur", "Développeuse"],
    nafLabel: "Métallurgie",
    city: "xxxx",
  },
  {
    rome: "A0001",
    naf: defaultNaf,
    siret: "12345678901234",
    name: "Mega Corp",
    customizedName: "Mega Corp nom personnalisé",
    voluntaryToImmersion: false,
    location: { lat: 48.8666, lon: 2.3333 },
    address: "55 rue du Faubourg Saint-Honoré",
    contactMode: "PHONE",
    romeLabel:
      "Méga métier, avec un texte très long pour le décrire, et qui va peut-être aller à la ligne",
    appellationLabels: [],
    nafLabel: "Accueil et Restauration",
    city: "xxxx",
    numberOfEmployeeRange: "11-49",
  },
  {
    rome: "A0002",
    naf: defaultNaf,
    siret: "12345678901234",
    name: "Hyper Corp",
    customizedName: "Hyper Corp nom personnalisé",
    voluntaryToImmersion: false,
    location: { lat: 48.8666, lon: 2.3333 },
    address: "55 rue du Faubourg Saint-Honoré",
    contactMode: "IN_PERSON",
    romeLabel: "Hyper métier",
    appellationLabels: ["Hyper", "Méga"],
    nafLabel: "",
    city: "xxxx",
  },
  {
    rome: "A0003",
    naf: defaultNaf,
    siret: "12345678901235",
    name: "Giga Corp",
    voluntaryToImmersion: false,
    location: { lat: 48.8666, lon: 2.3333 },
    address: "55 rue du Faubourg Saint-Honoré",
    contactMode: undefined,
    romeLabel: "Giga métier",
    appellationLabels: [],
    nafLabel: "",
    city: "xxxx",
  },
];
