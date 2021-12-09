import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";
import {
  LatLonDto,
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
  searchImmersionResponseSchema,
} from "../../shared/SearchImmersionDto";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";
import { sleep } from "src/shared/utils";

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
        contactId: "contact_id",
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
        contactId: "contact_id2",
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
        contactId: "contact_id3",
        contactMode: "IN_PERSON",
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
