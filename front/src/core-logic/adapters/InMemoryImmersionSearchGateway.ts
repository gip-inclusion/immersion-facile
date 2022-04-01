import { SearchImmersionRequestDto } from "src/shared/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "src/shared/searchImmersion/SearchImmersionResult.dto";
import { sleep } from "src/shared/utils";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";

import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";

const DEFAULT_SIMULATED_LATENCY_MS = 500;

export class InMemoryImmersionSearchGateway implements ImmersionSearchGateway {
  private _results: SearchImmersionResultDto[];
  private readonly _simulatedLatency: number;
  private _error: Error | null = null;

  constructor(params?: {
    simulatedLatency?: number;
    defaultResults?: SearchImmersionResultDto[];
  }) {
    this._simulatedLatency =
      params?.simulatedLatency ?? DEFAULT_SIMULATED_LATENCY_MS;
    this._results = params?.defaultResults ?? seedResults;
  }

  public async search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]> {
    await sleep(this._simulatedLatency);
    if (this._error) throw this._error;
    return this._results;
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await sleep(this._simulatedLatency);
    if (this._error) throw this._error;
    return;
  }

  // test purpose
  setNextSearchResult(results: SearchImmersionResultDto[]) {
    this._results = results;
  }
  setError(error: Error) {
    this._error = error;
  }
}

const defaultNaf = "MyNaf";

const seedResults: SearchImmersionResultDto[] = [
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
    voluntaryToImmersion: true,
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
