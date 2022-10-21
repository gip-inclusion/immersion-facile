import { filter as ramdaFilter } from "ramda";
import { BehaviorSubject, delay, map, Observable, Subject } from "rxjs";
import {
  AddressDto,
  ContactEstablishmentRequestDto,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
  sleep,
} from "shared";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";

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
    searchParams: SearchImmersionQueryParamsDto,
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

  private simulateSearch(searchParams: SearchImmersionQueryParamsDto) {
    if (searchParams.voluntaryToImmersion === undefined) return this._results$;
    return this._results$.pipe(
      delay(this.simulatedLatency),
      map(
        ramdaFilter<SearchImmersionResultDto>(
          (result) =>
            result.voluntaryToImmersion === searchParams.voluntaryToImmersion,
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
const defaultAddress: AddressDto = {
  streetNumberAndAddress: "55 rue du Faubourg Saint-Honoré",
  postcode: "75001",
  city: "Paris",
  departmentCode: "75",
};
export const seedSearchResults: SearchImmersionResultDto[] = [
  {
    rome: "A0000",
    naf: defaultNaf,
    siret: "12345678901234",
    name: "Super Corp",
    voluntaryToImmersion: true,
    position: { lat: 48.8666, lon: 2.3333 },
    address: defaultAddress,
    contactMode: "EMAIL",
    romeLabel: "Super métier",
    appellationLabels: ["Facteur", "Développeuse"],
    nafLabel: "Métallurgie",
    website: "www.corp.com/job",
    additionalInformation:
      "Si vous aimez la métallurgie et la bonne bière, vous serez ravis !",
  },
  {
    rome: "A0001",
    naf: defaultNaf,
    siret: "12345678901234",
    name: "Mega Corp",
    customizedName: "Mega Corp nom personnalisé",
    voluntaryToImmersion: false,
    position: { lat: 48.8666, lon: 2.3333 },
    address: defaultAddress,
    contactMode: "PHONE",
    romeLabel:
      "Méga métier, avec un texte très long pour le décrire, et qui va peut-être aller à la ligne",
    appellationLabels: [],
    nafLabel: "Accueil et Restauration",
    numberOfEmployeeRange: "11-49",
    website: "www.mega-corp.com/job",
    additionalInformation:
      "Un texte super long qui donne des tonnes d'informations complémentaires sur l'immersion, les métiers proposés, tout ça... ",
  },
  {
    rome: "A0002",
    naf: defaultNaf,
    siret: "12345678901234",
    name: "Hyper Corp",
    customizedName: "Hyper Corp nom personnalisé",
    voluntaryToImmersion: false,
    position: { lat: 48.8666, lon: 2.3333 },
    address: defaultAddress,
    contactMode: "IN_PERSON",
    romeLabel: "Hyper métier",
    appellationLabels: ["Hyper", "Méga"],
    nafLabel: "",
  },
  {
    rome: "A0003",
    naf: defaultNaf,
    siret: "12345678901235",
    name: "Giga Corp",
    voluntaryToImmersion: false,
    position: { lat: 48.8666, lon: 2.3333 },
    address: defaultAddress,
    contactMode: undefined,
    romeLabel: "Giga métier",
    appellationLabels: [],
    nafLabel: "",
    website: "https://www.example.com",
  },
];
