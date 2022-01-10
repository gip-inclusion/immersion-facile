import { sleep } from "src/shared/utils";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";
import {
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";

const SIMULATED_LATENCY_MS = 150;

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
        rome: searchParams.rome,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901234",
        name: "Super Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "EMAIL",
        romeLabel: "xxxx",
        nafLabel: "xxxx",
        city: "xxxx",
      },
      {
        id: "search_result_id2",
        rome: searchParams.rome,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901234",
        name: "Mega Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "PHONE",
        romeLabel: "xxxx",
        nafLabel: "xxxx",
        city: "xxxx",
      },
      {
        id: "search_result_id3",
        rome: searchParams.rome,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901234",
        name: "Hyper Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "IN_PERSON",
        romeLabel: "xxxx",
        nafLabel: "xxxx",
        city: "xxxx",
      },
      {
        id: "search_result_id4",
        rome: searchParams.rome,
        naf: searchParams.nafDivision ?? defaultNaf,
        siret: "12345678901235",
        name: "Giga Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactMode: "UNKNOWN",
        romeLabel: "xxxx",
        nafLabel: "xxxx",
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
