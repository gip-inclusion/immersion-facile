import { delay, Observable, of } from "rxjs";
import { SearchImmersionResultDto, WithSiretAndAppellation } from "shared";
import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";

export class SimulatedImmersionOfferGateway implements ImmersionOfferGateway {
  #simulatedResponse: SearchImmersionResultDto = {
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

  constructor(private simulatedLatency: number = 0) {}

  public getImmersionOffer$(
    _params: WithSiretAndAppellation,
  ): Observable<SearchImmersionResultDto> {
    return of(this.#simulatedResponse).pipe(delay(this.simulatedLatency));
  }
}
