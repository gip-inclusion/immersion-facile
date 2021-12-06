import { sleep } from "src/shared/utils";
import { ApiAdresseGateway } from "./../ports/ApiAdresseGateway";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryApiAdresseGateway implements ApiAdresseGateway {
  public async lookupStreetAddress(query: string): Promise<string[]> {
    console.log("InMemoryApiAddresseGateway.lookupStreetAddress", query);
    await sleep(SIMULATED_LATENCY_MS);

    if (query === "givemeanemptylistplease") return [];
    if (query === "givemeanerrorplease") throw new Error("418 I'm a teapot");

    return [
      "60 Rue des Lombards 75001 Paris",
      "81 Bd Gouvion-Saint-Cyr 75017 Paris",
      "71 Bd Saint-Michel 75005 Paris",
      "5 Rue de la Huchette 75005 Paris",
    ];
  }
}
