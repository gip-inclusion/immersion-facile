import { sleep } from "src/shared/utils";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";
import {
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";

const SIMULATED_LATENCY_MS = 500;

const defaultNaf = "MyNaf";

export class InMemoryImmersionSearchGateway implements ImmersionSearchGateway {
  public async search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]> {
    console.log("search immersion: " + searchParams);
    await sleep(SIMULATED_LATENCY_MS);

    return [
      {
        id: "search_result_id",
        rome: searchParams.rome!,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901234",
        name: "Super Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré, 75017 Paris",
        contactMode: "EMAIL",
        romeLabel: "Super métier",
        nafLabel: "Métallurgie",
        city: "xxxx",
      },
      {
        id: "search_result_id2",
        rome: searchParams.rome!,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901234",
        name: "Mega Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "PHONE",
        romeLabel:
          "Méga métier, avec un texte très long pour le décrire, et qui va peut-être aller à la ligne",
        nafLabel: "Accueil et Restauration",
        city: "xxxx",
        numberOfEmployeeRange: "11-49",
      },
      {
        id: "search_result_id3",
        rome: searchParams.rome!,
        naf: searchParams.nafDivision ?? defaultNaf,
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
      {
        id: "search_result_id4",
        rome: searchParams.rome!,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901235",
        name: "Giga Corp",
        voluntaryToImmersion: false,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "UNKNOWN",
        romeLabel: "Giga métier",
        nafLabel: "",
        city: "xxxx",
      },
    ];
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await sleep(SIMULATED_LATENCY_MS);
    return;
  }
}
