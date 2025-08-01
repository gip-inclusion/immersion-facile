import {
  type AddressAndPosition,
  type AddressDto,
  errors,
  type GeoPositionDto,
  type LookupSearchResult,
  type SupportedCountryCode,
} from "shared";
import type { AddressGateway } from "../ports/AddressGateway";

export class InMemoryAddressGateway implements AddressGateway {
  #address?: AddressDto;

  #lookupSearchResults: LookupSearchResult[] = [];

  #nextLookupStreetAndAddresses: AddressAndPosition[][] = [];

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    if (position.lat === 1111 && position.lon === 1111)
      throw errors.generic.fakeError("getAddressFromPosition fake error");
    return this.#address;
  }

  public async lookupLocationName(
    _query: string,
  ): Promise<LookupSearchResult[]> {
    return this.#lookupSearchResults;
  }

  public async lookupStreetAddress(
    _query: string,
    _countryCode: SupportedCountryCode,
  ): Promise<AddressAndPosition[]> {
    const nextLookupStreetAndAddresses =
      this.#nextLookupStreetAndAddresses.shift();
    if (!nextLookupStreetAndAddresses)
      throw errors.generic.fakeError(
        "No nextLookupStreetAndAddresses provided.",
      );
    return nextLookupStreetAndAddresses;
  }

  public setNextLookupStreetAndAddresses(
    nextLookupStreetAndAddresses: AddressAndPosition[][],
  ) {
    this.#nextLookupStreetAndAddresses = nextLookupStreetAndAddresses;
  }

  public setLookupSearchResults(lookupSearchResults: LookupSearchResult[]) {
    this.#lookupSearchResults = lookupSearchResults;
  }

  // for test purposes only
  public setNextAddress(address: AddressDto | undefined) {
    this.#address = address;
  }
}

export const rueJacquardDto: AddressDto = {
  streetNumberAndAddress: "2 RUE JACQUARD",
  postcode: "69120",
  city: "VAULX-EN-VELIN",
  departmentCode: "69",
};

export const rueGuillaumeTellDto: AddressDto = {
  streetNumberAndAddress: "7 rue guillaume tell",
  postcode: "75017",
  city: "Paris",
  departmentCode: "75",
};

export const rueBitcheDto: AddressDto = {
  streetNumberAndAddress: "4 rue de Bitche",
  postcode: "44000",
  city: "Nantes",
  departmentCode: "44",
};

export const rueSaintHonoreDto: AddressDto = {
  streetNumberAndAddress: "55 rue de Faubourg Saint Honoré",
  postcode: "75008",
  city: "Paris",
  departmentCode: "75",
};

export const avenueChampsElyseesDto: AddressDto = {
  streetNumberAndAddress: "30 avenue des champs Elysées",
  departmentCode: "75",
  city: "Paris",
  postcode: "75017",
};
