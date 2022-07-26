import { DepartmentCode } from "shared/src/address/address.dto";
import {
  AddressWithCoordinates,
  ApiAddressGateway,
} from "src/core-logic/ports/ApiAddressGateway";

import { sleep } from "shared/src/utils";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryApiAddressGateway implements ApiAddressGateway {
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
        postcode: "75001",
        city: "Paris",
        departmentCode: "75",
      },
      {
        label: "81 Bd Gouvion-Saint-Cyr 75017 Paris",
        coordinates: { lat: 45.1, lon: 2.1 },
        streetNumberAndAddress: "81 Bd Gouvion-Saint-Cyr",
        postcode: "75017",
        city: "Paris",
        departmentCode: "75",
      },
      {
        label: "71 Bd Saint-Michel 75005 Paris",
        coordinates: { lat: 46, lon: 2.5 },
        streetNumberAndAddress: "71 Bd Saint-Michel",
        postcode: "75005",
        city: "Paris",
        departmentCode: "75",
      },
      {
        label: "5 Rue de la Huchette 75005 Paris",
        coordinates: { lat: 45.5, lon: 1.9 },
        streetNumberAndAddress: "5 Rue de la Huchette",
        postcode: "75005",
        city: "Paris",
        departmentCode: "75",
      },
    ];
  }

  public async findDepartmentCodeFromPostCode(
    query: string,
  ): Promise<DepartmentCode | null> {
    //eslint-disable-next-line no-console
    console.log("InMemoryApiAddresseGateway.lookupPostCode", query);
    await sleep(SIMULATED_LATENCY_MS);

    if (query === "00000") return null;
    if (query === "99999") throw new Error("418 I'm a teapot");
    if (query === "21200") return "21";
    return query.slice(0, 2);
  }
}
