import {
  AddressAndPosition,
  AddressDto,
  GeoPositionDto,
  LookupLocationInput,
  LookupSearchResult,
} from "shared";

export interface AddressGateway {
  lookupStreetAddress(query: string): Promise<AddressAndPosition[]>;
  lookupLocationName(query: LookupLocationInput): Promise<LookupSearchResult[]>;
  getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined>;
}
