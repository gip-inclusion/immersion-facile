import { sleep } from "src/shared/utils";
import {
  AddressWithCoordinates,
  ApiAdresseGateway,
} from "./../ports/ApiAdresseGateway";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryApiAdresseGateway implements ApiAdresseGateway {
  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressWithCoordinates[]> {
    console.log("InMemoryApiAddresseGateway.lookupStreetAddress", query);
    await sleep(SIMULATED_LATENCY_MS);

    if (query === "givemeanemptylistplease") return [];
    if (query === "givemeanerrorplease") throw new Error("418 I'm a teapot");

    return [
      {
        label: "60 Rue des Lombards 75001 Paris",
        coordinates: { lat: 45, lon: 2 },
      },
      {
        label: "81 Bd Gouvion-Saint-Cyr 75017 Paris",
        coordinates: { lat: 45.1, lon: 2.1 },
      },
      {
        label: "71 Bd Saint-Michel 75005 Paris",
        coordinates: { lat: 46, lon: 2.5 },
      },
      {
        label: "5 Rue de la Huchette 75005 Paris",
        coordinates: { lat: 45.5, lon: 1.9 },
      },
    ];
  }
}
