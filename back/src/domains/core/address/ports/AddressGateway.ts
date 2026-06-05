import type {
  AddressAndPositionWithFormattedAddress,
  AddressDtoWithCountryCode,
  GeoPositionDto,
  LookupLocationInput,
  LookupSearchResult,
  SupportedCountryCode,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(
    query: string,
    countryCode: SupportedCountryCode,
  ): Promise<AddressAndPositionWithFormattedAddress[]>;
  lookupLocationName(query: LookupLocationInput): Promise<LookupSearchResult[]>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDtoWithCountryCode | undefined>;
}
