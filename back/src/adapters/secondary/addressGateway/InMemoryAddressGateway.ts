import {
  AddressAndPosition,
  AddressDto,
  GeoPositionDto,
  LookupSearchResult,
} from "shared";
import { AddressGateway } from "../../../domain/offer/ports/AddressGateway";

export class InMemoryAddressGateway implements AddressGateway {
  private _address?: AddressDto;

  private _position?: GeoPositionDto;

  private lookupSearchResults: LookupSearchResult[] = [];

  private streetAndAddresses: AddressAndPosition[] = [];

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    if (position.lat === 1111 && position.lon === 1111) throw new Error();
    return this._address;
  }

  public async lookupLocationName(
    _query: string,
  ): Promise<LookupSearchResult[]> {
    return this.lookupSearchResults;
  }

  public async lookupStreetAddress(
    _query: string,
  ): Promise<AddressAndPosition[]> {
    return this.streetAndAddresses;
  }

  public setAddressAndPosition(streetAndAddresses: AddressAndPosition[]) {
    this.streetAndAddresses = streetAndAddresses;
  }

  public setLookupSearchResults(lookupSearchResults: LookupSearchResult[]) {
    this.lookupSearchResults = lookupSearchResults;
  }

  // for test purposes only
  public setNextAddress(address: AddressDto | undefined) {
    this._address = address;
  }

  public setNextPosition(position: GeoPositionDto | undefined) {
    this._position = position;
  }
}
