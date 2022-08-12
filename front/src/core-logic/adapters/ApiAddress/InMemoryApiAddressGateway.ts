import { DepartmentCode } from "shared/src/address/address.dto";
import { ApiAddressGateway } from "src/core-logic/ports/ApiAddressGateway";

import { sleep } from "shared/src/utils";
import { AddressAndPosition } from "src/../../shared/src/apiAdresse/AddressAPI";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryApiAddressGateway implements ApiAddressGateway {
  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    //eslint-disable-next-line no-console
    console.log("InMemoryApiAddresseGateway.lookupStreetAddress", query);
    await sleep(SIMULATED_LATENCY_MS);

    if (query === "givemeanemptylistplease") return [];
    if (query === "givemeanerrorplease") throw new Error("418 I'm a teapot");

    return [
      {
        address: {
          streetNumberAndAddress: "60 Rue des Lombards",
          postcode: "75001",
          city: "Paris",
          departmentCode: "75",
        },
        position: { lat: 45, lon: 2 },
      },
      {
        address: {
          streetNumberAndAddress: "81 Bd Gouvion-Saint-Cyr",
          postcode: "75017",
          city: "Paris",
          departmentCode: "75",
        },
        position: { lat: 45.1, lon: 2.1 },
      },
      {
        address: {
          streetNumberAndAddress: "71 Bd Saint-Michel",
          postcode: "75005",
          city: "Paris",
          departmentCode: "75",
        },
        position: { lat: 46, lon: 2.5 },
      },
      {
        address: {
          streetNumberAndAddress: "5 Rue de la Huchette",
          postcode: "75005",
          city: "Paris",
          departmentCode: "75",
        },
        position: { lat: 45.5, lon: 1.9 },
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
