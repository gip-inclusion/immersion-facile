import { CountyCode } from "shared/src/address/address.dto";
import {
  AddressWithCoordinates,
  ApiAdresseGateway,
} from "src/core-logic/ports/ApiAdresseGateway";

import { sleep } from "shared/src/utils";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryApiAdresseGateway implements ApiAdresseGateway {
  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressWithCoordinates[]> {
    //eslint-disable-next-line no-console
    console.log("InMemoryApiAddresseGateway.lookupStreetAddress", query);
    await sleep(SIMULATED_LATENCY_MS);

    if (query === "givemeanemptylistplease") return [];
    if (query === "givemeanerrorplease") throw new Error("418 I'm a teapot");

    return [
      {
        label: "60 Rue des Lombards 75001 Paris",
        coordinates: { lat: 45, lon: 2 },
        streetNumberAndAddress: "60 Rue des Lombards",
        postCode: "75001",
        city: "Paris",
        countyCode: "75",
      },
      {
        label: "81 Bd Gouvion-Saint-Cyr 75017 Paris",
        coordinates: { lat: 45.1, lon: 2.1 },
        streetNumberAndAddress: "81 Bd Gouvion-Saint-Cyr",
        postCode: "75017",
        city: "Paris",
        countyCode: "75",
      },
      {
        label: "71 Bd Saint-Michel 75005 Paris",
        coordinates: { lat: 46, lon: 2.5 },
        streetNumberAndAddress: "71 Bd Saint-Michel",
        postCode: "75005",
        city: "Paris",
        countyCode: "75",
      },
      {
        label: "5 Rue de la Huchette 75005 Paris",
        coordinates: { lat: 45.5, lon: 1.9 },
        streetNumberAndAddress: "5 Rue de la Huchette",
        postCode: "75005",
        city: "Paris",
        countyCode: "75",
      },
    ];
  }

  public async findCountyCodeFromPostCode(
    query: string,
  ): Promise<CountyCode | null> {
    //eslint-disable-next-line no-console
    console.log("InMemoryApiAddresseGateway.lookupPostCode", query);
    await sleep(SIMULATED_LATENCY_MS);

    if (query === "00000") return null;
    if (query === "99999") throw new Error("418 I'm a teapot");
    if (query === "21200") return "21";
    return query.slice(0, 2);
  }
}
