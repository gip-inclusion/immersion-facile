import { from, Observable } from "rxjs";
import {
  AddressAndPosition,
  LookupLocationInput,
  LookupSearchResult,
  sleep,
} from "shared";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class InMemoryAddressGateway implements AddressGateway {
  constructor(private simulatedLatencyMs: number | undefined = undefined) {}

  private async lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);

    if (query === "givemeanemptylistplease") return [];
    if (query === "givemeanerrorplease") throw new Error("418 I'm a teapot");

    const testLocationSet = [
      {
        label: "Baralle, Pas-de-Calais, France",
        position: {
          lat: 50.21132,
          lon: 3.05763,
        },
      },
      {
        label: "Paris, Pas-de-Calais, France",
        position: {
          lat: 50.07605,
          lon: 2.93402,
        },
      },
      {
        label: "Poitiers, Vienne, France",
        position: {
          lat: 50.25129,
          lon: 2.54786,
        },
      },
      {
        label: "Saint-Emilion, Pas-de-Calais, France",
        position: {
          lat: 50.45684,
          lon: 2.61748,
        },
      },
      {
        label: "Uzerches, Meuse, France",
        position: {
          lat: 48.77127,
          lon: 5.16238,
        },
      },
    ];
    return testLocationSet;
  }
  public lookupLocation$(
    query: LookupLocationInput,
  ): Observable<LookupSearchResult[]> {
    return from(this.lookupLocation(query));
  }

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
}
