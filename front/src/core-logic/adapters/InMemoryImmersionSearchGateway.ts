import {
  LatLonDto,
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
  searchImmersionResponseSchema,
} from "./../../shared/SearchImmersionDto";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";
import { sleep } from "src/shared/utils";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryImmersionSearchGateway extends ImmersionSearchGateway {
  public async search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]> {
    console.log("search immersion: " + searchParams);
    await sleep(SIMULATED_LATENCY_MS);

    return [
      {
        id: "search_result_id",
        rome: searchParams.rome,
        naf: searchParams.nafDivision,
        siret: "12345678901234",
        name: "Super Corp",
        voluntary_to_immersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contact: {
          id: "contact_id",
          last_name: "LastName",
          first_name: "FirstName",
          email: "contact@supercorp.com",
          role: "batwoman",
          phone: "0640295453",
        },
      },
      {
        id: "search_result_id2",
        rome: searchParams.rome,
        naf: searchParams.nafDivision,
        siret: "12345678901234",
        name: "Mega Corp",
        voluntary_to_immersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contact: {
          id: "contact_id2",
          last_name: "LastName",
          first_name: "FirstName",
          email: "contact@megacorp.eu",
          role: "batmobile",
          phone: "0640295453",
        },
      },
      {
        id: "search_result_id3",
        rome: searchParams.rome,
        naf: searchParams.nafDivision,
        siret: "12345678901234",
        name: "Hyper Corp",
        voluntary_to_immersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contact: {
          id: "contact_id3",
          last_name: "LastName",
          first_name: "FirstName",
          email: "contact@hypercorp.fr",
          role: "batman",
          phone: "0640295453",
        },
      },
    ];
  }

  public async addressLookup(
    query: string,
  ): Promise<Array<LocationSuggestionDto>> {
    console.log("address lookup: " + query);
    await sleep(SIMULATED_LATENCY_MS);

    return [{ coordinates: { lat: 1.234, lon: 5.678 }, label: "Paris" }];
  }
}
