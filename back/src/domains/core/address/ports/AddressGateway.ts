import type {
  AddressDto,
  AddressWithCountryCodeAndPosition,
  GeoPositionDto,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(
    query: string,
    countryCode: SupportedCountryCode,
  ): Promise<AddressWithCountryCodeAndPosition[]>;
  lookupLocationName(query: LookupLocationInput): Promise<LookupSearchResult[]>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
