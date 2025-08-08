import { from, type Observable } from "rxjs";
import {
  type AddressWithCountryCodeAndPosition,
  type LookupAddress,
  type LookupLocationInput,
  type LookupSearchResult,
  type SupportedCountryCode,
  sleep,
} from "shared";
import type { AddressGateway } from "src/core-logic/ports/AddressGateway";

export class InMemoryAddressGateway implements AddressGateway {
  constructor(private simulatedLatencyMs: number | undefined = undefined) {}

  public lookupLocation$(
    query: LookupLocationInput,
  ): Observable<LookupSearchResult[]> {
    return from(this.#lookupLocation(query));
  }

  public lookupStreetAddress$(
    lookup: LookupAddress,
    countryCode: SupportedCountryCode,
  ): Observable<AddressWithCountryCodeAndPosition[]> {
    return from(this.#lookupStreetAddress(lookup, countryCode));
  }

  async #lookupStreetAddress(
    lookup: LookupAddress,
    countryCode: SupportedCountryCode,
  ): Promise<AddressWithCountryCodeAndPosition[]> {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.log(
      "InMemoryApiAddresseGateway.lookupStreetAddress",
      lookup,
      countryCode,
    );
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
          countryCode: "FR",
        },
        position: { lat: 45, lon: 2 },
      },
      {
        address: {
          streetNumberAndAddress: "81 Bd Gouvion-Saint-Cyr",
          postcode: "75017",
          city: "Paris",
          departmentCode: "75",
          countryCode: "FR",
        },
        position: { lat: 45.1, lon: 2.1 },
      },
      {
        address: {
          streetNumberAndAddress: "71 Bd Saint-Michel",
          postcode: "75005",
          city: "Paris",
          departmentCode: "75",
          countryCode: "FR",
        },
        position: { lat: 46, lon: 2.5 },
      },
      {
        address: {
          streetNumberAndAddress: "5 Rue de la Huchette",
          postcode: "75005",
          city: "Paris",
          departmentCode: "75",
          countryCode: "FR",
        },
        position: { lat: 45.5, lon: 1.9 },
      },
      {
        address: {
          streetNumberAndAddress: "20 A KRONENSTRASSE",
          postcode: "30161",
          city: "Hannover",
          departmentCode: "99",
          countryCode: "DE",
        },
        position: { lat: 52.370216, lon: 9.73322 },
      },
    ];
  }

  async #lookupLocation(
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
}
