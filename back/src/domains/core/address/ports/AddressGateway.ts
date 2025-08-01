import type {
  AddressAndPosition,
  AddressDto,
  GeoPositionDto,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(
    query: string,
    countryCode: SupportedCountryCode,
  ): Promise<AddressAndPosition[]>;
  lookupLocationName(query: LookupLocationInput): Promise<LookupSearchResult[]>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
