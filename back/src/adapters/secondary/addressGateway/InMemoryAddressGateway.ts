import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  GeoPositionDto,
  LookupSearchResult,
} from "shared";
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";

export class InMemoryAddressGateway implements AddressGateway {
  private streetAndAddresses: AddressAndPosition[] = [];
  private lookupSearchResults: LookupSearchResult[] = [];
  private departmentCode: DepartmentCode = "";
  private _address?: AddressDto;
  private _position?: GeoPositionDto;

  public async lookupStreetAddress(
    _query: string,
  ): Promise<AddressAndPosition[]> {
    return this.streetAndAddresses;
  }

  public async lookupLocationName(
    _query: string,
  ): Promise<LookupSearchResult[]> {
    return this.lookupSearchResults;
  }

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    if (position.lat === 1111 && position.lon === 1111) throw new Error();
    return this._address;
  }

  // for test purposes only
  public setNextAddress(address: AddressDto | undefined) {
    this._address = address;
  }

  public setNextPosition(position: GeoPositionDto | undefined) {
    this._position = position;
  }

  public setAddressAndPosition(streetAndAddresses: AddressAndPosition[]) {
    this.streetAndAddresses = streetAndAddresses;
  }
  public setDepartmentCode(departmentCode: DepartmentCode) {
    this.departmentCode = departmentCode;
  }
  public setLookupSearchResults(lookupSearchResults: LookupSearchResult[]) {
    this.lookupSearchResults = lookupSearchResults;
  }
}
