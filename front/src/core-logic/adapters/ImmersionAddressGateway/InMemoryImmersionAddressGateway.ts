import {
  AddressAndPosition,
  DepartmentCode,
} from "shared/src/address/address.dto";
import { sleep } from "shared/src/utils";
import { ImmersionAddressGateway } from "src/core-logic/ports/ImmersionAddressGateway";

export class InMemoryImmersionAddressGateway
  implements ImmersionAddressGateway
{
  constructor(private simulatedLatencyMs: number | undefined = undefined) {}

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    //eslint-disable-next-line no-console
    console.log("InMemoryApiAddresseGateway.lookupStreetAddress", lookup);
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);

    if (lookup === "givemeanemptylistplease") return [];
    if (lookup === "givemeanerrorplease") throw new Error("418 I'm a teapot");

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
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);

    if (query === "00000") return null;
    if (query === "99999") throw new Error("418 I'm a teapot");
    if (query === "21200") return "21";
    return query.slice(0, 2);
  }
}
